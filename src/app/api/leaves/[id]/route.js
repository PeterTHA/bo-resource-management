import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getLeaveById, updateLeave, deleteLeave } from '../../../../lib/db-prisma';

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
    
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // ดึงข้อมูลการลาจาก Prisma
    const result = await getLeaveById(id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลการลา' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (session.user.role === 'employee' && session.user.id !== result.data.employeeId) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลการลาของผู้อื่น' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/leaves/[id]:', error);
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
    
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // ดึงข้อมูลการลาเพื่อตรวจสอบสิทธิ์
    const checkResult = await getLeaveById(id);
    
    if (!checkResult.success) {
      return NextResponse.json(
        { success: false, message: checkResult.message || 'ไม่พบข้อมูลการลา' },
        { status: 404 }
      );
    }
    
    const leave = checkResult.data;
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    // - พนักงานสามารถแก้ไขข้อมูลการลาของตัวเองได้เฉพาะเมื่อสถานะเป็น "รออนุมัติ"
    // - ผู้จัดการและแอดมินสามารถอนุมัติหรือไม่อนุมัติการลาได้
    if (session.user.role === 'employee') {
      if (session.user.id !== leave.employeeId) {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์แก้ไขข้อมูลการลาของผู้อื่น' },
          { status: 403 }
        );
      }
      
      if (leave.status !== 'รออนุมัติ') {
        return NextResponse.json(
          { success: false, message: 'ไม่สามารถแก้ไขข้อมูลการลาที่ได้รับการอนุมัติหรือไม่อนุมัติแล้ว' },
          { status: 400 }
        );
      }
    }
    
    const data = await request.json();
    
    // ถ้าเป็นการอนุมัติหรือไม่อนุมัติ
    if (data.status && (data.status === 'อนุมัติ' || data.status === 'ไม่อนุมัติ')) {
      if (session.user.role === 'employee') {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์อนุมัติหรือไม่อนุมัติการลา' },
          { status: 403 }
        );
      }
      
      // เพิ่มข้อมูลการอนุมัติ
      data.approvedById = session.user.id;
      data.approvedAt = new Date();
    }
    
    // อัปเดตข้อมูลการลาใน Prisma
    const result = await updateLeave(id, data);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลการลา' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: result.data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PUT /api/leaves/[id]:', error);
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
    
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // ดึงข้อมูลการลาเพื่อตรวจสอบสิทธิ์
    const checkResult = await getLeaveById(id);
    
    if (!checkResult.success) {
      return NextResponse.json(
        { success: false, message: checkResult.message || 'ไม่พบข้อมูลการลา' },
        { status: 404 }
      );
    }
    
    const leave = checkResult.data;
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    // - พนักงานสามารถลบข้อมูลการลาของตัวเองได้เฉพาะเมื่อสถานะเป็น "รออนุมัติ"
    // - แอดมินสามารถลบข้อมูลการลาได้ทั้งหมด
    if (session.user.role === 'employee') {
      if (session.user.id !== leave.employeeId) {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์ลบข้อมูลการลาของผู้อื่น' },
          { status: 403 }
        );
      }
      
      if (leave.status !== 'รออนุมัติ') {
        return NextResponse.json(
          { success: false, message: 'ไม่สามารถลบข้อมูลการลาที่ได้รับการอนุมัติหรือไม่อนุมัติแล้ว' },
          { status: 400 }
        );
      }
    } else if (session.user.role === 'manager') {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์ลบข้อมูลการลา' },
        { status: 403 }
      );
    }
    
    // ลบข้อมูลการลาใน Prisma
    const result = await deleteLeave(id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการลบข้อมูลการลา' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: 'ลบข้อมูลการลาสำเร็จ' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/leaves/[id]:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 