import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    // ตรวจสอบการ authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // รับพารามิเตอร์ startDate และ endDate จาก URL
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required parameters: startDate or endDate' 
      }, { status: 400 });
    }

    // แปลงวันที่เป็น Date object
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    startDateTime.setHours(0, 0, 0, 0);
    endDateTime.setHours(23, 59, 59, 999);

    // ดึงข้อมูลพนักงานที่ active พร้อมกับข้อมูลที่เกี่ยวข้อง
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
        positionTitle: true,
        positionLevel: true,
        role: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        teamData: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        teamId: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // เพิ่มข้อมูลทีมให้พนักงาน
    const employeesWithTeam = employees.map(employee => {
      // ตรวจสอบว่ามีข้อมูลทีมหรือไม่
      if (employee.teamData) {
        return {
          ...employee,
          teamName: employee.teamData.name,
          userTeam: employee.teamData,
          team: employee.teamData // เพิ่ม team เพื่อให้ใช้ได้กับทั้งชื่อ team และ teamData
        };
      } else if (employee.teamId) {
        return {
          ...employee,
          teamId: employee.teamId
        };
      }
      return employee;
    });

    // ดึงข้อมูลสถานะการทำงาน
    const workStatuses = await prisma.workStatus.findMany({
      where: {
        date: {
          gte: startDateTime,
          lte: endDateTime
        }
      },
      select: {
        id: true,
        employeeId: true,
        date: true,
        status: true,
        note: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // ดึงข้อมูลการลาที่อนุมัติแล้ว
    const leaves = await prisma.leave.findMany({
      where: {
        startDate: {
          gte: startDateTime
        },
        endDate: {
          lte: endDateTime
        },
        status: 'approved'
      },
      select: {
        id: true,
        employeeId: true,
        leaveType: true,
        startDate: true,
        endDate: true,
        reason: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        attachments: true,
        leaveFormat: true,
        totalDays: true
      }
    });

    // ดึงข้อมูล OT ที่อนุมัติแล้ว
    const overtimes = await prisma.overtime.findMany({
      where: {
        date: {
          gte: startDateTime,
          lte: endDateTime
        },
        status: 'อนุมัติ'
      },
      select: {
        id: true,
        employeeId: true,
        date: true,
        startTime: true,
        endTime: true,
        totalHours: true,
        status: true,
        reason: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // ส่งข้อมูลทั้งหมดกลับ
    return NextResponse.json({
      success: true,
      data: {
        employees: employeesWithTeam,
        workStatuses,
        leaves,
        overtimes
      }
    });

  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    }, { status: 500 });
  }
} 