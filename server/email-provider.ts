// A stand-in for a real email API. It behaves like one in the ways that matter for this task:
// - addresses at bounce.example are rejected;
// - requests to slow.example time out, although the email WAS sent;
// - a request with an idempotency key it has already accepted returns the first result instead of
//   sending again.

export interface EmailRequest {
  to: string;
  subject: string;
  text: string;
  idempotencyKey?: string;
}

export interface EmailAccepted {
  id: string;
}

export class EmailRejected extends Error {}
export class EmailTimeout extends Error {}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const sent: Array<EmailRequest & EmailAccepted & { at: string }> = [];
const acceptedByKey = new Map<string, EmailAccepted>();

export async function sendEmail(request: EmailRequest): Promise<EmailAccepted> {
  await delay(300);
  const previous = request.idempotencyKey && acceptedByKey.get(request.idempotencyKey);
  if (previous) return previous;

  const domain = request.to.split("@")[1];
  if (domain === "bounce.example") throw new EmailRejected(`${request.to} was rejected`);

  const accepted = { id: crypto.randomUUID() };
  sent.push({ ...request, ...accepted, at: new Date().toISOString() });
  if (request.idempotencyKey) acceptedByKey.set(request.idempotencyKey, accepted);

  if (domain === "slow.example") {
    await delay(2000);
    throw new EmailTimeout("No response from the provider after 2 seconds");
  }
  return accepted;
}

/** Looks up a request by its idempotency key. `null` means the provider never accepted it. */
export async function findEmail(idempotencyKey: string): Promise<EmailAccepted | null> {
  await delay(150);
  return acceptedByKey.get(idempotencyKey) ?? null;
}

/** Every email the provider actually sent, oldest first. Useful for spotting duplicates. */
export const sentEmails = () => [...sent];
