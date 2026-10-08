export type StageId = "new" | "shortlisted" | "assignment" | "interview" | "archived";

export const stages: ReadonlyArray<{ id: StageId; name: string }> = [
  { id: "new", name: "New" },
  { id: "shortlisted", name: "Shortlisted" },
  { id: "assignment", name: "Assignment" },
  { id: "interview", name: "Interview" },
  { id: "archived", name: "Archived" },
];

export interface Candidate {
  id: string;
  name: string;
  email: string | null;
  stage: StageId;
}

// Fictional people. Addresses use reserved example domains; see email-provider.ts for how each behaves.
export const candidates: Candidate[] = [
  { id: "c1", name: "Priya Nair", email: "priya.nair@example.com", stage: "assignment" },
  { id: "c2", name: "Daniel Okoro", email: "daniel.okoro@example.com", stage: "assignment" },
  { id: "c3", name: "Mei Lin", email: "mei.lin@example.com", stage: "assignment" },
  { id: "c4", name: "Rahul Verma", email: null, stage: "assignment" },
  { id: "c5", name: "Sara Haddad", email: "sara.haddad@example.com", stage: "assignment" },
  { id: "c6", name: "Ola Nowak", email: "ola.nowak@bounce.example", stage: "assignment" },
  { id: "c7", name: "Kenji Sato", email: "kenji.sato@slow.example", stage: "assignment" },
  { id: "c8", name: "Tomás Ruiz", email: "tomas.ruiz@example.com", stage: "shortlisted" },
];

export const findCandidate = (id: string) => candidates.find((c) => c.id === id);

export const isStage = (value: unknown): value is StageId =>
  stages.some((s) => s.id === value);
