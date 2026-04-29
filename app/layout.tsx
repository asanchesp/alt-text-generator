import type { Metadata } from 'next';
import { Geist, Geist_Mono, Lora } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  style: ['normal'],
});

export const metadata: Metadata = {
  title: 'Alt Text Generator',
  description: 'Accessibility-first alt text for images — multiple variations, fine-grained controls.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable}`}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
