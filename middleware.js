import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// กำหนดเส้นทางที่ไม่จำเป็นต้องล็อกอิน (ไม่ต้องตรวจสอบ)
const publicPaths = [
  '/login',
  '/api/auth',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy',
  '/_next',
  '/favicon.ico',
  '/images',
  '/static',
];

// ตรวจสอบว่าเส้นทางปัจจุบันเป็น public หรือไม่
function isPublicPath(path) {
  return publicPaths.some(publicPath => path.startsWith(publicPath));
}

// บางเส้นทางที่ต้องการเข้าถึงเฉพาะ admin
const adminPaths = ['/admin', '/api/admin'];

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // เส้นทางสาธารณะให้ผ่านไปเลย
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  try {
    // ดึงข้อมูล token
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // ถ้ามี session token ให้เปลี่ยนเส้นทางไปที่หน้า dashboard
    if (pathname === "/" && token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    // ถ้าไม่มี session token และอยู่ที่หน้าแรก ให้เปลี่ยนเส้นทางไปที่หน้า login
    if (pathname === "/" && !token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // สำหรับ admin path แต่ผู้ใช้ไม่ใช่ admin
    if (token.role !== 'admin' && adminPaths.some(path => pathname.startsWith(path))) {
      // กรณีเกิดข้อผิดพลาดกับ API
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'เกิดข้อผิดพลาด' }),
          { status: 500, headers: { 'content-type': 'application/json' } }
        );
      }
      
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // ผ่านการตรวจสอบทั้งหมด
    return NextResponse.next();
  } catch (error) {
    console.error(`[Middleware] Error:`, error);
    
    // กรณีเกิดข้อผิดพลาดกับ API
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'เกิดข้อผิดพลาด' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }
    
    // กรณีเกิดข้อผิดพลาดกับหน้าทั่วไป นำทางไปที่หน้าล็อกอิน
    return NextResponse.redirect(new URL('/login?error=AuthError', req.url));
  }
}

// กำหนดเส้นทางที่ต้องการให้ middleware ทำงาน
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 