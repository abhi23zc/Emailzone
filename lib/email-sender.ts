import nodemailer from 'nodemailer';
import { adminDb } from './firebase-admin';
import { decrypt } from './encryption';
import { replaceVariables, parseConditionalContent } from './template-parser';

export async function sendEmail(
  userId: string,
  recipientEmail: string,
  recipientData: Record<string, string>,
  subject: string,
  body: string,
  templateType: 'plain' | 'rich' | 'html'
) {
  // Get SMTP config
  const smtpDoc = await adminDb.collection('smtp_config').doc(userId).get();
  if (!smtpDoc.exists) {
    throw new Error('SMTP configuration not found');
  }

  const smtpConfig = smtpDoc.data()!;
  const password = decrypt(smtpConfig.password);

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: password,
    },
  });

  // Parse template
  const data = { email: recipientEmail, ...recipientData };
  let parsedBody = parseConditionalContent(body, data);
  parsedBody = replaceVariables(parsedBody, data);
  const parsedSubject = replaceVariables(subject, data);

  // Send email
  const mailOptions: any = {
    from: smtpConfig.user,
    to: recipientEmail,
    subject: parsedSubject,
  };

  if (templateType === 'plain') {
    mailOptions.text = parsedBody;
  } else {
    mailOptions.html = parsedBody;
  }

  await transporter.sendMail(mailOptions);
}
