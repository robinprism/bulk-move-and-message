import { useEffect, useState } from "react";

import { type Candidate, type Stage, type StageId, loadCandidates } from "./api";
import { BulkMoveDialog } from "./BulkMoveDialog";

export function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toStage, setToStage] = useState<StageId>("interview");
  const [dialogFor, setDialogFor] = useState<string[] | null>(null);

  const refresh = () =>
    loadCandidates().then((data) => {
      setCandidates(data.candidates);
      setStages(data.stages);
    });

  useEffect(() => {
    refresh();
  }, []);

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const stageName = (id: string) => stages.find((s) => s.id === id)?.name ?? id;

  return (
    <main>
      <header>
        <h1>Product Engineer</h1>
        <div className="toolbar">
          <span>{selected.size} selected</span>
          <label>
            Move to{" "}
            <select value={toStage} onChange={(e) => setToStage(e.target.value as StageId)}>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <button disabled={selected.size === 0} onClick={() => setDialogFor([...selected])}>
            Move and message…
          </button>
        </div>
      </header>
      <table>
        <thead>
          <tr>
            <th aria-label="Select" />
            <th>Name</th>
            <th>Email</th>
            <th>Stage</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.id}>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Select ${candidate.name}`}
                  checked={selected.has(candidate.id)}
                  onChange={() => toggle(candidate.id)}
                />
              </td>
              <td>{candidate.name}</td>
              <td>{candidate.email ?? <span className="muted">No email</span>}</td>
              <td>{stageName(candidate.stage)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {dialogFor && (
        <BulkMoveDialog
          candidateIds={dialogFor}
          toStage={toStage}
          stages={stages}
          onClose={() => {
            setDialogFor(null);
            setSelected(new Set());
            refresh();
          }}
        />
      )}
    </main>
  );
}
