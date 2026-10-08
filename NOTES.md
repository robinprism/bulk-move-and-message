# Notes

Maya Rao · about 3 hours

## What the recruiter sees, and how they recover

Before anything is sent, the recruiter sees one row per selected candidate: name, current stage,
new stage, and the email that will go out. A candidate without an email is marked "No email" with
an Add email action. That blocks only that person; the others can still go.

When the recruiter confirms, I save a send operation first, with one send key per candidate.
Clicking Confirm again reuses the same operation, so nothing is queued twice.

Moving the stage and sending the email are separate results. After a partial failure the screen
shows three groups: Sent, Failed, and Outcome unknown, each naming the candidates in it. Retry
failed resends only the definite failures, using the same send key, so the provider can drop a
duplicate. For an unknown outcome I check the provider's record for that send key before offering
another send. The summary reads like "8 sent, 1 failed, 1 awaiting confirmation". I never call
provider acceptance "delivered".

The message asks the candidate to reply with two or three times that work for them this week or
next, and says who they'll hear back from (the hiring manager, by name).

## What I'd build first for a team of three

First: the outbox with per-recipient send keys and the three result groups, because a duplicate or
a silently lost email is what hurts candidates and the team's reputation. I'd leave interview
scheduling manual: with one or two hires a quarter, a calendar integration costs more to maintain
than it saves. I'd also skip a template editor and use two fixed templates until we see which
messages people actually change.

## Known gaps

- Operations live in memory, like the rest of the starter. In production the operation and its
  recipients would be rows written in one transaction before any send.
- The provider's idempotency window is assumed to be long enough for a retry. A real provider's
  window is limited (often 24 hours); after that, "Check status" has to come before any resend.
- No tests for the timeout path yet; I checked it by hand with Kenji Sato's address.
