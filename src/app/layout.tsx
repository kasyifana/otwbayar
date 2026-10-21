import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'otwbayar — Shared Expense & Group Saving Tracker',
  description: 'Tracker tabungan kelompok dan split bill on-site khusus squad & trip santai.',
  icons: {
    icon: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1E3F20',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#F4F6F4] text-[#172118] antialiased">
        <AuthProvider>
          <div className="w-full min-h-screen bg-[#F4F6F4] relative flex flex-col">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
