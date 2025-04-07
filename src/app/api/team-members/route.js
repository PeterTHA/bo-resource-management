import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // ดึงเฉพาะข้อมูลวันปัจจุบัน
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // ดึงข้อมูลพนักงานในทีมเดียวกัน - ลดจำนวนที่ select ลงเหลือเฉพาะที่จำเป็น
    const employees = await prisma.employee.findMany({
      where: {
        teamId: session.user.teamId,
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        positionTitle: true,
        image: true,
        work_statuses_work_statuses_employee_idToemployees: {
          where: {
            date: {
              equals: today
            }
          },
          orderBy: {
            date: 'desc'
          },
          take: 1,
          select: {
            status: true
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    // ดึงข้อมูลการลาของวันนี้
    const todayLeaves = await prisma.leave.findMany({
      where: {
        employeeId: {
          in: employees.map(emp => emp.id)
        },
        startDate: {
          lte: today
        },
        endDate: {
          gte: today
        },
        OR: [
          { status: 'approved' },
          { status: 'waiting_for_approve' }
        ]
      },
      select: {
        employeeId: true,
        leaveType: true,
        status: true
      }
    });

    // สร้างตัวแปรชั่วคราวเพื่อเก็บความสัมพันธ์ระหว่าง id พนักงานกับการลา
    const employeeLeaveMap = {};
    todayLeaves.forEach(leave => {
      employeeLeaveMap[leave.employeeId] = leave;
    });

    // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการและรวมกับข้อมูลการลา
    const formattedEmployees = employees.map(employee => {
      const todayStatus = employee.work_statuses_work_statuses_employee_idToemployees[0]?.status || 'OFFICE';
      const todayLeave = employeeLeaveMap[employee.id];
      
      const status = todayLeave ? 'LEAVE' : todayStatus;
      
      return {
        id: employee.id,
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        positionTitle: employee.positionTitle || '',
        image: employee.image || null,
        workStatuses: [{
          status: status
        }],
        // เพิ่มข้อมูลการลาถ้ามี
        leave: todayLeave ? {
          leaveType: todayLeave.leaveType,
          status: todayLeave.status
        } : null
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedEmployees
    });

  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิกในทีม' },
      { status: 500 }
    );
  }
} 