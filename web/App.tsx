import { useEffect, useState } from "react";

import { type Candidate, type Stage, loadCandidates } from "./api";
import { MoveAndMessageModal } from "./MoveAndMessageModal";

export function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);

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
          <button disabled={selected.size === 0} onClick={() => setModalOpen(true)}>
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
      {modalOpen && (
        <MoveAndMessageModal
          candidates={candidates.filter((c) => selected.has(c.id))}
          stages={stages}
          onClose={() => {
            setModalOpen(false);
            setSelected(new Set());
            refresh();
          }}
        />
      )}
    </main>
  );
}
