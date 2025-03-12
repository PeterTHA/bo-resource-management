import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getEmployeeByEmail } from './db-postgres';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // ดึงข้อมูลพนักงานจาก Postgres
          const result = await getEmployeeByEmail(credentials.email);
          
          if (!result.success || !result.data) {
            console.log('ไม่พบผู้ใช้งาน');
            return null;
          }
          
          const user = result.data;
          
          // ตรวจสอบรหัสผ่าน
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            console.log('รหัสผ่านไม่ถูกต้อง');
            return null;
          }
          
          // ส่งข้อมูลผู้ใช้กลับไป (ไม่รวมรหัสผ่าน)
          return {
            id: user.id.toString(),
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            employeeId: user.employee_id,
            department: user.department,
            position: user.position,
            image: user.image || null
          };
        } catch (error) {
          console.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.employeeId = user.employeeId;
        token.department = user.department;
        token.position = user.position;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.employeeId = token.employeeId;
        session.user.department = token.department;
        session.user.position = token.position;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 วัน
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 