import CredentialsProvider from 'next-auth/providers/credentials';
import { getEmployeeByEmail } from './db-postgres';
import bcrypt from 'bcryptjs';

export const authOptionsPostgres = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'อีเมล', type: 'email' },
        password: { label: 'รหัสผ่าน', type: 'password' }
      },
      async authorize(credentials) {
        console.log('Attempting login with:', credentials.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing email or password');
          throw new Error('กรุณาระบุอีเมลและรหัสผ่าน');
        }

        const result = await getEmployeeByEmail(credentials.email);
        console.log('Employee lookup result:', result);
        
        if (!result.success) {
          console.log('User not found');
          throw new Error('ไม่พบบัญชีผู้ใช้');
        }

        const employee = result.data;
        
        const isMatch = await bcrypt.compare(credentials.password, employee.password);
        console.log('Password match result:', isMatch);

        if (!isMatch) {
          console.log('Password incorrect');
          throw new Error('รหัสผ่านไม่ถูกต้อง');
        }

        return {
          id: employee.id,
          employeeId: employee.employee_id,
          name: `${employee.first_name} ${employee.last_name}`,
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