# EmailZone - Bulk Email Automation Platform

A fully-featured bulk email automation webapp for cold email campaigns with SMTP integration, advanced personalization, and comprehensive monitoring.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Firebase Configuration

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable **Firestore Database** (Start in production mode)
4. Enable **Authentication** → Sign-in method → Enable "Email/Password" and "Google"

#### Get Firebase Client SDK Config
1. In Firebase Console, go to Project Settings → General
2. Scroll to "Your apps" → Click Web icon (</>) to add a web app
3. Copy the config values to `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

#### Get Firebase Admin SDK Config
1. In Firebase Console, go to Project Settings → Service Accounts
2. Click "Generate new private key" → Download JSON file
3. Open the JSON file and copy these values to `.env.local`:
   - `FIREBASE_ADMIN_PROJECT_ID` (from `project_id`)
   - `FIREBASE_ADMIN_CLIENT_EMAIL` (from `client_email`)
   - `FIREBASE_ADMIN_PRIVATE_KEY` (from `private_key` - keep the quotes and newlines)

#### Deploy Firestore Security Rules
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules
```

### 3. Environment Variables
Copy `.env.local.example` to `.env.local` and fill in your Firebase credentials:
```bash
cp .env.local.example .env.local
```

Generate an encryption key:
```bash
openssl rand -hex 32
```

Add it to `.env.local` as `ENCRYPTION_KEY`.

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 5. Scheduled Campaigns (Optional)

For scheduled campaigns to work automatically, set up a cron job to hit:
```
GET http://localhost:3000/api/cron/process-campaigns
```

You can use:
- **Vercel Cron Jobs** (if deployed on Vercel)
- **External cron service** like cron-job.org
- **System cron** on your server

Example system cron (runs every 5 minutes):
```bash
*/5 * * * * curl http://localhost:3000/api/cron/process-campaigns
```

## Features

- **Authentication**: Email/password + Google OAuth
- **Recipient Management**: CSV upload + manual entry with dynamic field mapping
- **Email Templates**: Plain text, Rich text (WYSIWYG), and HTML modes
- **Personalization**: Multi-variable templates ({{name}}, {{email}}, {{company}}) with conditional content
- **Campaign Scheduling**: Send immediately or schedule for later
- **Rate Limiting**: Configurable emails/hour with automatic delays
- **Daily Quotas**: Set daily sending limits to avoid spam filters
- **Real-time Monitoring**: Live campaign stats and progress tracking
- **Email Logs**: Detailed logs with success/failure status
- **SMTP Integration**: Works with Gmail, Outlook, or any SMTP provider

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Firebase (Firestore + Auth)
- Nodemailer (SMTP)
- Tiptap (Rich text editor)
- PapaParse (CSV parsing)

## Project Structure

```
emailzone/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── campaigns/         # Campaign pages
│   ├── dashboard/         # Dashboard
│   ├── editor/            # Email template editor
│   ├── login/             # Authentication
│   ├── recipients/        # Recipient management
│   └── smtp-settings/     # SMTP configuration
├── lib/                    # Utility functions and configs
│   ├── firebase.ts        # Firebase client SDK
│   ├── firebase-admin.ts  # Firebase admin SDK
│   ├── email-sender.ts    # Email sending logic
│   ├── campaign-processor.ts  # Campaign processing
│   ├── template-parser.ts # Template variable parser
│   └── encryption.ts      # Password encryption
├── components/            # React components
├── firestore.rules        # Firestore security rules
└── .env.local            # Environment variables (not in git)
```

## Usage Guide

### 1. Create Account
- Sign up with email/password or Google
- You'll be redirected to the dashboard

### 2. Configure SMTP Settings
- Go to SMTP Settings
- Enter your email provider details:
  - **Gmail**: smtp.gmail.com, port 587, use App Password
  - **Outlook**: smtp-mail.outlook.com, port 587
- Test the connection before saving

### 3. Add Recipients
- **Manual Entry**: Add recipients one by one with custom fields
- **CSV Upload**: Upload a CSV file and map columns to variables
  - Required: Email column
  - Optional: Name, Company, or any custom fields

### 4. Create Campaign
- Click "Create Campaign" from dashboard
- Configure settings:
  - Campaign name
  - Rate limit (emails per hour)
  - Daily quota
  - Schedule (send now or later)
- Choose editor mode:
  - **Plain Text**: Simple text with variables
  - **Rich Text**: Formatted text with bold, italic, lists
  - **HTML**: Full HTML control
- Use variables: {{name}}, {{email}}, {{company}}
- Preview with sample data
- Save campaign

### 5. Send Campaign
- Go to Campaigns list
- Click on your campaign
- Review details and stats
- Click "Send Campaign"
- Monitor progress in real-time

### 6. Monitor Results
- View live stats: Total, Sent, Failed, Pending
- Check detailed email logs
- See error messages for failed emails

## Gmail Setup

To use Gmail as your SMTP provider:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the 16-character password
3. Use these settings:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Email: Your Gmail address
   - Password: The App Password (not your regular password)

## Best Practices

1. **Start Small**: Test with a few recipients first
2. **Rate Limiting**: Keep it under 100 emails/hour for Gmail
3. **Daily Quotas**: Gmail free accounts have ~500 emails/day limit
4. **Personalization**: Always use recipient names for better engagement
5. **Test Emails**: Send test emails to yourself before launching
6. **Monitor Logs**: Check for failures and adjust your approach

## Troubleshooting

**SMTP Connection Failed**
- Verify your credentials
- Check if 2FA is enabled (use App Password for Gmail)
- Ensure correct host and port
- Check firewall settings

**Emails Going to Spam**
- Add proper sender information
- Avoid spam trigger words
- Keep rate limits reasonable
- Warm up your sending domain

**Campaign Not Sending**
- Ensure you have recipients added
- Check SMTP configuration is saved
- Verify campaign status is not "paused"
- Check daily quota hasn't been reached

## Next Steps

After completing setup, the app will guide you through:
1. Creating your account
2. Configuring SMTP settings
3. Adding recipients
4. Creating email campaigns
5. Monitoring campaign performance
