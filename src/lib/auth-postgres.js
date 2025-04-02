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
        if (!credentials?.email || !credentials?.password) {
          throw new Error('กรุณาระบุอีเมลและรหัสผ่าน');
        }

        const result = await getEmployeeByEmail(credentials.email);
        
        if (!result.success) {
          throw new Error('ไม่พบบัญชีผู้ใช้');
        }

        const employee = result.data;
        
        const isMatch = await bcrypt.compare(credentials.password, employee.password);

        if (!isMatch) {
          throw new Error('รหัสผ่านไม่ถูกต้อง');
        }

        if (employee.isActive === false) {
          throw new Error('Account is suspended');
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

export async function loginWithCredentials(credentials) {
  if (!credentials?.email || !credentials?.password) {
    return { success: false, error: 'Missing email or password' };
  }

  try {
    const db = getPostgresDb();
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    // หาผู้ใช้จากฐานข้อมูล
    const result = await db.query(
      `SELECT * FROM "Employee" WHERE email = $1`,
      [credentials.email]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'User not found' };
    }

    const user = result.rows[0];
    
    // ตรวจสอบรหัสผ่าน
    const isMatch = await bcrypt.compare(credentials.password, user.password);
    
    if (!isMatch) {
      return { success: false, error: 'Invalid password' };
    }
    
    // ถ้าบัญชีถูกระงับ ไม่อนุญาตให้เข้าสู่ระบบ
    if (user.isActive === false) {
      return { success: false, error: 'Account is suspended' };
    }

    // เข้าสู่ระบบสำเร็จ ส่งข้อมูลผู้ใช้กลับไป
    return {
      success: true,
      user: {
        id: user.id,
        employeeId: user.employeeId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        department: user.department,
        position: user.position,
        role: user.role || 'employee',
        teamId: user.teamId,
        image: user.image
      }
    };
  } catch (error) {
    return { success: false, error: 'Server error' };
  }
} 