import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCurrentDate } from '@/lib/date-utils';
import { getLeavesByDate, getOvertimesByDate } from '@/lib/db-prisma';

// GET - ดึงข้อมูลสถิติสำหรับหน้า Dashboard
export async function GET(req) {
  try {
    // ตรวจสอบสิทธิ์การเข้าถึง
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }
    
    // ดึงวันที่ปัจจุบัน
    const currentDate = getCurrentDate();
    
    // ดึงข้อมูลการลาของวันนี้
    const todayLeaves = await getLeavesByDate(currentDate, currentDate);
    
    // ดึงข้อมูล overtime ของวันนี้
    const todayOvertimes = await getOvertimesByDate(currentDate, currentDate);
    
    // ส่งข้อมูลกลับไป
    return NextResponse.json({
      success: true,
      data: {
        todayLeaves: todayLeaves || [],
        todayOvertimes: todayOvertimes || [],
        user: {
          id: session.user.id,
          name: `${session.user.firstName} ${session.user.lastName}`,
          role: session.user.role
        }
      }
    });
  } catch (error) {
    console.error('Error in dashboard API:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' }, { status: 500 });
  }
} 