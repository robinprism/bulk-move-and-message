# Bulk move and message

Take-home exercise for the Product Engineer role.

> **Fictional demo.** This repository was created for a product demo. The candidates in the app and
> the people who opened pull requests here are fictional.

## The task

The app shows a job's candidates. Let a recruiter select several of them, move them to a stage,
and send each one a next-step message.

The email provider in `server/email-provider.ts` sometimes rejects a recipient and sometimes times
out without telling you whether the email went out. Some candidates have no email address.

Show the recruiter what will happen before anything is sent, what actually happened after, and how
to recover without sending anyone the same email twice.

Please keep it to about 3 hours. Open a pull request and add a `NOTES.md` with your decisions. We
care more about your reasoning than about polish.

## Running it

```bash
npm install
npm run dev
```

The API runs on port 8787 and the web app on Vite's port, which proxies `/api`.

## What's here

- `server/data.ts`: candidates and stages, kept in memory.
- `server/email-provider.ts`: the fake provider. Read its header comment.
- `server/index.ts`: the API. `GET /api/debug/sent` lists every email the provider really sent.
- `web/`: a React page with the candidate table.
