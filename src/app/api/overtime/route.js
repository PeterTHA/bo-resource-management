import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { getOvertimes, createOvertime } from '../../../lib/db-prisma';

// GET - ดึงข้อมูลการทำงานล่วงเวลาทั้งหมด
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    
    // ดึงข้อมูลการทำงานล่วงเวลาจาก Prisma
    let result;
    
    // ถ้าเป็น admin หรือ manager สามารถดูข้อมูลการทำงานล่วงเวลาทั้งหมดได้
    // ถ้าเป็นพนักงานทั่วไป จะบันทึกโอทีให้คนอื่นไม่ได้
    if (session.user.role === 'permanent' || session.user.role === 'temporary') {
      result = await getOvertimes(session.user.id);
    } else if (employeeId) {
      result = await getOvertimes(employeeId);
    } else {
      result = await getOvertimes();
    }
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลการทำงานล่วงเวลา', connectionError: true },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/overtime:', error);
    return NextResponse.json(
      { success: false, message: error.message, connectionError: true },
      { status: 500 }
    );
  }
}

// POST - เพิ่มข้อมูลการทำงานล่วงเวลา
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // ถ้าเป็นพนักงานทั่วไป ให้ดูแค่โอทีของตัวเอง
    if (session.user.role === 'permanent' || session.user.role === 'temporary') {
      data.employee = session.user.id;
    }
    
    // เพิ่มข้อมูลการทำงานล่วงเวลาใน Prisma
    const result = await createOvertime(data);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || result.error || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลการทำงานล่วงเวลา' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/overtime:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 