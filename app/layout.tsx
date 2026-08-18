import './globals.css';
import { Providers } from '@/components/providers';
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler';
import { Toaster } from 'sonner';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Carter's Equipment Request Portal",
  description: "Carter's Retail Inc. New Store Equipment Request Portal",
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
  openGraph: {
    title: "Carter's Equipment Request Portal",
    description: "Carter's Retail Inc. New Store Equipment Request Portal",
    images: ['/og-image.png'],
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
          <ChunkLoadErrorHandler />
        </Providers>
      </body>
    </html>
  );
}
