import { useState } from "react";

import { type Candidate, type Stage, type StageId, request } from "./api";

const defaultMessage = `Hi {first_name},

Thanks for your time on the application! We'd like to move forward and will be in touch soon about next steps.

Best,
The hiring team`;

interface Result {
  candidate: Candidate;
  ok: boolean;
  error?: string;
}

export function MoveAndMessageModal(props: {
  candidates: Candidate[];
  stages: Stage[];
  onClose: () => void;
}) {
  const [toStage, setToStage] = useState<StageId>("interview");
  const [subject, setSubject] = useState("Next steps");
  const [message, setMessage] = useState(defaultMessage);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);

  const missing = props.candidates.filter((c) => !c.email && !emails[c.id]);

  const send = async (targets: Candidate[]) => {
    setSending(true);
    const next: Result[] = [];
    for (const candidate of targets) {
      try {
        if (!candidate.email && emails[candidate.id]) {
          await request(`/candidates/${candidate.id}/email`, {
            method: "PATCH",
            body: JSON.stringify({ email: emails[candidate.id] }),
          });
        }
        await request("/send", {
          method: "POST",
          body: JSON.stringify({ candidateId: candidate.id, toStage, subject, text: message }),
        });
        next.push({ candidate, ok: true });
      } catch (e) {
        // Timeouts are counted as failed so they can be retried too.
        next.push({ candidate, ok: false, error: (e as Error).message });
      }
    }
    setResults((previous) => [
      ...(previous ?? []).filter((r) => r.ok && !targets.includes(r.candidate)),
      ...next,
    ]);
    setSending(false);
  };

  const succeeded = results?.filter((r) => r.ok) ?? [];
  const failed = results?.filter((r) => !r.ok) ?? [];

  return (
    <div className="modal-backdrop">
      <div role="dialog" aria-labelledby="modal-title" className="modal">
        <h2 id="modal-title">Move and message</h2>

        {results === null ? (
          <>
            <label>
              Move to{" "}
              <select value={toStage} onChange={(e) => setToStage(e.target.value as StageId)}>
                {props.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <ul className="recipients">
              {props.candidates.map((c) => (
                <li key={c.id} className={!c.email && !emails[c.id] ? "missing" : undefined}>
                  {c.name}{" "}
                  {c.email ?? (
                    <input
                      placeholder="Email required"
                      value={emails[c.id] ?? ""}
                      onChange={(e) => setEmails({ ...emails, [c.id]: e.target.value })}
                    />
                  )}
                </li>
              ))}
            </ul>
            <label>
              Subject
              <input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </label>
            <label>
              Message
              <textarea rows={7} value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
            <button disabled={sending || missing.length > 0} onClick={() => send(props.candidates)}>
              {sending ? <span className="spinner" aria-label="Sending" /> : `Send to ${props.candidates.length}`}
            </button>
          </>
        ) : (
          <>
            <h3>Sent ({succeeded.length})</h3>
            <ul>{succeeded.map((r) => <li key={r.candidate.id}>{r.candidate.name}</li>)}</ul>
            {failed.length > 0 && (
              <>
                <h3>Failed ({failed.length})</h3>
                <ul>{failed.map((r) => <li key={r.candidate.id}>{r.candidate.name}: {r.error}</li>)}</ul>
                <button disabled={sending} onClick={() => send(failed.map((r) => r.candidate))}>
                  {sending ? <span className="spinner" aria-label="Sending" /> : "Retry failed"}
                </button>
              </>
            )}
          </>
        )}
        <button onClick={props.onClose}>Close</button>
      </div>
    </div>
  );
}
