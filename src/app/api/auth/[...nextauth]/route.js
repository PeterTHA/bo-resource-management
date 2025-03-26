import NextAuth from 'next-auth';
import { authOptions } from '../../../../lib/auth';

// กำหนดค่า SERVER_START_TIME global สำหรับตรวจสอบ server restart
if (typeof global.SERVER_START_TIME === 'undefined') {
  global.SERVER_START_TIME = Date.now();
  console.log(`API Route: SERVER_START_TIME set to ${new Date(global.SERVER_START_TIME).toISOString()}`);
}

// ตรวจสอบว่ามีการกำหนดค่า NEXTAUTH_SECRET หรือไม่
if (!process.env.NEXTAUTH_SECRET) {
  console.warn('Warning: NEXTAUTH_SECRET is not defined. Authentication might not work correctly.');
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 