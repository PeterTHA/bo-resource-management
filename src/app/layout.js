import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../lib/auth';
import { SessionProvider } from '../components/SessionProvider';
import Layout from '../components/Layout';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ระบบจัดการทรัพยากรบุคคล',
  description: 'ระบบจัดการทรัพยากรบุคคลสำหรับองค์กร',
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="th">
      <body className={inter.className}>
        <SessionProvider session={session}>
          <Layout>{children}</Layout>
        </SessionProvider>
      </body>
    </html>
  );
}
