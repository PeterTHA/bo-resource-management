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
    const dashboardMode = searchParams.get('dashboardMode') === 'true';

    if (!startDate || !endDate) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required parameters: startDate or endDate' 
      }, { status: 400 });
    }

    // แปลงวันที่เป็น Date object
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    
    // ต้องแน่ใจว่าใช้ UTC time ไม่ตัด timezone ทิ้ง
    console.log('Start date from client:', startDate);
    console.log('End date from client:', endDate);
    console.log('Parsed start date:', startDateTime.toISOString());
    console.log('Parsed end date:', endDateTime.toISOString());
    
    // ตั้งเวลาให้ครอบคลุมทั้งวัน
    startDateTime.setHours(0, 0, 0, 0);
    endDateTime.setHours(23, 59, 59, 999);
    
    console.log('Adjusted start date:', startDateTime.toISOString());
    console.log('Adjusted end date:', endDateTime.toISOString());

    // หากเป็นโหมด Dashboard ให้ดึงเฉพาะข้อมูลจำเป็น
    if (dashboardMode) {
      // สำหรับ Dashboard เราต้องการเพียงข้อมูลสมาชิกในทีมและสถานะของวันที่ที่ระบุ
      console.log('Running in dashboard mode for date:', startDateTime.toISOString());
      
      // ดึงข้อมูลพนักงานในทีมเดียวกัน
      const employees = await prisma.employee.findMany({
        where: {
          teamId: session.user.teamId,
          isActive: true
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          image: true
        },
        orderBy: {
          firstName: 'asc'
        }
      });

      // ดึงสถานะการทำงานของวันที่ที่ระบุ - ใช้ startDateTime ที่ได้รับจาก URL
      const employeeIds = employees.map(emp => emp.id);
      const workStatuses = await prisma.workStatus.findMany({
        where: {
          employeeId: {
            in: employeeIds
          },
          date: {
            equals: startDateTime
          }
        },
        select: {
          id: true,
          employeeId: true,
          status: true,
          date: true,
        }
      });

      console.log('Found work statuses:', workStatuses.length);

      // ดึงข้อมูลการลาที่ซ้อนทับกับวันที่ที่ระบุ - ใช้วันที่ที่ได้รับจาก URL
      const leaves = await prisma.leave.findMany({
        where: {
          employeeId: {
            in: employeeIds
          },
          startDate: {
            lte: endDateTime
          },
          endDate: {
            gte: startDateTime
          },
          OR: [
            { status: 'approved' },
            { status: 'waiting_for_approve' }
          ]
        },
        select: {
          id: true,
          employeeId: true,
          leaveType: true,
          startDate: true,
          endDate: true,
          status: true
        }
      });
      
      console.log('Found leaves:', leaves.length);
      
      // ส่งข้อมูลกลับ
      return NextResponse.json({
        success: true,
        data: {
          employees,
          workStatuses,
          leaves,
          overtimes: []
        }
      });
    }

    // กรณีไม่ใช่ dashboard mode ให้ดึงข้อมูลตามปกติ (ดึงข้อมูลทั้งหมด)
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
        status: 'approved'
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