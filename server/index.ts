import { serve } from "@hono/node-server";
import { Hono } from "hono";

import { candidates, findCandidate, isStage, stages } from "./data";
import { sentEmails } from "./email-provider";
import {
  type Operation,
  addEmail,
  checkUnknown,
  confirm,
  createOperation,
  getOperation,
  retryFailed,
  summarize,
} from "./outbox";

const app = new Hono().basePath("/api");

app.get("/candidates", (c) => c.json({ candidates, stages }));

app.post("/candidates/:id/stage", async (c) => {
  const candidate = findCandidate(c.req.param("id"));
  if (!candidate) return c.json({ error: "Candidate not found" }, 404);
  const { stage } = await c.req.json<{ stage: unknown }>();
  if (!isStage(stage)) return c.json({ error: "Unknown stage" }, 400);
  candidate.stage = stage;
  return c.json(candidate);
});

// Everything the fake provider actually sent. Not part of the product; it's here so you can check for duplicates.
app.get("/debug/sent", (c) => c.json(sentEmails()));

const view = (operation: Operation) => ({ operation, summary: summarize(operation) });

// The request key comes from the client when the dialog opens, so a double click reuses the same operation.
app.post("/operations", async (c) => {
  const { requestKey, candidateIds, toStage } = await c.req.json<{
    requestKey: string;
    candidateIds: string[];
    toStage: unknown;
  }>();
  if (!isStage(toStage)) return c.json({ error: "Unknown stage" }, 400);
  return c.json(view(createOperation(requestKey, candidateIds, toStage)));
});

app.get("/operations/:id", (c) => {
  const operation = getOperation(c.req.param("id"));
  return operation ? c.json(view(operation)) : c.json({ error: "Operation not found" }, 404);
});

app.post("/operations/:id/email", async (c) => {
  const operation = getOperation(c.req.param("id"));
  if (!operation) return c.json({ error: "Operation not found" }, 404);
  const { candidateId, email } = await c.req.json<{ candidateId: string; email: string }>();
  if (!/^[^@\s]+@[^@\s]+$/.test(email)) return c.json({ error: "That doesn't look like an email address" }, 400);
  addEmail(operation, candidateId, email);
  return c.json(view(operation));
});

for (const [path, action] of [
  ["confirm", confirm],
  ["retry-failed", retryFailed],
  ["check-unknown", checkUnknown],
] as const) {
  app.post(`/operations/:id/${path}`, async (c) => {
    const operation = getOperation(c.req.param("id"));
    if (!operation) return c.json({ error: "Operation not found" }, 404);
    await action(operation);
    return c.json(view(operation));
  });
}

serve({ fetch: app.fetch, port: 8787 }, (info) => console.log(`API on http://localhost:${info.port}`));
