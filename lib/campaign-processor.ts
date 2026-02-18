import { adminDb } from './firebase-admin';
import { sendEmail } from './email-sender';

export async function processCampaignBackground(
  campaignId: string,
  userId: string,
  campaign: any,
  recipients: any[]
) {
  const rateLimit = campaign.rateLimit || 50;
  const dailyQuota = campaign.dailyQuota || 500;
  const delayMs = (3600 / rateLimit) * 1000;

  let sent = 0;
  let failed = 0;

  const today = new Date().toISOString().split('T')[0];
  const quotaDoc = await adminDb.collection('daily_quota').doc(`${userId}_${today}`).get();
  let sentToday = quotaDoc.exists ? quotaDoc.data()!.count : 0;

  for (const recipient of recipients) {
    if (sentToday >= dailyQuota) {
      await adminDb.collection('campaigns').doc(campaignId).update({
        status: 'paused',
        pauseReason: 'Daily quota reached',
      });
      break;
    }

    try {
      await sendEmail(
        userId,
        recipient.email,
        recipient.customFields || {},
        campaign.subject,
        campaign.body,
        campaign.templateType
      );

      sent++;
      sentToday++;
      
      await adminDb.collection('campaigns').doc(campaignId).update({
        'stats.sent': sent,
        'stats.pending': recipients.length - sent - failed,
      });

      await adminDb.collection('daily_quota').doc(`${userId}_${today}`).set({
        count: sentToday,
        date: today,
      });

      await adminDb.collection('email_logs').add({
        campaignId,
        userId,
        recipientEmail: recipient.email,
        status: 'sent',
        sentAt: new Date().toISOString(),
      });

    } catch (error: any) {
      failed++;
      
      await adminDb.collection('campaigns').doc(campaignId).update({
        'stats.failed': failed,
        'stats.pending': recipients.length - sent - failed,
      });

      await adminDb.collection('email_logs').add({
        campaignId,
        userId,
        recipientEmail: recipient.email,
        status: 'failed',
        error: error.message,
        failedAt: new Date().toISOString(),
      });
    }

    if (sent + failed < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  if (sent + failed === recipients.length) {
    await adminDb.collection('campaigns').doc(campaignId).update({
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  }
}
