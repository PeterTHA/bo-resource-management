import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { getLeaves, createLeave } from '../../../lib/db-prisma';

// GET - ดึงข้อมูลการลาทั้งหมด
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
    
    // ดึงข้อมูลการลาจาก Prisma
    let result;
    
    // ถ้าเป็น admin หรือ manager สามารถดูข้อมูลการลาทั้งหมดได้
    // ถ้าเป็นพนักงานทั่วไป จะลาให้คนอื่นไม่ได้
    if (session.user.role === 'permanent' || session.user.role === 'temporary') {
      result = await getLeaves(session.user.id);
    } else if (employeeId) {
      result = await getLeaves(employeeId);
    } else {
      result = await getLeaves();
    }
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลการลา', connectionError: result.connectionError },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/leaves:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST - เพิ่มข้อมูลการลา
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
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!data.leaveType || !data.startDate || !data.endDate || !data.reason) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }
    
    // ถ้าเป็นพนักงานทั่วไป ให้ดูแค่การลาของตัวเอง
    if (session.user.role === 'permanent' || session.user.role === 'temporary') {
      data.employeeId = session.user.id;
    }
    
    // เพิ่มข้อมูลการลาใน Prisma
    const result = await createLeave(data);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลการลา' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/leaves:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 