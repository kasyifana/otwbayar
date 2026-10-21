import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getServerSession } from 'next-auth';

const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
if (!authSecret && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: NEXTAUTH_SECRET / AUTH_SECRET must be configured in production');
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  secret: authSecret || 'otwglamping-dev-secret-ciwidey-2025',
};

export async function auth() {
  return await getServerSession(authOptions);
}
