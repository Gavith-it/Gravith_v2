import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';
import { AppShell } from '@/components/AppShell';
import { AuthErrorBoundary } from '@/components/AuthErrorBoundary';
import { AuthProvider } from '@/lib/auth-context';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Gavith Build - Construction Management System',
  description: 'Next-generation construction management platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased w-full h-full`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-background focus:text-foreground focus:p-2 focus:rounded focus:z-50"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <AuthErrorBoundary>
            <AppShell>{children}</AppShell>
          </AuthErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
