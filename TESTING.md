# Testing Guide for EmailZone

## Prerequisites
- Firebase project configured
- `.env.local` filled with credentials
- Development server running (`npm run dev`)

## Test Scenarios

### 1. Authentication Flow
**Test Email/Password Signup**
1. Go to http://localhost:3000
2. Click "Sign up"
3. Enter email and password (min 6 characters)
4. Should redirect to dashboard

**Test Google OAuth**
1. Go to login page
2. Click "Sign in with Google"
3. Select Google account
4. Should redirect to dashboard

**Test Logout**
1. Click "Logout" in navigation
2. Should redirect to login page

### 2. SMTP Configuration
**Test Gmail Setup**
1. Go to SMTP Settings
2. Enter:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Uncheck SSL/TLS
   - Email: Your Gmail
   - Password: App Password (not regular password)
3. Click "Test Connection"
4. Should show success message
5. Click "Save Configuration"

**Generate Gmail App Password**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to App passwords
4. Generate password for "Mail"
5. Copy 16-character password

### 3. Recipient Management
**Test Manual Entry**
1. Go to Recipients page
2. Click "Add Recipient"
3. Enter email
4. Add custom fields:
   - name: John Doe
   - company: Acme Inc
5. Click "Add Recipient"
6. Should appear in list

**Test CSV Upload**
1. Create CSV file:
```csv
email,name,company
john@example.com,John Doe,Acme Inc
jane@example.com,Jane Smith,Tech Corp
```
2. Click "Upload CSV"
3. Select file
4. Map columns:
   - Email Column: email
   - Name Column: name
   - Company Column: company
5. Click "Import Recipients"
6. Should show success message

**Test Delete**
1. Click "Delete" on a recipient
2. Confirm deletion
3. Should be removed from list

### 4. Campaign Creation
**Test Plain Text Campaign**
1. Go to Dashboard → Create Campaign
2. Enter campaign name: "Test Campaign"
3. Set rate limit: 10 emails/hour
4. Set daily quota: 100
5. Select "Save as draft"
6. Keep "Plain Text" mode selected
7. Enter subject: "Hello {{name}}"
8. Enter body:
```
Hi {{name}},

I noticed you work at {{company}}.

Best regards
```
9. Check preview updates
10. Click "Save Campaign"
11. Should redirect to campaigns list

**Test Rich Text Campaign**
1. Create new campaign
2. Select "Rich Text" mode
3. Use formatting buttons (Bold, Italic, Lists)
4. Insert variables
5. Preview should show formatted HTML
6. Save campaign

**Test HTML Campaign**
1. Create new campaign
2. Select "HTML" mode
3. Enter HTML:
```html
<p>Hi {{name}},</p>
<p>I noticed you work at <strong>{{company}}</strong>.</p>
<p>Best regards</p>
```
4. Preview should render HTML
5. Save campaign

### 5. Sending Campaigns
**Test Send Campaign**
1. Go to Campaigns list
2. Click on a draft campaign
3. Review details
4. Click "Send Campaign"
5. Confirm
6. Should show "Campaign started" message
7. Stats should update in real-time:
   - Total: Number of recipients
   - Sent: Incrementing
   - Pending: Decreasing

**Monitor Progress**
1. Stay on campaign detail page
2. Page auto-refreshes every 5 seconds
3. Watch email logs populate
4. Check for any failed emails
5. Status should change to "completed" when done

**Test Rate Limiting**
1. Create campaign with rate limit: 10/hour
2. Add 5 recipients
3. Send campaign
4. Note timestamps in logs
5. Should have ~6 minute delays between emails

### 6. Scheduled Campaigns
**Test Scheduling**
1. Create new campaign
2. Select "Schedule for later"
3. Pick date/time 2 minutes in future
4. Save campaign
5. Status should be "scheduled"

**Test Cron Processing**
1. Wait for scheduled time
2. Manually trigger cron:
```bash
curl http://localhost:3000/api/cron/process-campaigns
```
3. Campaign should start sending
4. Status should change to "running"

### 7. Error Scenarios
**Test Invalid SMTP**
1. Enter wrong SMTP credentials
2. Click "Test Connection"
3. Should show error message

**Test No Recipients**
1. Delete all recipients
2. Try to send campaign
3. Should show "No recipients found" error

**Test Daily Quota**
1. Set daily quota to 2
2. Add 5 recipients
3. Send campaign
4. Should pause after 2 emails
5. Status should be "paused"
6. Pause reason: "Daily quota reached"

### 8. Variable Replacement
**Test Variables**
1. Create campaign with:
   - Subject: "Hi {{name}}"
   - Body: "You work at {{company}}"
2. Add recipient with:
   - email: test@example.com
   - name: John
   - company: Acme
3. Send campaign
4. Check received email
5. Should show: "Hi John" and "You work at Acme"

**Test Conditional Content**
1. Create campaign with body:
```
Hi {{name}},

{{#if company}}
I noticed you work at {{company}}.
{{/if}}

Best regards
```
2. Add two recipients:
   - One with company field
   - One without company field
3. Send campaign
4. First recipient should see company line
5. Second recipient should not see company line

## Expected Results

### Success Indicators
✅ All authentication methods work
✅ SMTP connection test succeeds
✅ Recipients can be added manually and via CSV
✅ All three editor modes work
✅ Campaigns save successfully
✅ Emails send with correct variable replacement
✅ Rate limiting works (delays between emails)
✅ Daily quota enforced
✅ Real-time stats update
✅ Email logs show correct status
✅ Scheduled campaigns trigger automatically

### Common Issues

**"SMTP connection failed"**
- Check credentials
- Verify App Password for Gmail
- Check port (587 for TLS, 465 for SSL)
- Disable antivirus/firewall temporarily

**"No recipients found"**
- Add at least one recipient before sending
- Check recipients are saved in Firestore

**"Campaign not sending"**
- Check SMTP config is saved
- Verify recipients exist
- Check browser console for errors
- Check server logs

**Variables not replaced**
- Ensure recipient has the custom field
- Check variable syntax: {{fieldname}}
- No spaces in variable names

## Performance Testing

**Test with 10 recipients**
- Rate limit: 60/hour (1 per minute)
- Should complete in ~10 minutes
- Monitor memory usage
- Check all emails delivered

**Test with 100 recipients**
- Rate limit: 100/hour
- Should complete in ~1 hour
- Monitor for any failures
- Check daily quota not exceeded

## Security Testing

**Test unauthorized access**
1. Logout
2. Try to access /dashboard directly
3. Should redirect to login

**Test cross-user access**
1. Create campaign as User A
2. Logout and login as User B
3. Try to access User A's campaign URL
4. Should show "Unauthorized" error

## Cleanup After Testing

1. Delete test campaigns
2. Delete test recipients
3. Clear email logs (optional)
4. Reset daily quota (wait for next day)

## Production Checklist

Before deploying to production:
- [ ] All tests pass
- [ ] Firebase security rules deployed
- [ ] Environment variables set
- [ ] SMTP credentials verified
- [ ] Rate limits configured appropriately
- [ ] Daily quotas set conservatively
- [ ] Cron job configured for scheduled campaigns
- [ ] Error monitoring set up
- [ ] Backup strategy in place
