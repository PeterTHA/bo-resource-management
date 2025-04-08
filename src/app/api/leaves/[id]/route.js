import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getLeaveById, updateLeave, deleteLeave, requestCancelLeave, approveCancelLeave, rejectCancelLeave, approveLeave, rejectLeave } from '../../../../lib/db-prisma';

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
    if ((session.user.role === 'permanent' || session.user.role === 'temporary') && session.user.id !== result.data.employee_id) {
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
    // - หัวหน้างานและแอดมินสามารถอนุมัติหรือไม่อนุมัติการลาได้
    if ((session.user.role === 'permanent' || session.user.role === 'temporary')) {
      if (session.user.id !== leave.employee_id) {
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
    
    const body = await request.json();
    
    const leaveData = {
      leave_type: body.leave_type,
      start_date: body.start_date && new Date(body.start_date),
      end_date: body.end_date && new Date(body.end_date),
      reason: body.reason,
      total_days: body.total_days,
      leave_format: body.leave_format,
    };

    // อัพเดทลิงก์ไฟล์แนบ (ถ้ามี)
    if (body.attachments !== undefined) {
      leaveData.attachments = body.attachments;
    }
    
    // ถ้าเป็นการอนุมัติหรือไม่อนุมัติโดยหัวหน้างานหรือแอดมิน
    if (body.status && (body.status === 'อนุมัติ' || body.status === 'ไม่อนุมัติ')) {
      // ตรวจสอบว่าผู้ใช้เป็นหัวหน้างานหรือแอดมินหรือไม่
      if (session.user.role !== 'supervisor' && session.user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์อนุมัติหรือไม่อนุมัติการลา' },
          { status: 403 }
        );
      }
      
      // กรณีหัวหน้างานอนุมัติการลาของตัวเอง หรือหัวหน้างานคนอื่น (อนุญาตให้ทำได้)
      const isApproverSelf = session.user.id === leave.employee_id;
      const isHeadApprovingHead = session.user.role === 'supervisor' && leave.employees?.role === 'supervisor';
      
      // ตรวจสอบพิเศษสำหรับกรณีที่หัวหน้างานอนุมัติให้พนักงานที่ไม่ใช่หัวหน้างาน
      // ไม่ต้องมีการตรวจสอบเพิ่มเติม อนุญาตให้ทำได้
      
      // เพิ่มข้อมูลการอนุมัติ/ไม่อนุมัติ
      leaveData.status = body.status;
      leaveData.approvedById = session.user.id;
      leaveData.approvedAt = new Date();
      leaveData.comment = body.comment || null;
    }
    
    // อัปเดตข้อมูลการลาใน Prisma
    const result = await updateLeave(id, leaveData);
    
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
    if ((session.user.role === 'permanent' || session.user.role === 'temporary')) {
      if (session.user.id !== leave.employee_id) {
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

// PATCH - สำหรับการยกเลิกการลา
export async function PATCH(request, { params }) {
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
    const data = await request.json();
    const action = data.action; // requestCancel, approveCancel, rejectCancel
    
    // ตรวจสอบว่ามีการระบุ action หรือไม่
    if (!action) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุการกระทำ (action)' },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (action) {
      case 'requestCancel':
        // ตรวจสอบสิทธิ์การเข้าถึง
        if (session.user.id !== leave.employee_id && session.user.role !== 'admin') {
          return NextResponse.json(
            { success: false, message: 'ไม่มีสิทธิ์ขอยกเลิกการลาของผู้อื่น' },
            { status: 403 }
          );
        }
        
        // ตรวจสอบว่าเป็นการลาที่อนุมัติแล้วหรือไม่
        if (leave.status !== 'อนุมัติ') {
          return NextResponse.json(
            { success: false, message: 'สามารถยกเลิกได้เฉพาะการลาที่อนุมัติแล้วเท่านั้น' },
            { status: 400 }
          );
        }
        
        // ตรวจสอบว่ามีเหตุผลการยกเลิกหรือไม่
        if (!data.reason) {
          return NextResponse.json(
            { success: false, message: 'กรุณาระบุเหตุผลในการยกเลิกการลา' },
            { status: 400 }
          );
        }
        
        // เตรียมข้อมูลสำหรับการขอยกเลิกการลา
        const cancelData = {
          reason: data.reason,
          employee_id: session.user.id
        };
        
        // ส่งคำขอยกเลิกการลา
        result = await requestCancelLeave(id, cancelData);
        break;
        
      case 'approveCancel':
        // ตรวจสอบสิทธิ์ในการอนุมัติการยกเลิก
        if (session.user.role !== 'admin' && session.user.role !== 'supervisor') {
          return NextResponse.json(
            { success: false, message: 'ไม่มีสิทธิ์อนุมัติการยกเลิกการลา' },
            { status: 403 }
          );
        }
        
        // หัวหน้างานสามารถอนุมัติการยกเลิกการลาของตัวเองและหัวหน้างานคนอื่นได้
        // ไม่จำเป็นต้องมีการตรวจสอบเพิ่มเติม เพราะหัวหน้างานมีสิทธิ์ในการอนุมัติอยู่แล้ว
        
        // ตรวจสอบว่าเป็นการลาที่ขอยกเลิกหรือไม่
        if (leave.cancelStatus !== 'รออนุมัติ') {
          return NextResponse.json(
            { success: false, message: 'ไม่สามารถอนุมัติการยกเลิกนี้ได้ เนื่องจากไม่ได้อยู่ในสถานะรออนุมัติ' },
            { status: 400 }
          );
        }
        
        // อนุมัติการยกเลิกการลา
        result = await approveCancelLeave(id, session.user.id);
        break;
        
      case 'rejectCancel':
        // ตรวจสอบสิทธิ์ในการปฏิเสธการยกเลิก
        if (session.user.role !== 'admin' && session.user.role !== 'supervisor') {
          return NextResponse.json(
            { success: false, message: 'ไม่มีสิทธิ์ปฏิเสธการยกเลิกการลา' },
            { status: 403 }
          );
        }
        
        // ตรวจสอบว่าเป็นการลาที่ขอยกเลิกหรือไม่
        if (leave.cancelStatus !== 'รออนุมัติ') {
          return NextResponse.json(
            { success: false, message: 'ไม่สามารถปฏิเสธการยกเลิกนี้ได้ เนื่องจากไม่ได้อยู่ในสถานะรออนุมัติ' },
            { status: 400 }
          );
        }
        
        // ปฏิเสธการยกเลิกการลา
        result = await rejectCancelLeave(id, session.user.id, data.comment);
        break;
        
      default:
        return NextResponse.json(
          { success: false, message: 'การกระทำไม่ถูกต้อง' },
          { status: 400 }
        );
    }
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการดำเนินการ' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: result.data, message: result.message },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PATCH /api/leaves/[id]:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 