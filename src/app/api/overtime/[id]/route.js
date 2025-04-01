import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { 
  getOvertimeById, 
  updateOvertimeNew, 
  approveOvertimeNew, 
  rejectOvertimeNew,
  requestCancelOvertimeNew,
  approveCancelOvertimeNew,
  rejectCancelOvertimeNew,
  deleteOvertime 
} from '../../../../lib/db-prisma';

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
    
    // ต้อง await params ก่อนใช้ id
    const { id } = await params;
    const result = await getOvertimeById(id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลการทำงานล่วงเวลา' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: result.data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/overtime/[id]:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * ฟังก์ชันสำหรับจัดการคำขอ PUT สำหรับอัปเดต OT
 */
export async function PUT(request, { params }) {
  try {
    // เช็คว่ามี session หรือไม่
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    // ดึงค่า id ที่ต้องการอัปเดต
    const { id } = await params;
    
    // ดึงข้อมูลจาก request body
    const data = await request.json();
    
    // เช็คประเภทการอัปเดต
    if (data.action === 'approve') {
      // ข้อมูลสำหรับการอนุมัติ
      const approvalData = {
        approverId: session.user.id,
        comment: data.comment || null,
      };
      
      // อนุมัติการทำงานล่วงเวลา
      const result = await approveOvertimeNew(id, approvalData);
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: true, data: result.data, message: result.message },
        { status: 200 }
      );
    } else if (data.action === 'reject') {
      // ข้อมูลสำหรับการไม่อนุมัติ
      const rejectionData = {
        approverId: session.user.id,
        comment: data.comment || null,
      };
      
      // ไม่อนุมัติการทำงานล่วงเวลา
      const result = await rejectOvertimeNew(id, rejectionData);
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: true, data: result.data, message: result.message },
        { status: 200 }
      );
    } else if (data.action === 'request_cancel') {
      // ข้อมูลสำหรับการขอยกเลิก
      const cancelData = {
        employeeId: session.user.id,
        reason: data.reason || null,
      };
      
      // ขอยกเลิกการทำงานล่วงเวลา
      const result = await requestCancelOvertimeNew(id, cancelData);
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: true, data: result.data, message: result.message },
        { status: 200 }
      );
    } else if (data.action === 'approve_cancel') {
      // ข้อมูลสำหรับการอนุมัติยกเลิก
      const approvalCancelData = {
        approverId: session.user.id,
        comment: data.comment || null,
      };
      
      // อนุมัติการยกเลิกการทำงานล่วงเวลา
      const result = await approveCancelOvertimeNew(id, approvalCancelData);
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: true, data: result.data, message: result.message },
        { status: 200 }
      );
    } else if (data.action === 'reject_cancel') {
      // ข้อมูลสำหรับการไม่อนุมัติยกเลิก
      const rejectionCancelData = {
        approverId: session.user.id,
        comment: data.comment || null,
      };
      
      // ไม่อนุมัติการยกเลิกการทำงานล่วงเวลา
      const result = await rejectCancelOvertimeNew(id, rejectionCancelData);
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: true, data: result.data, message: result.message },
        { status: 200 }
      );
    } else {
      // อัปเดตข้อมูลการทำงานล่วงเวลาทั่วไป
      const result = await updateOvertimeNew(id, data);
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: true, data: result.data, message: 'อัปเดตข้อมูลการทำงานล่วงเวลาเรียบร้อยแล้ว' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error updating overtime:', error);
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
    
    // ดึงข้อมูลการทำงานล่วงเวลา
    const { id } = await params;
    const overtime = await getOvertimeById(id);
    
    if (!overtime.success) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    // - พนักงานสามารถลบข้อมูลการทำงานล่วงเวลาของตัวเองได้เฉพาะเมื่อสถานะเป็น "รออนุมัติ"
    if ((session.user.role === 'permanent' || session.user.role === 'temporary' || session.user.role === 'supervisor')) {
      if (session.user.id !== overtime.data.employeeId) {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์ลบข้อมูลการทำงานล่วงเวลาของผู้อื่น' },
          { status: 403 }
        );
      }
      
      if (overtime.data.status !== 'waiting_for_approve' && overtime.data.status !== 'รออนุมัติ') {
        return NextResponse.json(
          { success: false, message: 'ไม่สามารถลบข้อมูลการทำงานล่วงเวลาที่ได้รับการอนุมัติหรือไม่อนุมัติแล้ว' },
          { status: 400 }
        );
      }
    } else if (session.user.role !== 'admin') {
      // เฉพาะแอดมินหรือเจ้าของสามารถลบข้อมูลได้
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์ลบข้อมูลการทำงานล่วงเวลา' },
        { status: 403 }
      );
    }
    
    // ลบข้อมูลการทำงานล่วงเวลา
    const result = await deleteOvertime(id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการลบข้อมูลการทำงานล่วงเวลา' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: 'ลบข้อมูลการทำงานล่วงเวลาเรียบร้อยแล้ว' },
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