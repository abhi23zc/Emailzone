import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'firebase-admin',
    'google-auth-library',
    'nodemailer'
  ],
};

export default nextConfig;
