import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { decrypt } from '@/lib/encryption';
import nodemailer from 'nodemailer';

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

    const doc = await adminDb.collection('smtp_config').doc(userId).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'SMTP config not found' }, { status: 404 });
    }

    const data = doc.data()!;
    const password = decrypt(data.password);

    const transporter = nodemailer.createTransport({
      host: data.host,
      port: data.port,
      secure: data.secure,
      auth: {
        user: data.user,
        pass: password,
      },
    });

    await transporter.verify();

    return NextResponse.json({ success: true, message: 'SMTP connection successful' });
  } catch (error: any) {
    console.error('SMTP test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to connect to SMTP server' 
    }, { status: 500 });
  }
}
