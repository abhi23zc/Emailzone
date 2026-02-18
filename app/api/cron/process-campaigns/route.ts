import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    // Check for scheduled campaigns
    const now = new Date().toISOString();
    const snapshot = await adminDb
      .collection('campaigns')
      .where('status', '==', 'scheduled')
      .where('scheduleTime', '<=', now)
      .get();

    const campaigns = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as { id: string; userId: string;[key: string]: any }));

    for (const campaign of campaigns) {
      // Get recipients
      const recipientsSnapshot = await adminDb
        .collection('recipients')
        .where('userId', '==', campaign.userId)
        .get();

      const recipients = recipientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (recipients.length > 0) {
        // Update campaign status
        await adminDb.collection('campaigns').doc(campaign.id).update({
          status: 'running',
          stats: {
            total: recipients.length,
            sent: 0,
            failed: 0,
            pending: recipients.length,
          },
          startedAt: new Date().toISOString(),
        });

        // Import and start processing
        const { processCampaignBackground } = await import('@/lib/campaign-processor');
        processCampaignBackground(campaign.id, campaign.userId, campaign, recipients).catch(console.error);
      }
    }

    return NextResponse.json({
      success: true,
      processed: campaigns.length,
      message: `Processed ${campaigns.length} scheduled campaigns`
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
