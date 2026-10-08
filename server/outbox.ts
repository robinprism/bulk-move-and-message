import { type StageId, findCandidate } from "./data";
import { EmailRejected, EmailTimeout, findEmail, sendEmail } from "./email-provider";
import { type RenderedMessage, renderNextStep } from "./templates";

// A send operation is saved before the provider is contacted. Each recipient gets its own send key,
// which is also the provider's idempotency key, so a retry can never produce a second email.

export type Outcome = "ready" | "no_email" | "sent" | "failed" | "unknown";

export interface Recipient {
  candidateId: string;
  name: string;
  email: string | null;
  sendKey: string;
  fromStage: StageId;
  stageMoved: boolean;
  message: RenderedMessage;
  outcome: Outcome;
  error?: string;
}

export interface Operation {
  id: string;
  toStage: StageId;
  status: "draft" | "confirmed";
  recipients: Recipient[];
}

const operations = new Map<string, Operation>();
const operationByRequestKey = new Map<string, string>();

/** Creates the preview. The same request key always returns the same operation. */
export function createOperation(requestKey: string, candidateIds: string[], toStage: StageId): Operation {
  const existing = operationByRequestKey.get(requestKey);
  if (existing) return operations.get(existing)!;

  const id = crypto.randomUUID();
  const recipients = candidateIds.flatMap((candidateId) => {
    const candidate = findCandidate(candidateId);
    if (!candidate) return [];
    return [{
      candidateId,
      name: candidate.name,
      email: candidate.email,
      sendKey: `${id}:${candidateId}`,
      fromStage: candidate.stage,
      stageMoved: false,
      message: renderNextStep(candidate),
      outcome: candidate.email ? "ready" : "no_email",
    } satisfies Recipient];
  });
  const operation: Operation = { id, toStage, status: "draft", recipients };
  operations.set(id, operation);
  operationByRequestKey.set(requestKey, id);
  return operation;
}

export const getOperation = (id: string) => operations.get(id);

/** Adding an email in the preview only unblocks that one person. */
export function addEmail(operation: Operation, candidateId: string, email: string) {
  const recipient = operation.recipients.find((r) => r.candidateId === candidateId);
  const candidate = findCandidate(candidateId);
  if (!recipient || !candidate || recipient.outcome !== "no_email") return;
  candidate.email = email;
  recipient.email = email;
  recipient.outcome = "ready";
}

/** Runs every recipient that is ready. Calling it twice does nothing new for recipients already handled. */
export async function confirm(operation: Operation) {
  operation.status = "confirmed";
  await sendTo(operation, operation.recipients.filter((r) => r.outcome === "ready"));
}

/** Resends only definite failures, with the same send key. */
export async function retryFailed(operation: Operation) {
  await sendTo(operation, operation.recipients.filter((r) => r.outcome === "failed"));
}

/** For a timeout we don't know if the email went out, so ask the provider before offering another send. */
export async function checkUnknown(operation: Operation) {
  for (const recipient of operation.recipients.filter((r) => r.outcome === "unknown")) {
    const found = await findEmail(recipient.sendKey);
    recipient.outcome = found ? "sent" : "failed";
    recipient.error = found ? undefined : "The provider has no record of this email";
  }
}

async function sendTo(operation: Operation, recipients: Recipient[]) {
  await Promise.all(
    recipients.map(async (recipient) => {
      const candidate = findCandidate(recipient.candidateId);
      if (!candidate || !recipient.email) return;
      // The stage move is its own result: a failed email never undoes it, and a retry never repeats it.
      if (!recipient.stageMoved) {
        candidate.stage = operation.toStage;
        recipient.stageMoved = true;
      }
      try {
        await sendEmail({ to: recipient.email, ...recipient.message, idempotencyKey: recipient.sendKey });
        recipient.outcome = "sent";
        recipient.error = undefined;
      } catch (error) {
        recipient.outcome = error instanceof EmailTimeout ? "unknown" : "failed";
        recipient.error = error instanceof EmailRejected || error instanceof EmailTimeout
          ? error.message
          : "Unexpected error";
      }
    }),
  );
}

/** "8 sent, 1 failed, 1 awaiting confirmation". Sent means the provider accepted it, not that it was delivered. */
export function summarize(operation: Operation) {
  const count = (outcome: Outcome) => operation.recipients.filter((r) => r.outcome === outcome).length;
  return { sent: count("sent"), failed: count("failed"), unknown: count("unknown"), noEmail: count("no_email") };
}
