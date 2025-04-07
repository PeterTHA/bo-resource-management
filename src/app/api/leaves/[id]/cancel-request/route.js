import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { requestCancelLeave } from '@/lib/db-prisma';

// PUT - สำหรับการขอยกเลิกการลา
export async function PUT(request, context) {
  const start = Date.now();
  try {
    console.log(`[${new Date().toISOString()}] Processing cancel request`);
    
    // รับ context.params ที่มี dynamic route
    const { params } = context;
    console.log('Route params:', params);
    
    if (!params || !params.id) {
      console.error('Missing ID parameter in route');
      return NextResponse.json({ 
        success: false, 
        message: 'ไม่พบรหัสการลา' 
      }, { status: 400 });
    }
    
    // รับ ID ของการลาจาก URL params และแปลงเป็น String ที่ปลอดภัย
    const id = String(params.id);
    console.log(`Processing leave ID: ${id}`);
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    const session = await getServerSession(authOptions);
    console.log('Session received from getServerSession');
    
    if (!session) {
      console.error('No session found');
      return NextResponse.json({ 
        success: false, 
        message: 'กรุณาเข้าสู่ระบบ' 
      }, { status: 401 });
    }
    
    console.log('Session data:', {
      hasUser: !!session.user,
      userId: session.user?.id,
      email: session.user?.email
    });
    
    // ตรวจสอบค่า session
    if (!session.user || !session.user.id) {
      console.error('Invalid session user data');
      return NextResponse.json({ 
        success: false, 
        message: 'ข้อมูลผู้ใช้ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' 
      }, { status: 401 });
    }
    
    // รับข้อมูลจาก request body
    const data = await request.json();
    const { cancelReason } = data;
    
    const userId = session.user.id;
    console.log(`User ${userId} requesting to cancel leave ${id}`);
    
    // ส่งข้อมูลไปยังฟังก์ชันขอยกเลิกการลา
    const result = await requestCancelLeave(id, {
      cancelReason,
      requestedById: userId
    });
    
    const end = Date.now();
    console.log(`Request completed in ${end - start}ms with result:`, { 
      success: result.success,
      message: result.message
    });
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        message: result.message || 'ส่งคำขอยกเลิกการลาเรียบร้อยแล้ว'
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: result.message || 'เกิดข้อผิดพลาดในการส่งคำขอยกเลิกการลา'
        }, 
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error requesting cancel leave:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
} 