import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './providers';
import Navbar from '../components/Navbar';
import ThemeProvider from './theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'BO Resource Management',
  description: 'ระบบจัดการทรัพยากรบุคคล',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        <AuthProvider>
          <ThemeProvider>
            <Navbar />
            <main className="py-4">{children}</main>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
