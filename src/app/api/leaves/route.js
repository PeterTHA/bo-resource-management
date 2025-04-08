import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { getLeaves, createLeave } from '../../../lib/db-prisma';

// GET - ดึงข้อมูลการลาทั้งหมด
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  
  // รองรับ params undefined, null หรือค่าว่าง
  const employee_id = searchParams.get('employee_id') || undefined;
  const status = searchParams.get('status') || undefined;
  const start_date = searchParams.get('start_date') || undefined;
  const end_date = searchParams.get('end_date') || undefined;
  const leave_type = searchParams.get('leave_type') || undefined;

  try {
    const leaves = await getLeaves({
      employeeId: employee_id,
      status,
      startDate: start_date,
      endDate: end_date,
      leaveType: leave_type
    });
    
    if (!leaves.success) {
      return NextResponse.json(
        { success: false, message: leaves.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลการลา', connectionError: leaves.connectionError },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: leaves.data }, { status: 200 });
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
    console.log('Received leave data:', data);
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!data.leaveType || 
        !data.startDate || 
        !data.endDate || 
        !data.reason) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }
    
    // แก้ไขตรงนี้: ทุกคนสามารถลาได้เฉพาะของตัวเองเท่านั้น ไม่ว่าจะมีตำแหน่งอะไรก็ตาม
    // กำหนดให้ employeeId เป็น id ของผู้ใช้ที่ล็อกอินเสมอ
    // หมายเหตุ: หัวหน้างานสามารถอนุมัติการลาของตัวเองและหัวหน้างานคนอื่นได้
    // การอนุมัติการลาจะถูกจัดการที่ API PUT /api/leaves/[id]
    data.employee_id = session.user.id;
    
    // เพิ่มข้อมูลการลาใน Prisma
    const leaveData = {
      employee_id: data.employee_id,
      leave_type: data.leaveType,
      start_date: data.startDate,
      end_date: data.endDate,
      reason: data.reason,
      leave_format: data.leaveFormat || 'เต็มวัน',
      total_days: data.totalDays || 0,
      attachments: data.attachments || [],
    };
    
    const result = await createLeave(leaveData);
    
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