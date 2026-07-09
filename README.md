# Raymond Chuma-Onwuoku — Personal Website

Static personal site plus a small Node server that powers the **résumé-request flow**.
Requests are emailed directly to you over your own email account's SMTP — no
third-party form service is involved.

## Run locally

```bash
npm install
node server.js
# → http://localhost:4300
```

Without SMTP configured, the server still runs: each request is validated and
saved to `data/requests.jsonl`, and a warning is logged. Configure SMTP (below)
to have requests emailed to you instead.

## Enabling email delivery

1. Copy `.env.example` to `.env`.
2. Fill in your email provider's SMTP details:
   - **Google Workspace / Gmail:** `smtp.gmail.com`, port `587`, and an
     [App Password](https://myaccount.google.com/apppasswords) (not your normal password).
   - **Zoho / Fastmail:** port `465` with `SMTP_SECURE=true`.
3. Start the server with the env file loaded:

   ```bash
   node --env-file=.env server.js
   ```

The health check at `/api/health` reports whether SMTP is `configured`.

## How the flow works

- The **Résumé** nav link opens a modal (`Name`, `Company`, `Email`,
  `Why do you need my résumé?`).
- On submit, the form `POST`s to `/api/resume-request`.
- The server validates the input, appends it to `data/requests.jsonl` (so no
  request is ever lost), then emails it to `TO_EMAIL` with `replyTo` set to the
  requester — so you can reply straight from your inbox.
- The visitor sees a confirmation: you review each request personally and send
  the résumé if it's relevant, with a LinkedIn link for anything urgent.
- **You** decide whether to actually send your résumé. Nothing is exposed
  automatically.

## Structure

```
public/index.html      the site (single file: markup, styles, client JS)
server.js              express server: static hosting + /api/resume-request
data/requests.jsonl    captured requests (gitignored)
.env.example           SMTP configuration template
```
