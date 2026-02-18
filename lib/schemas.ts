import { z } from 'zod';

export const smtpConfigSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().min(1).max(65535),
  secure: z.boolean(),
  user: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export type SMTPConfig = z.infer<typeof smtpConfigSchema>;
