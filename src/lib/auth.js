import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from './db';
import Employee from '../models/Employee';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'อีเมล', type: 'email' },
        password: { label: 'รหัสผ่าน', type: 'password' }
      },
      async authorize(credentials) {
        await connectDB();

        if (!credentials?.email || !credentials?.password) {
          throw new Error('กรุณาระบุอีเมลและรหัสผ่าน');
        }

        const employee = await Employee.findOne({ email: credentials.email }).select('+password');

        if (!employee) {
          throw new Error('ไม่พบบัญชีผู้ใช้');
        }

        const isMatch = await bcrypt.compare(credentials.password, employee.password);

        if (!isMatch) {
          throw new Error('รหัสผ่านไม่ถูกต้อง');
        }

        return {
          id: employee._id,
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          role: employee.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.employeeId = user.employeeId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.employeeId = token.employeeId;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 day
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
}; 