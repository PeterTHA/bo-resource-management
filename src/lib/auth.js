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
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('ไม่ได้ระบุอีเมลหรือรหัสผ่าน');
            return null;
          }

          // ดึงข้อมูลพนักงานจาก Prisma พร้อมข้อมูลทีมและแผนก
          const user = await prisma.employee.findUnique({
            where: { email: credentials.email },
            include: {
              department: true,
              teamData: true
            }
          });
          
          if (!user) {
            console.log('ไม่พบผู้ใช้งาน');
            return null;
          }
          
          // ตรวจสอบสถานะการใช้งาน
          if (!user.isActive) {
            console.log('บัญชีผู้ใช้นี้ถูกระงับ');
            return null;
          }
          
          // ตรวจสอบรหัสผ่าน
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            console.log('รหัสผ่านไม่ถูกต้อง');
            return null;
          }
          
          console.log('ล็อกอินสำเร็จสำหรับ:', user.email);
          
          // ส่งข้อมูลผู้ใช้กลับไป (ไม่รวมรหัสผ่าน)
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            employeeId: user.employeeId,
            departmentId: user.departmentId,
            department: user.department?.name || null,
            teamId: user.teamId,
            team: user.teamData?.name || null,
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
        console.log('การสร้าง JWT token ใหม่สำหรับผู้ใช้:', user.email);
        
        // เมื่อสร้าง token ใหม่ (login ครั้งแรก)
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.employeeId = user.employeeId;
        token.departmentId = user.departmentId;
        token.department = user.department;
        token.teamId = user.teamId;
        token.team = user.team;
        token.position = user.position;
        token.image = user.image;
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