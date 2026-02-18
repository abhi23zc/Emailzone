# EmailZone

Bulk email sender for cold outreach. Upload contacts, write your pitch, hit send. That's it.

## Why I built this

Got tired of paying $50/month for email tools when I just needed to send campaigns. This does the job with your own SMTP and costs nothing to run.

## Features

- CSV upload or manual contact entry
- Template variables ({{name}}, {{company}}, etc.)
- Schedule sends or go immediately  
- Rate limiting so you don't get flagged
- Live stats on sent/failed emails
- Works with Gmail, Outlook, any SMTP really

## Running locally

```bash
npm install
cp .env.local.example .env.local
# add your firebase config
npm run dev
```

Hit localhost:3000 and you're in.

## Setup stuff

**Firebase**  
Make a project, turn on Firestore + Auth. Grab the config from project settings, paste into `.env.local`. Deploy the rules:

```bash
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

**SMTP (using Gmail)**  
Turn on 2FA, generate an app password (Google Account > Security > App passwords). Add it in the SMTP settings page:
- Host: smtp.gmail.com
- Port: 587  
- Your email + that 16-char password

**Encryption key**  
```bash
openssl rand -hex 32
```
Stick it in `.env.local` as `ENCRYPTION_KEY`

## Using it

1. Set up SMTP
2. Add your contacts (CSV or one by one)
3. Write your email with variables
4. Pick a rate limit (Gmail maxes at ~100/hour)
5. Send now or schedule it
6. Watch it go

## Scheduled campaigns

Needs a cron hitting `/api/cron/process-campaigns` every few minutes. On Vercel it's automatic (see `vercel.json`). Self-hosting? Add this:

```bash
*/5 * * * * curl http://localhost:3000/api/cron/process-campaigns
```

## Tech

Next.js 16, React 19, TypeScript, Tailwind, Firebase, Nodemailer

## Heads up

- Gmail free = ~500 emails/day max
- Test with small batches first
- Personalize your emails or they'll get ignored
- Check the logs if stuff breaks

## Deploying

Vercel is easiest. AWS works too. Just set your env vars and deploy.
