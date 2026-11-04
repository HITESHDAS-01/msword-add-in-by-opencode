import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Smart QP Formatter',
  description: 'Format Word documents into print-ready Question Papers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript" />
      </head>
      <body className="bg-office-gray-light text-office-black antialiased">{children}</body>
    </html>
  );
}