import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const geistSans = localFont({
  src: [
    {
      path: './fonts/geist-latin.woff2',
      weight: '100 900',
      style: 'normal',
    },
    {
      path: './fonts/geist-latin-ext.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = localFont({
  src: [
    {
      path: './fonts/geist-mono-latin.woff2',
      weight: '100 900',
      style: 'normal',
    },
    {
      path: './fonts/geist-mono-latin-ext.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Celebus Voting Demo',
  description: 'EIP-712 Batch Signature Demo for Celebus Voting Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
