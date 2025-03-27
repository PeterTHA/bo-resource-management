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
    if ((session.user.role === 'permanent' || session.user.role === 'temporary') && session.user.id !== result.data.employeeId) {
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
    
    // ดึงข้อมูลที่จะอัปเดต
    const data = await request.json();
    
    // ถ้าเป็นการอนุมัติหรือไม่อนุมัติ
    if (data.status && (data.status === 'อนุมัติ' || data.status === 'ไม่อนุมัติ')) {
      // ตรวจสอบว่าเป็นหัวหน้างานหรือแอดมินหรือไม่
      if (session.user.role !== 'admin' && session.user.role !== 'supervisor') {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์อนุมัติหรือไม่อนุมัติการทำงานล่วงเวลา' },
          { status: 403 }
        );
      }
      
      // ตรวจสอบว่าสถานะเป็น "รออนุมัติ" หรือไม่
      if (overtime.status !== 'รออนุมัติ') {
        return NextResponse.json(
          { success: false, message: 'ไม่สามารถอนุมัติหรือไม่อนุมัติการทำงานล่วงเวลาที่มีการอนุมัติหรือไม่อนุมัติไปแล้ว' },
          { status: 400 }
        );
      }
      
      // ตรวจสอบกรณีหัวหน้างาน ว่ามีสิทธิ์อนุมัติรายการนี้หรือไม่
      if (session.user.role === 'supervisor') {
        // หัวหน้างานสามารถอนุมัติได้ถ้าเป็นพนักงานในทีม หรือหัวหน้างานในทีมเดียวกัน
        const isSameDepartment = session.user.departmentId === overtime.employee?.departmentId;
        
        if (!isSameDepartment) {
          return NextResponse.json(
            { success: false, message: 'หัวหน้างานสามารถอนุมัติได้เฉพาะพนักงานในทีมเดียวกันเท่านั้น' },
            { status: 403 }
          );
        }
      }
      
      // เพิ่มข้อมูลการอนุมัติ
      const updateData = {
        status: data.status,
        approvedById: data.approvedById || session.user.id,
        approvedAt: new Date(),
      };
      
      // เพิ่มความคิดเห็น (ถ้ามี)
      if (data.comment) {
        updateData.comment = data.comment;
      }
      
      // อัปเดตข้อมูลการทำงานล่วงเวลา
      const result = await updateOvertime(id, updateData);
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะการทำงานล่วงเวลา' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: true, data: result.data },
        { status: 200 }
      );
    }
    
    // ถ้าเป็นการขอยกเลิกหรือการยอมรับการยกเลิก
    if (data.cancelStatus) {
      // ถ้าเป็นการขอยกเลิก
      if (data.cancelStatus === 'รออนุมัติ') {
        // ตรวจสอบว่าเป็นพนักงานที่ขอทำงานล่วงเวลานี้หรือไม่
        if (session.user.id !== overtime.employeeId && session.user.role !== 'admin') {
          return NextResponse.json(
            { success: false, message: 'ไม่มีสิทธิ์ขอยกเลิกการทำงานล่วงเวลาของผู้อื่น' },
            { status: 403 }
          );
        }
        
        // ตรวจสอบว่าสถานะเป็น "อนุมัติ" หรือไม่
        if (overtime.status !== 'อนุมัติ') {
          return NextResponse.json(
            { success: false, message: 'สามารถขอยกเลิกได้เฉพาะการทำงานล่วงเวลาที่อนุมัติแล้วเท่านั้น' },
            { status: 400 }
          );
        }
        
        // เพิ่มข้อมูลการขอยกเลิก
        const updateData = {
          cancelStatus: 'รออนุมัติ',
          cancelRequestById: data.cancelRequestById || session.user.id,
          cancelRequestAt: data.cancelRequestAt ? new Date(data.cancelRequestAt) : new Date(),
          cancelReason: data.cancelReason || null
        };
        
        // อัปเดตข้อมูลการทำงานล่วงเวลา
        const result = await updateOvertime(id, updateData);
        
        if (!result.success) {
          return NextResponse.json(
            { success: false, message: result.message || 'เกิดข้อผิดพลาดในการขอยกเลิกการทำงานล่วงเวลา' },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { success: true, data: result.data, message: 'ส่งคำขอยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว' },
          { status: 200 }
        );
      }
      
      // ถ้าเป็นการอนุมัติการยกเลิก
      if (data.cancelStatus === 'อนุมัติ' && session.user.role === 'admin' || 
         (data.cancelStatus === 'อนุมัติ' && session.user.role === 'supervisor' && 
          session.user.departmentId === overtime.employee?.departmentId)) {
        // สร้างข้อมูลที่จะอัปเดต - สถานะยังคงเป็น 'อนุมัติ' แต่มีการอัปเดตสถานะการยกเลิก
        const updateData = {
          cancelStatus: data.cancelStatus,
          isCancelled: true,
          cancelledById: session.user.id,
          cancelledAt: new Date(),
        };
        
        // อัปเดตข้อมูลการทำงานล่วงเวลา
        const result = await updateOvertime(id, updateData);
        
        if (!result.success) {
          return NextResponse.json(
            { success: false, message: result.message || 'เกิดข้อผิดพลาดในการอนุมัติการยกเลิกการทำงานล่วงเวลา' },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { success: true, data: result.data },
          { status: 200 }
        );
      }
      
      // ถ้าเป็นการไม่อนุมัติการยกเลิก
      if (data.cancelStatus === 'ไม่อนุมัติ') {
        // ตรวจสอบว่าเป็นผู้จัดการหรือแอดมินหรือไม่
        if (session.user.role !== 'admin' && session.user.role !== 'supervisor') {
          return NextResponse.json(
            { success: false, message: 'ไม่มีสิทธิ์ปฏิเสธการยกเลิกการทำงานล่วงเวลา' },
            { status: 403 }
          );
        }
        
        // ตรวจสอบว่าสถานะการยกเลิกเป็น "รออนุมัติ" หรือไม่
        if (overtime.cancelStatus !== 'รออนุมัติ') {
          return NextResponse.json(
            { success: false, message: 'สามารถปฏิเสธการยกเลิกได้เฉพาะการทำงานล่วงเวลาที่มีการขอยกเลิกแล้วเท่านั้น' },
            { status: 400 }
          );
        }
        
        // เพิ่มข้อมูลการปฏิเสธการยกเลิก
        const updateData = {
          cancelStatus: 'ไม่อนุมัติ',
          cancelResponseById: data.cancelResponseById || session.user.id,
          cancelResponseAt: data.cancelResponseAt ? new Date(data.cancelResponseAt) : new Date(),
          cancelResponseComment: data.cancelResponseComment || null,
        };
        
        // อัปเดตข้อมูลการทำงานล่วงเวลา
        const result = await updateOvertime(id, updateData);
        
        if (!result.success) {
          return NextResponse.json(
            { success: false, message: result.message || 'เกิดข้อผิดพลาดในการปฏิเสธการยกเลิกการทำงานล่วงเวลา' },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { success: true, data: result.data },
          { status: 200 }
        );
      }
    }
    
    // ถ้าเป็นการแก้ไขข้อมูลทั่วไป
    // ตรวจสอบสิทธิ์การเข้าถึง
    // - พนักงานสามารถแก้ไขข้อมูลการทำงานล่วงเวลาของตัวเองได้เฉพาะเมื่อสถานะเป็น "รออนุมัติ"
    // - หัวหน้างานสามารถแก้ไขการทำงานล่วงเวลาที่เป็นของตัวเองได้
    if ((session.user.role === 'permanent' || session.user.role === 'temporary' || session.user.role === 'supervisor')) {
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
    } else if (session.user.role !== 'admin') {
      // เฉพาะแอดมินหรือเจ้าของสามารถแก้ไขข้อมูลได้
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์แก้ไขข้อมูลรายละเอียดการทำงานล่วงเวลา' },
        { status: 403 }
      );
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
    if ((session.user.role === 'permanent' || session.user.role === 'temporary')) {
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