# Raymond Chuma-Onwuoku — Personal Website

Personal site with résumé-request, contact, and newsletter flows. Submissions
are emailed directly to you over your own email account's SMTP — no third-party
form service is involved.

The same request-handling logic lives in `lib/` and is used two ways:

- **Locally** by an Express server (`server.js`), which also writes a backup
  copy of each submission to `data/*.jsonl`.
- **In production on Vercel** by serverless functions in `api/`.

## Run locally

```bash
npm install
node server.js
# → http://localhost:4300
```

Without SMTP configured, the server still runs: each request is validated,
saved to `data/*.jsonl`, and logged. Configure SMTP (below) to have requests
emailed to you.

## Enabling email delivery

1. Copy `.env.example` to `.env` and fill in your provider's SMTP details:
   - **Google Workspace / Gmail:** `smtp.gmail.com`, port `587`, and an
     [App Password](https://myaccount.google.com/apppasswords) (not your login password).
   - **Zoho / Fastmail:** port `465` with `SMTP_SECURE=true`.
2. Run with the env file loaded:

   ```bash
   node --env-file=.env server.js
   ```

`/api/health` reports whether SMTP is `configured`.

## Deploying to Vercel

1. Push this repo to GitHub, then import it at [vercel.com/new](https://vercel.com/new).
   No framework preset or build command is needed — `vercel.json` handles it
   (static `public/index.html` + serverless functions in `api/`).
2. In **Project → Settings → Environment Variables**, add (for Production):
   `TO_EMAIL`, `FROM_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`,
   `SMTP_USER`, `SMTP_PASS`. Do **not** set `PORT`.
3. Deploy, then visit `/api/health` — it should report `smtp: "configured"`.
4. **Custom domain:** Project → Settings → Domains → add your domain, then add
   the DNS record Vercel shows you at your registrar. HTTPS is automatic.

> **Note:** On Vercel the filesystem isn't writable, so the `data/*.jsonl`
> backup logging does **not** run — email is the delivery path. Set the SMTP
> env vars before going live so no submissions are lost.

## Endpoints

| Route                  | Purpose                                    |
| ---------------------- | ------------------------------------------ |
| `POST /api/resume-request` | Résumé request (name, company, email, reason) |
| `POST /api/contact`        | Contact message (name, email, org, topic, source, message) |
| `POST /api/subscribe`      | Optional first-party signup capture (unused; live newsletter uses the Substack embed) |
| `GET  /api/health`         | Reports SMTP configuration status          |

Each validates input, emails `TO_EMAIL` with `replyTo` set to the sender, and
returns `{ ok: true }`. You review and respond from your inbox — nothing (résumé
included) is exposed automatically.

## Structure

```
public/index.html   the site (single file: markup, styles, client JS)
lib/mailer.js       SMTP transport + validation/escaping helpers
lib/api.js          shared request handlers (résumé, contact, subscribe)
api/*.js            Vercel serverless functions (thin wrappers over lib/)
server.js           local Express server: static hosting + API + file logging
vercel.json         static + serverless routing for Vercel
data/*.jsonl        local submission backups (gitignored)
.env.example        SMTP configuration template
```
