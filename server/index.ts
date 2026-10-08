import { serve } from "@hono/node-server";
import { Hono } from "hono";

import { candidates, findCandidate, isStage, stages } from "./data";
import { sentEmails } from "./email-provider";

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

// TODO: your bulk move-and-message endpoints.

serve({ fetch: app.fetch, port: 8787 }, (info) => console.log(`API on http://localhost:${info.port}`));
