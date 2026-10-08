# Notes

Arun Mehta · about 2.5 hours

## How it works

The recruiter selects candidates in the table and clicks Move and message. A preview modal lists
the names and shows the message. Rows with a missing email are highlighted in red and the
recruiter has to fill them in before sending.

While sending, the button shows a spinner and is disabled until the request finishes, so retries
are idempotent: clicking twice won't double-send.

If some emails fail, the results modal shows successful candidates in one list and failed ones in
another, with a Retry failed button. Timeouts are counted as failed so the recruiter can retry them
too. The message text stays in the form so it doesn't have to be retyped.

The message thanks the candidate and says we'd like to move forward and will be in touch soon about
next steps.

## What I'd build first

I'd start with the bulk action and the preview, since that's where recruiters spend their time.
Scheduling stays manual for now. Later we could add a workflow builder so teams can configure their
own stages and automatic messages. That would take some setup, but it would scale better.

## If I had more time

- Send in parallel instead of one by one, with a progress bar.
- Keyboard shortcuts for select all and send.
- Save message templates per stage.
