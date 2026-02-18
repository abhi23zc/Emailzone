import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const { adminAuth } = await import('@/lib/firebase-admin');
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await req.json();
    const { recipients } = body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Invalid recipients data' }, { status: 400 });
    }

    const batch = adminDb.batch();
    let count = 0;

    for (const recipient of recipients) {
      if (!recipient.email) continue;
      
      const docRef = adminDb.collection('recipients').doc();
      batch.set(docRef, {
        userId,
        email: recipient.email,
        customFields: recipient.customFields || {},
        createdAt: new Date().toISOString(),
      });
      count++;
    }

    await batch.commit();

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: error.message || 'Failed to import recipients' }, { status: 500 });
  }
}
