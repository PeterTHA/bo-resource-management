import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { getLeaveById, rejectCancelLeave } from '../../../../../lib/db-prisma';

// PUT - สำหรับการไม่อนุมัติการยกเลิกการลา
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    // ตรวจสอบว่าเป็นผู้มีสิทธิ์อนุมัติหรือไม่
    if (session.user.role !== 'admin' && session.user.role !== 'supervisor') {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์ไม่อนุมัติการยกเลิกการลา' },
        { status: 403 }
      );
    }
    
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // ดึงข้อมูลการลาเพื่อตรวจสอบสถานะ
    const checkResult = await getLeaveById(id);
    
    if (!checkResult.success) {
      return NextResponse.json(
        { success: false, message: checkResult.message || 'ไม่พบข้อมูลการลา' },
        { status: 404 }
      );
    }
    
    const leave = checkResult.data;
    
    // ตรวจสอบว่าสถานะการลาต้องเป็น "อนุมัติ" และมีการขอยกเลิก
    const hasCancelRequest = leave.approvals?.some(
      a => a.type === 'request_cancel' && a.status === 'completed'
    );
    
    if (leave.status !== 'อนุมัติ' || !hasCancelRequest) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'ไม่สามารถปฏิเสธการยกเลิกได้ เนื่องจากสถานะไม่ถูกต้องหรือไม่มีคำขอยกเลิก' 
        },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // ไม่อนุมัติการยกเลิกการลาใน Prisma
    const result = await rejectCancelLeave(id, session.user.id, body.comment || null);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการไม่อนุมัติการยกเลิกการลา' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: result.data, message: 'ไม่อนุมัติการยกเลิกการลาเรียบร้อยแล้ว' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PUT /api/leaves/[id]/reject-cancel:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 