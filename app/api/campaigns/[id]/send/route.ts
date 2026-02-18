import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email-sender';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const { adminAuth } = await import('@/lib/firebase-admin');
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { id } = await params;

    // Get campaign
    const campaignDoc = await adminDb.collection('campaigns').doc(id).get();
    if (!campaignDoc.exists) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const campaign = campaignDoc.data()!;
    if (campaign.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get recipients
    const recipientsSnapshot = await adminDb
      .collection('recipients')
      .where('userId', '==', userId)
      .get();

    const recipients = recipientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 });
    }

    // Update campaign status
    await adminDb.collection('campaigns').doc(id).update({
      status: 'running',
      stats: {
        total: recipients.length,
        sent: 0,
        failed: 0,
        pending: recipients.length,
      },
      startedAt: new Date().toISOString(),
    });

    // Start sending (async process)
    const { processCampaignBackground } = await import('@/lib/campaign-processor');
    processCampaignBackground(id, userId, campaign, recipients).catch(console.error);

    return NextResponse.json({ success: true, message: 'Campaign started' });
  } catch (error: any) {
    console.error('Start campaign error:', error);
    return NextResponse.json({ error: error.message || 'Failed to start campaign' }, { status: 500 });
  }
}
