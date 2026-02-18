import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

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
    
    // Get original campaign
    const campaignDoc = await adminDb.collection('campaigns').doc(id).get();
    if (!campaignDoc.exists) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const originalCampaign = campaignDoc.data();
    if (originalCampaign?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create duplicate campaign
    const newCampaign = {
      userId,
      name: `${originalCampaign.name} (Copy)`,
      subject: originalCampaign.subject,
      body: originalCampaign.body,
      templateType: originalCampaign.templateType,
      rateLimit: originalCampaign.rateLimit,
      dailyQuota: originalCampaign.dailyQuota,
      status: 'draft',
      stats: {
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0,
      },
      createdAt: new Date().toISOString(),
    };

    const newCampaignRef = await adminDb.collection('campaigns').add(newCampaign);

    return NextResponse.json({ 
      success: true, 
      campaignId: newCampaignRef.id 
    });
  } catch (error: any) {
    console.error('Duplicate campaign error:', error);
    return NextResponse.json({ error: error.message || 'Failed to duplicate campaign' }, { status: 500 });
  }
}
