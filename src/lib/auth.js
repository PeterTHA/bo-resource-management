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
          console.log('Missing email or password');
          throw new Error('กรุณาระบุอีเมลและรหัสผ่าน');
        }

        console.log('Attempting to authenticate:', credentials.email);

        // ค้นหาพนักงานจากอีเมล
        let user;
        
        try {
          user = await prisma.employees.findUnique({
            where: { email: credentials.email },
            include: {
              departments: true,
              teams: true
            }
          });
          
          console.log('User found:', !!user);
          if (user) {
            console.log('User details:', {
              id: user.id,
              email: user.email,
              is_active: user.is_active,
              hasPassword: !!user.password
            });
          }
        } catch (error) {
          console.error('Error in authorize:', error);
          throw new Error('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้');
        }
        
        if (!user) {
          console.log('User not found');
          throw new Error('ไม่พบผู้ใช้งาน');
        }
        
        if (user.is_active === false) {
          console.log('User account is inactive');
          throw new Error('บัญชีผู้ใช้นี้ถูกระงับ');
        }

        // ตรวจสอบรหัสผ่าน
        let isMatch;
        try {
          isMatch = await bcrypt.compare(credentials.password, user.password);
          console.log('Password match:', isMatch);
        } catch (error) {
          console.error('Error comparing passwords:', error);
          throw new Error('เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน');
        }
        
        if (!isMatch) {
          console.log('Password is incorrect');
          throw new Error('รหัสผ่านไม่ถูกต้อง');
        }

        console.log('Authentication successful');
        return {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          employee_id: user.employee_id,
          team_id: user.team_id,
          department_id: user.department_id
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
        token.first_name = user.first_name;
        token.last_name = user.last_name;
        token.role = user.role;
        token.employee_id = user.employee_id;
        token.department_id = user.department_id;
        token.departments = user.departments?.name || null;
        token.team_id = user.team_id;
        token.teams = user.teams?.name || null;
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
        session.user.first_name = token.first_name;
        session.user.last_name = token.last_name;
        session.user.employee_id = token.employee_id;
        session.user.department_id = token.department_id;
        session.user.departments = token.departments;
        session.user.team_id = token.team_id;
        session.user.teams = token.teams;
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