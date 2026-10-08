import { serve } from "@hono/node-server";
import { Hono } from "hono";

import { candidates, findCandidate, isStage, stages } from "./data";
import { EmailRejected, EmailTimeout, sendEmail, sentEmails } from "./email-provider";

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

app.patch("/candidates/:id/email", async (c) => {
  const candidate = findCandidate(c.req.param("id"));
  if (!candidate) return c.json({ error: "Candidate not found" }, 404);
  const { email } = await c.req.json<{ email: string }>();
  candidate.email = email;
  return c.json(candidate);
});

// Moves one candidate and sends their message. The client calls this once per selected candidate.
app.post("/send", async (c) => {
  const { candidateId, toStage, subject, text } = await c.req.json<{
    candidateId: string;
    toStage: unknown;
    subject: string;
    text: string;
  }>();
  const candidate = findCandidate(candidateId);
  if (!candidate?.email) return c.json({ error: "Missing email" }, 400);
  if (!isStage(toStage)) return c.json({ error: "Unknown stage" }, 400);

  candidate.stage = toStage;
  const firstName = candidate.name.split(" ")[0];
  try {
    await sendEmail({ to: candidate.email, subject, text: text.replaceAll("{first_name}", firstName) });
    return c.json({ ok: true });
  } catch (error) {
    if (error instanceof EmailTimeout) return c.json({ error: "Timed out" }, 504);
    if (error instanceof EmailRejected) return c.json({ error: error.message }, 502);
    throw error;
  }
});

serve({ fetch: app.fetch, port: 8787 }, (info) => console.log(`API on http://localhost:${info.port}`));
