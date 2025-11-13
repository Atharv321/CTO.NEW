import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Barber Booking - Reserve Your Cut',
  description: 'Book your next haircut or barber service online. Easy scheduling, flexible options.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#667eea" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
