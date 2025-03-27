import NextAuth from 'next-auth';
import { authOptions } from '../../../../lib/auth';

// ตรวจสอบว่ามีการกำหนดค่า NEXTAUTH_SECRET หรือไม่
if (!process.env.NEXTAUTH_SECRET) {
  console.warn('Warning: NEXTAUTH_SECRET is not defined. Authentication might not work correctly.');
}

// สร้าง handler สำหรับ NextAuth
const handler = NextAuth({
  ...authOptions,
  // เพิ่มการตั้งค่าเพื่อความปลอดภัย
  cookies: {
    ...authOptions.cookies,
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    }
  },
  // ตั้งค่าความปลอดภัยเพิ่มเติม
  useSecureCookies: process.env.NODE_ENV === 'production',
  // ป้องกันการถูกโจมตีด้วย CSRF
  csrfCheck: true,
});

export { handler as GET, handler as POST }; 