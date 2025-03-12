import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { getLeaveById, updateLeave, deleteLeave } from '../../../../lib/db-postgres';

// GET - ดึงข้อมูลการลาตาม ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    // ดึงข้อมูลการลาจาก Postgres
    const result = await getLeaveById(id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'ไม่พบข้อมูลการลา' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (session.user.role === 'employee' && result.data.employee_id !== parseInt(session.user.id)) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูล' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching leave:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PUT - อัปเดตข้อมูลการลา
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    // ดึงข้อมูลการลาเพื่อตรวจสอบสิทธิ์
    const checkResult = await getLeaveById(id);
    
    if (!checkResult.success) {
      return NextResponse.json(
        { success: false, message: checkResult.message || 'ไม่พบข้อมูลการลา' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (session.user.role === 'employee') {
      // พนักงานทั่วไปสามารถแก้ไขได้เฉพาะข้อมูลการลาของตัวเอง และต้องมีสถานะเป็น 'รออนุมัติ' เท่านั้น
      if (checkResult.data.employee_id !== parseInt(session.user.id)) {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูล' },
          { status: 403 }
        );
      }
      
      if (checkResult.data.status !== 'รออนุมัติ') {
        return NextResponse.json(
          { success: false, message: 'ไม่สามารถแก้ไขข้อมูลการลาที่ได้รับการอนุมัติหรือปฏิเสธแล้ว' },
          { status: 400 }
        );
      }
    }
    
    const data = await request.json();
    
    // ถ้าเป็นการอนุมัติหรือปฏิเสธการลา
    if (data.status === 'อนุมัติ' || data.status === 'ไม่อนุมัติ') {
      // ตรวจสอบว่าผู้ใช้เป็น admin หรือ manager หรือไม่
      if (session.user.role !== 'admin' && session.user.role !== 'manager') {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์อนุมัติหรือปฏิเสธการลา' },
          { status: 403 }
        );
      }
      
      // เพิ่มข้อมูลผู้อนุมัติ
      data.approvedBy = session.user.id;
    }
    
    // อัปเดตข้อมูลการลาใน Postgres
    const result = await updateLeave(id, data);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || result.error || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลการลา' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    console.error('Error updating leave:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - ลบข้อมูลการลา
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    // ดึงข้อมูลการลาเพื่อตรวจสอบสิทธิ์
    const checkResult = await getLeaveById(id);
    
    if (!checkResult.success) {
      return NextResponse.json(
        { success: false, message: checkResult.message || 'ไม่พบข้อมูลการลา' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (session.user.role === 'employee') {
      // พนักงานทั่วไปสามารถลบได้เฉพาะข้อมูลการลาของตัวเอง และต้องมีสถานะเป็น 'รออนุมัติ' เท่านั้น
      if (checkResult.data.employee_id !== parseInt(session.user.id)) {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูล' },
          { status: 403 }
        );
      }
      
      if (checkResult.data.status !== 'รออนุมัติ') {
        return NextResponse.json(
          { success: false, message: 'ไม่สามารถลบข้อมูลการลาที่ได้รับการอนุมัติหรือปฏิเสธแล้ว' },
          { status: 400 }
        );
      }
    }
    
    // ลบข้อมูลการลาใน Postgres
    const result = await deleteLeave(id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || result.error || 'เกิดข้อผิดพลาดในการลบข้อมูลการลา' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  } catch (error) {
    console.error('Error deleting leave:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 