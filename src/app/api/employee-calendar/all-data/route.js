import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db-prisma';

export async function GET(request) {
  try {
    // ตรวจสอบการ authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // รับพารามิเตอร์ startDate และ endDate จาก URL
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const dashboardMode = searchParams.get('dashboardMode') === 'true';

    if (!startDate || !endDate) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required parameters: start_date or end_date' 
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
      const employees = await prisma.employees.findMany({
        where: {
          team_id: session.user.team_id,
          is_active: true
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          image: true
        },
        orderBy: {
          first_name: 'asc'
        }
      });

      // ดึงสถานะการทำงานของวันที่ที่ระบุ - ใช้ startDateTime ที่ได้รับจาก URL
      const employeeIds = employees.map(emp => emp.id);
      const workStatuses = await prisma.work_statuses.findMany({
        where: {
          employee_id: {
            in: employeeIds
          },
          date: {
            equals: startDateTime
          }
        },
        select: {
          id: true,
          employee_id: true,
          status: true,
          date: true,
        }
      });

      console.log('Found work statuses:', workStatuses.length);

      // ดึงข้อมูลการลาที่ซ้อนทับกับวันที่ที่ระบุ - ใช้วันที่ที่ได้รับจาก URL
      const leaves = await prisma.leaves.findMany({
        where: {
          employee_id: {
            in: employeeIds
          },
          start_date: {
            lte: endDateTime
          },
          end_date: {
            gte: startDateTime
          },
          OR: [
            { status: 'approved' },
            { status: 'waiting_for_approve' }
          ]
        },
        select: {
          id: true,
          employee_id: true,
          leave_type: true,
          start_date: true,
          end_date: true,
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
    const employees = await prisma.employees.findMany({
      where: {
        is_active: true
      },
      select: {
        id: true,
        employee_id: true,
        first_name: true,
        last_name: true,
        email: true,
        image: true,
        position_title: true,
        position_level: true,
        role: true,
        departments: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        teams: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        team_id: true
      },
      orderBy: [
        { first_name: 'asc' },
        { last_name: 'asc' }
      ]
    });

    // เพิ่มข้อมูลทีมให้พนักงาน
    const employeesWithTeam = employees.map(employee => {
      // ตรวจสอบว่ามีข้อมูลทีมหรือไม่
      if (employee.teams) {
        return {
          ...employee,
          teamName: employee.teams.name,
          userTeam: employee.teams,
          teams: employee.teams // เพิ่ม team เพื่อให้ใช้ได้กับทั้งชื่อ team และ teamData
        };
      } else if (employee.team_id) {
        return {
          ...employee,
          team_id: employee.team_id
        };
      }
      return employee;
    });

    // ดึงข้อมูลสถานะการทำงาน
    const workStatuses = await prisma.work_statuses.findMany({
      where: {
        date: {
          gte: startDateTime,
          lte: endDateTime
        }
      },
      select: {
        id: true,
        employee_id: true,
        date: true,
        status: true,
        note: true,
        created_at: true,
        updated_at: true,
        created_by_id: true,
        employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            position: true,
            image: true
          }
        },
        employees_work_statuses_created_by_idToemployees: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    // แปลงชื่อฟิลด์ให้อยู่ในรูปแบบ camelCase
    const formattedWorkStatuses = workStatuses.map(item => ({
      id: item.id,
      employee_id: item.employee_id,
      date: item.date,
      status: item.status,
      note: item.note,
      created_at: item.created_at,
      updated_at: item.updated_at,
      created_by_id: item.created_by_id,
      employees: item.employees ? {
        id: item.employees.id,
        first_name: item.employees.first_name,
        last_name: item.employees.last_name,
        position: item.employees.position,
        image: item.employees.image
      } : null,
      created_by: item.employees_work_statuses_created_by_idToemployees ? {
        id: item.employees_work_statuses_created_by_idToemployees.id,
        first_name: item.employees_work_statuses_created_by_idToemployees.first_name,
        last_name: item.employees_work_statuses_created_by_idToemployees.last_name
      } : null
    }));

    // ดึงข้อมูลการลาที่อนุมัติแล้ว
    const leaves = await prisma.leaves.findMany({
      where: {
        start_date: {
          gte: startDateTime
        },
        end_date: {
          lte: endDateTime
        },
        leave_approvals: {
          some: {
            status: 'approved'
          }
        }
      },
      select: {
        id: true,
        employee_id: true,
        leave_type: true,
        start_date: true,
        end_date: true,
        reason: true,
        status: true,
        created_at: true,
        updated_at: true,
        attachments: true,
        leave_format: true,
        total_days: true,
        employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            image: true
          }
        },
        leave_approvals: {
          orderBy: {
            created_at: 'desc'
          },
          include: {
            employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true
              }
            }
          }
        }
      }
    });

    // ดึงข้อมูล OT ที่อนุมัติแล้ว
    const overtimes = await prisma.overtimes.findMany({
      where: {
        date: {
          gte: startDateTime,
          lte: endDateTime
        },
        status: 'approved'
      },
      select: {
        id: true,
        employee_id: true,
        date: true,
        start_time: true,
        end_time: true,
        total_hours: true,
        status: true,
        reason: true,
        created_at: true,
        updated_at: true
      }
    });
    
    // ส่งข้อมูลทั้งหมดกลับ
    return NextResponse.json({
      success: true,
      data: {
        employees: employeesWithTeam,
        workStatuses: formattedWorkStatuses,
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