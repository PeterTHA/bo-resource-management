import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// กำหนดเวลาเริ่มต้น server
if (!global.SERVER_START_TIME) {
  global.SERVER_START_TIME = Date.now();
  console.log(`SERVER_START_TIME กำหนดเป็น: ${new Date(global.SERVER_START_TIME).toISOString()}`);
}

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  
  console.log('Middleware processing path:', pathname, 'with query:', search);
  
  // ไม่ตรวจสอบสำหรับเส้นทางดังต่อไปนี้
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }
  
  try {
    // ตรวจสอบว่ามีการกำหนด NEXTAUTH_SECRET หรือไม่
    if (!process.env.NEXTAUTH_SECRET) {
      console.error('NEXTAUTH_SECRET is not defined!');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'ConfigError');
      return NextResponse.redirect(loginUrl);
    }
    
    // ตรวจสอบ token ปัจจุบัน
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // ถ้าไม่มี token หรือ token หมดอายุให้ redirect ไปที่หน้า login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'SessionExpired');
      return NextResponse.redirect(loginUrl);
    }
    
    // ตรวจสอบว่า server ได้ restart หรือไม่
    // ตรวจสอบว่ามีค่า serverStartTime และไม่ตรงกับ global.SERVER_START_TIME ปัจจุบัน
    const currentServerTime = global.SERVER_START_TIME || Date.now();
    
    if (token.serverStartTime && token.serverStartTime !== currentServerTime) {
      console.log(`Token server time (${token.serverStartTime}) ไม่ตรงกับ current (${currentServerTime})`);
      
      // Redirect to login page with error parameter
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'ServerRestarted');
      return NextResponse.redirect(loginUrl);
    }
    
    // เมื่อผ่านการตรวจสอบ ให้ response ถูกส่งต่อไปพร้อมกับ query parameters เดิม
    const response = NextResponse.next();

    // เพิ่มการบันทึกข้อมูลการเข้าถึง
    console.log(`User ${token.email || token.id} accessed ${pathname}${search}`);
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // กรณีเกิดข้อผิดพลาดในการตรวจสอบ token ให้ redirect ไปที่หน้า login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'AuthError');
    return NextResponse.redirect(loginUrl);
  }
}

// กำหนด matcher เพื่อใช้ middleware กับทุก route ยกเว้นที่ระบุ
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/* (authentication routes)
     * 2. /_next/* (Next.js internals)
     * 3. /static/* (static files)
     * 4. /favicon.ico, /sitemap.xml (common files)
     */
    '/((?!api/auth|_next/static|_next/image|images|favicon.ico|sitemap.xml).*)',
  ],
}; 