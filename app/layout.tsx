import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vacunas Colombia',
  description:
    'Organiza las vacunas de tu peque, directamente en tu dispositivo.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Vacunas Colombia',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vacunas Colombia',
  },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  themeColor: '#0d2d2b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
