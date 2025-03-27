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
    
    // กรณีต่างๆ ในการดึงข้อมูลการลา:
    // 1. ถ้าเป็น admin หรือ manager สามารถดูข้อมูลการลาทั้งหมดได้
    // 2. ถ้าเป็นหัวหน้าทีม (supervisor) สามารถดูข้อมูลการลาของพนักงานในทีมตัวเองได้
    // 3. ถ้าเป็นพนักงานทั่วไป ดูได้แค่ข้อมูลการลาของตัวเอง
    // 4. ถ้ามีการระบุ employeeId และผู้ใช้มีสิทธิ์ดูข้อมูลของพนักงานคนนั้น จะดึงเฉพาะข้อมูลของ employeeId นั้น
    
    if (session.user.role === 'admin' || session.user.role === 'manager') {
      // แอดมินหรือผู้จัดการดูข้อมูลได้ทั้งหมด
      if (employeeId) {
        result = await getLeaves(employeeId);
      } else {
        result = await getLeaves();
      }
    } else if (session.user.role === 'supervisor') {
      // หัวหน้าทีมดูข้อมูลของพนักงานในทีมตัวเองได้
      if (employeeId) {
        // ตรวจสอบว่า employeeId อยู่ในทีมเดียวกันหรือไม่
        // ถ้าเป็น ID ของตัวเอง หรืออยู่ในทีมเดียวกัน จึงจะดูได้
        if (employeeId === session.user.id) {
          result = await getLeaves(employeeId);
        } else {
          // ตรวจสอบว่าพนักงานที่ต้องการดูข้อมูลอยู่ในทีมเดียวกันหรือไม่
          // ใช้ค่า teamId จาก session (ต้องแน่ใจว่ามีใน session)
          if (session.user.teamId) {
            // ขอข้อมูลเฉพาะพนักงานในทีมเดียวกัน
            result = await getLeaves(employeeId, session.user.teamId);
          } else {
            // ถ้าไม่มีข้อมูลทีม ให้ดูได้เฉพาะข้อมูลตัวเอง
            result = await getLeaves(session.user.id);
          }
        }
      } else {
        // ไม่ได้ระบุ employeeId แสดงว่าต้องการดูข้อมูลทั้งทีม
        if (session.user.teamId) {
          // ดึงข้อมูลการลาของพนักงานทั้งทีม
          result = await getLeaves(null, session.user.teamId);
        } else {
          // ถ้าไม่มีข้อมูลทีม ให้ดูได้เฉพาะข้อมูลตัวเอง
          result = await getLeaves(session.user.id);
        }
      }
    } else {
      // พนักงานทั่วไปดูได้เฉพาะข้อมูลของตัวเอง
      result = await getLeaves(session.user.id);
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
    
    // แก้ไขตรงนี้: ทุกคนสามารถลาได้เฉพาะของตัวเองเท่านั้น ไม่ว่าจะมีตำแหน่งอะไรก็ตาม
    // กำหนดให้ employeeId เป็น id ของผู้ใช้ที่ล็อกอินเสมอ
    // หมายเหตุ: หัวหน้างานสามารถอนุมัติการลาของตัวเองและหัวหน้างานคนอื่นได้
    // การอนุมัติการลาจะถูกจัดการที่ API PUT /api/leaves/[id]
    data.employeeId = session.user.id;
    
    // เพิ่มข้อมูลการลาใน Prisma
    const leaveData = {
      employeeId: data.employeeId,
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      leaveFormat: data.leaveFormat || 'เต็มวัน',
      totalDays: data.totalDays || 0,
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