import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../components/Providers';
import Navbar from '../components/Navbar';
import ThemeProvider from './theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'BO Resource Management',
  description: 'ระบบจัดการทรัพยากรบุคคล',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <div className="min-h-screen flex flex-col bg-[var(--bg-color)] text-[var(--text-color)]">
              <Navbar />
              <main className="flex-grow py-4">{children}</main>
              <footer className="py-4 px-4 text-center text-sm border-t border-[var(--border-color)]">
                <p>© {new Date().getFullYear()} BO Resource Management. All rights reserved.</p>
              </footer>
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
