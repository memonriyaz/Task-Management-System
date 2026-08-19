import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { BoardProvider } from '../contexts/BoardContext';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'Kanban Task Management System | Full Stack Assessment',
  description:
    'A high-fidelity, interactive Kanban task management system built with Next.js App Router, Tailwind CSS, NestJS, SQLite, and Prisma.',
  keywords: [
    'Kanban',
    'Task Management',
    'Next.js',
    'NestJS',
    'TypeScript',
    'Prisma',
    'Tailwind CSS',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} font-sans`}>
      <body className="h-screen w-screen overflow-hidden">
        <AuthProvider>
          <ThemeProvider>
            <BoardProvider>{children}</BoardProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
