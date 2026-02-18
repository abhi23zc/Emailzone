# Quick Start Guide

Get EmailZone running in 10 minutes!

## Step 1: Install Dependencies (1 min)
```bash
cd /home/zrf/ABHI/Projects/emailzone
npm install
```

## Step 2: Firebase Setup (3 min)

### Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it "emailzone" (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create project"

### Enable Firestore
1. In Firebase Console, click "Firestore Database"
2. Click "Create database"
3. Select "Start in production mode"
4. Choose location (closest to you)
5. Click "Enable"

### Enable Authentication
1. Click "Authentication" in sidebar
2. Click "Get started"
3. Click "Email/Password" → Enable → Save
4. Click "Google" → Enable → Save

### Get Credentials
1. Click ⚙️ (Settings) → Project settings
2. Scroll to "Your apps" → Click Web icon (</>)
3. Register app name: "emailzone-web"
4. Copy the config values

## Step 3: Configure Environment (2 min)

Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and paste your Firebase config:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Get Admin SDK Credentials
1. In Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download JSON file
4. Open it and copy values to `.env.local`:
```env
FIREBASE_ADMIN_PROJECT_ID=value_from_json
FIREBASE_ADMIN_CLIENT_EMAIL=value_from_json
FIREBASE_ADMIN_PRIVATE_KEY="value_from_json"
```

### Generate Encryption Key
```bash
openssl rand -hex 32
```
Add to `.env.local`:
```env
ENCRYPTION_KEY=generated_key_here
```

## Step 4: Deploy Firestore Rules (2 min)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init firestore
# Select: Use existing project
# Choose: your project
# Accept default files

# Deploy rules
firebase deploy --only firestore:rules
```

## Step 5: Start Development Server (1 min)
```bash
npm run dev
```

Open http://localhost:3000

## Step 6: First Campaign (5 min)

### 1. Create Account
- Click "Sign up"
- Enter email and password
- You'll see the dashboard

### 2. Configure SMTP (Gmail Example)
- Click "SMTP Settings"
- Enter:
  - Host: `smtp.gmail.com`
  - Port: `587`
  - Uncheck SSL/TLS
  - Email: your Gmail
  - Password: [Generate App Password](https://myaccount.google.com/apppasswords)
- Click "Test Connection"
- Click "Save Configuration"

### 3. Add Recipients
- Click "Recipients"
- Click "Add Recipient"
- Enter:
  - Email: your-test-email@example.com
  - Custom field "name": Your Name
  - Custom field "company": Your Company
- Click "Add Recipient"

### 4. Create Campaign
- Click "Create Campaign"
- Enter:
  - Campaign Name: "Test Campaign"
  - Rate Limit: 10
  - Daily Quota: 100
  - Subject: "Hello {{name}}"
  - Body: "Hi {{name}}, testing from {{company}}!"
- Click "Save Campaign"

### 5. Send Campaign
- Click "Campaigns"
- Click on your campaign
- Click "Send Campaign"
- Confirm
- Watch it send in real-time!

## Troubleshooting

**Can't connect to SMTP?**
- For Gmail, you MUST use an App Password, not your regular password
- Go to https://myaccount.google.com/apppasswords
- Generate a new password
- Use that in SMTP settings

**Firebase errors?**
- Make sure all environment variables are set
- Check for typos in `.env.local`
- Restart dev server after changing env vars

**Campaign not sending?**
- Check SMTP config is saved
- Make sure you have recipients
- Check browser console for errors

## What's Next?

✅ **You're ready to use EmailZone!**

Try these features:
- Upload CSV with multiple recipients
- Use Rich Text editor for formatted emails
- Schedule campaigns for later
- Monitor real-time sending progress
- Check email logs for delivery status

## Need Help?

Check these files:
- `README.md` - Full documentation
- `IMPLEMENTATION.md` - Technical details
- `TESTING.md` - Testing guide

## Production Deployment

When ready for production:
1. Deploy to Vercel/Netlify
2. Set environment variables in hosting platform
3. Set up cron job for scheduled campaigns
4. Configure custom domain
5. Review Firestore security rules

**Enjoy sending emails at scale! 🚀**
