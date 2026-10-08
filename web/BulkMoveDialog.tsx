import { useEffect, useState } from "react";

import { type Stage, type StageId, request } from "./api";

type Outcome = "ready" | "no_email" | "sent" | "failed" | "unknown";

interface Recipient {
  candidateId: string;
  name: string;
  email: string | null;
  fromStage: StageId;
  stageMoved: boolean;
  message: { subject: string; text: string };
  outcome: Outcome;
  error?: string;
}

interface OperationView {
  operation: { id: string; toStage: StageId; status: "draft" | "confirmed"; recipients: Recipient[] };
  summary: { sent: number; failed: number; unknown: number; noEmail: number };
}

export function BulkMoveDialog(props: {
  candidateIds: string[];
  toStage: StageId;
  stages: Stage[];
  onClose: () => void;
}) {
  // One key per opened dialog: double clicks and retries of this request map to one operation.
  const [requestKey] = useState(() => crypto.randomUUID());
  const [view, setView] = useState<OperationView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    request<OperationView>("/operations", {
      method: "POST",
      body: JSON.stringify({ requestKey, candidateIds: props.candidateIds, toStage: props.toStage }),
    }).then(setView, (e: Error) => setError(e.message));
  }, [requestKey, props.candidateIds, props.toStage]);

  const run = async (path: string, body?: object) => {
    if (!view) return;
    setBusy(true);
    setError(null);
    try {
      setView(await request<OperationView>(`/operations/${view.operation.id}/${path}`, {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!view) return <div role="dialog" className="dialog">{error ?? "Preparing preview…"}</div>;

  const { operation, summary } = view;
  const stageName = (id: StageId) => props.stages.find((s) => s.id === id)?.name ?? id;
  const ready = operation.recipients.filter((r) => r.outcome === "ready");
  const group = (outcome: Outcome) => operation.recipients.filter((r) => r.outcome === outcome);

  return (
    <div role="dialog" aria-labelledby="bulk-title" className="dialog">
      <h2 id="bulk-title">
        Move to {stageName(operation.toStage)} and message {operation.recipients.length} candidates
      </h2>

      {operation.status === "draft" ? (
        <>
          <table>
            <thead>
              <tr><th>Candidate</th><th>Stage</th><th>Email</th></tr>
            </thead>
            <tbody>
              {operation.recipients.map((r) => (
                <tr key={r.candidateId}>
                  <td>{r.name}</td>
                  <td>{stageName(r.fromStage)} → {stageName(operation.toStage)}</td>
                  <td>
                    {r.outcome === "no_email"
                      ? <AddEmail disabled={busy} onAdd={(email) => run("email", { candidateId: r.candidateId, email })} />
                      : r.email}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {summary.noEmail > 0 && (
            <p className="muted">
              {summary.noEmail} without an email won't be moved or messaged. Everyone else can still go.
            </p>
          )}
          {ready[0] && (
            <details open>
              <summary>Message ({ready[0].message.subject})</summary>
              <pre>{ready[0].message.text}</pre>
            </details>
          )}
          <button disabled={busy || ready.length === 0} onClick={() => run("confirm")}>
            Move and send to {ready.length}
          </button>
        </>
      ) : (
        <>
          <p>
            {summary.sent} sent, {summary.failed} failed, {summary.unknown} awaiting confirmation
            {summary.noEmail > 0 && `, ${summary.noEmail} skipped (no email)`}
          </p>
          <p className="muted">Sent means the email provider accepted it, not that it reached the inbox.</p>
          <Group title="Sent" recipients={group("sent")} />
          <Group title="Failed" recipients={group("failed")}>
            <button disabled={busy} onClick={() => run("retry-failed")}>Retry failed</button>
          </Group>
          <Group title="Outcome unknown" recipients={group("unknown")}>
            <button disabled={busy} onClick={() => run("check-unknown")}>Check status</button>
          </Group>
          <p className="muted">Stage changes stay in place if an email fails; retrying only resends the email.</p>
        </>
      )}

      {error && <p role="alert">{error}</p>}
      <button onClick={props.onClose}>Close</button>
    </div>
  );
}

function Group(props: { title: string; recipients: Recipient[]; children?: React.ReactNode }) {
  if (props.recipients.length === 0) return null;
  return (
    <section>
      <h3>{props.title} ({props.recipients.length})</h3>
      <ul>
        {props.recipients.map((r) => (
          <li key={r.candidateId}>{r.name}{r.error && <span className="muted"> · {r.error}</span>}</li>
        ))}
      </ul>
      {props.children}
    </section>
  );
}

function AddEmail(props: { disabled: boolean; onAdd: (email: string) => void }) {
  const [email, setEmail] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); props.onAdd(email); }}>
      <span className="warning">No email</span>{" "}
      <input aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button disabled={props.disabled || !email}>Add email</button>
    </form>
  );
}
