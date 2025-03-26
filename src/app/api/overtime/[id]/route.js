import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getOvertimeById, updateOvertime, deleteOvertime } from '../../../../lib/db-prisma';

// GET - ดึงข้อมูลการทำงานล่วงเวลาตาม ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // ดึงข้อมูลการทำงานล่วงเวลาจาก Prisma
    const result = await getOvertimeById(id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลการทำงานล่วงเวลา' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (session.user.role === 'employee' && session.user.id !== result.data.employeeId) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลการทำงานล่วงเวลาของผู้อื่น' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/overtime/[id]:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PUT - อัปเดตข้อมูลการทำงานล่วงเวลา
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // ดึงข้อมูลการทำงานล่วงเวลาเพื่อตรวจสอบสิทธิ์
    const checkResult = await getOvertimeById(id);
    
    if (!checkResult.success) {
      return NextResponse.json(
        { success: false, message: checkResult.message || 'ไม่พบข้อมูลการทำงานล่วงเวลา' },
        { status: 404 }
      );
    }
    
    const overtime = checkResult.data;
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    // - พนักงานสามารถแก้ไขข้อมูลการทำงานล่วงเวลาของตัวเองได้เฉพาะเมื่อสถานะเป็น "รออนุมัติ"
    // - ผู้จัดการและแอดมินสามารถอนุมัติหรือไม่อนุมัติการทำงานล่วงเวลาได้
    if (session.user.role === 'employee') {
      if (session.user.id !== overtime.employeeId) {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์แก้ไขข้อมูลการทำงานล่วงเวลาของผู้อื่น' },
          { status: 403 }
        );
      }
      
      if (overtime.status !== 'รออนุมัติ') {
        return NextResponse.json(
          { success: false, message: 'ไม่สามารถแก้ไขข้อมูลการทำงานล่วงเวลาที่ได้รับการอนุมัติหรือไม่อนุมัติแล้ว' },
          { status: 400 }
        );
      }
    }
    
    const data = await request.json();
    
    // ถ้าเป็นการอนุมัติหรือไม่อนุมัติ
    if (data.status && (data.status === 'อนุมัติ' || data.status === 'ไม่อนุมัติ')) {
      if (session.user.role === 'employee') {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์อนุมัติหรือไม่อนุมัติการทำงานล่วงเวลา' },
          { status: 403 }
        );
      }
      
      // เพิ่มข้อมูลการอนุมัติ
      data.approvedById = session.user.id;
      data.approvedAt = new Date();
    }
    
    // อัปเดตข้อมูลการทำงานล่วงเวลาใน Prisma
    const result = await updateOvertime(id, data);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลการทำงานล่วงเวลา' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: result.data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PUT /api/overtime/[id]:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - ลบข้อมูลการทำงานล่วงเวลา
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // ดึงข้อมูลการทำงานล่วงเวลาเพื่อตรวจสอบสิทธิ์
    const checkResult = await getOvertimeById(id);
    
    if (!checkResult.success) {
      return NextResponse.json(
        { success: false, message: checkResult.message || 'ไม่พบข้อมูลการทำงานล่วงเวลา' },
        { status: 404 }
      );
    }
    
    const overtime = checkResult.data;
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    // - พนักงานสามารถลบข้อมูลการทำงานล่วงเวลาของตัวเองได้เฉพาะเมื่อสถานะเป็น "รออนุมัติ"
    // - แอดมินสามารถลบข้อมูลการทำงานล่วงเวลาได้ทั้งหมด
    if (session.user.role === 'employee') {
      if (session.user.id !== overtime.employeeId) {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์ลบข้อมูลการทำงานล่วงเวลาของผู้อื่น' },
          { status: 403 }
        );
      }
      
      if (overtime.status !== 'รออนุมัติ') {
        return NextResponse.json(
          { success: false, message: 'ไม่สามารถลบข้อมูลการทำงานล่วงเวลาที่ได้รับการอนุมัติหรือไม่อนุมัติแล้ว' },
          { status: 400 }
        );
      }
    } else if (session.user.role === 'manager') {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์ลบข้อมูลการทำงานล่วงเวลา' },
        { status: 403 }
      );
    }
    
    // ลบข้อมูลการทำงานล่วงเวลาใน Prisma
    const result = await deleteOvertime(id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการลบข้อมูลการทำงานล่วงเวลา' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: 'ลบข้อมูลการทำงานล่วงเวลาสำเร็จ' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/overtime/[id]:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 