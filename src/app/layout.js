import './globals.css';
import Providers from '../components/Providers';
import Layout from '../components/Layout';

export const metadata = {
  title: 'ระบบจัดการทรัพยากรบุคคล',
  description: 'ระบบจัดการข้อมูลพนักงาน การลา และการทำงานล่วงเวลา',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  );
}
