export type StageId = "new" | "shortlisted" | "assignment" | "interview" | "archived";

export interface Candidate {
  id: string;
  name: string;
  email: string | null;
  stage: StageId;
}

export interface Stage {
  id: StageId;
  name: string;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body as T;
}

export const loadCandidates = () => request<{ candidates: Candidate[]; stages: Stage[] }>("/candidates");
