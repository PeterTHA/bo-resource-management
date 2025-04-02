import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './db-prisma';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('กรุณาระบุอีเมลและรหัสผ่าน');
        }

        // ค้นหาพนักงานจากอีเมล
        let user;
        
        try {
          user = await prisma.employee.findUnique({
            where: { email: credentials.email },
            include: {
              department: true,
              teamData: true
            }
          });
        } catch (error) {
          throw new Error('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้');
        }
        
        if (!user) {
          throw new Error('ไม่พบผู้ใช้งาน');
        }
        
        if (user.isActive === false) {
          throw new Error('บัญชีผู้ใช้นี้ถูกระงับ');
        }

        // ตรวจสอบรหัสผ่าน
        const isMatch = await bcrypt.compare(credentials.password, user.password);
        
        if (!isMatch) {
          throw new Error('รหัสผ่านไม่ถูกต้อง');
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          employeeId: user.employeeId,
          teamId: user.teamId,
          departmentId: user.departmentId
        };
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (user) {
        // สร้าง token ใหม่จากข้อมูล user ที่ได้รับจาก authorize
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.employeeId = user.employeeId;
        token.departmentId = user.departmentId;
        token.department = user.department;
        token.teamId = user.teamId;
        token.team = user.teamData?.name || null;
        token.position = user.position;
        token.image = user.image || null;
        // เพิ่ม timestamp เพื่อเช็คเวอร์ชันของ token
        token.tokenVersion = Date.now();
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // ถ้า token มี error ให้ถือว่า session หมดอายุ
        if (token.error) {
          return null;
        }
        
        // เพิ่มการตรวจสอบค่า token
        if (!token.id) {
          console.error('Missing ID in token:', token);
          return {
            ...session,
            error: 'missing_user_id'
          };
        }
        
        // ตรวจสอบและกำหนดค่าให้กับ session.user ถ้า token มีข้อมูล
        session.user = session.user || {};
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.employeeId = token.employeeId;
        session.user.departmentId = token.departmentId;
        session.user.department = token.department;
        session.user.teamId = token.teamId;
        session.user.team = token.team;
        session.user.position = token.position;
        session.user.image = token.image;
        session.user.tokenVersion = token.tokenVersion;
        
        // เพิ่ม log เพื่อตรวจสอบว่า user.id ถูกกำหนดค่าหรือไม่
        console.log(`Session created/updated for user ${session.user.email}, ID: ${session.user.id || 'undefined'}`);
      } else {
        console.warn('No token data available for session');
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/login?logout=true'
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 ชั่วโมง (1 วัน)
    updateAge: 1 * 60 * 60, // อัปเดต session ทุก 1 ชั่วโมง
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 ชั่วโมง (1 วัน)
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}; 