import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { smtpConfigSchema } from '@/lib/schemas';
import { encrypt, decrypt } from '@/lib/encryption';

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
    const config = smtpConfigSchema.parse(body);

    const encryptedPassword = encrypt(config.password);

    await adminDb.collection('smtp_config').doc(userId).set({
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      password: encryptedPassword,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('SMTP config save error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save config' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const { adminAuth } = await import('@/lib/firebase-admin');
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const doc = await adminDb.collection('smtp_config').doc(userId).get();
    
    if (!doc.exists) {
      return NextResponse.json({ config: null });
    }

    const data = doc.data()!;
    return NextResponse.json({
      config: {
        host: data.host,
        port: data.port,
        secure: data.secure,
        user: data.user,
        hasPassword: !!data.password,
      },
    });
  } catch (error: any) {
    console.error('SMTP config fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch config' }, { status: 500 });
  }
}
