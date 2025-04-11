import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseISO } from 'date-fns';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';

// GET - ดึงข้อมูลสถานะการทำงาน
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // ตรวจสอบว่ามี workStatus model หรือไม่
    const hasWorkStatusModel = typeof prisma.work_statuses !== 'undefined';
    const hasWorkStatusesModel = typeof prisma.work_statuses !== 'undefined';

    if (!hasWorkStatusModel && !hasWorkStatusesModel) {
      return NextResponse.json({
        success: false,
        message: 'โมเดลข้อมูลสถานะการทำงานยังไม่พร้อมใช้งาน กรุณาตรวจสอบการติดตั้งฐานข้อมูล',
        data: null
      }, { status: 404 });
    }
    
    // ใช้โมเดลที่มีอยู่ (work_statuses หรือ workStatus)
    const model = prisma.work_statuses;
    
    const searchParams = request.nextUrl.searchParams;
    
    // ตรวจสอบพารามิเตอร์ที่ส่งมา
    const employeeId = searchParams.get('employee_id');
    let date = searchParams.get('date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    const whereClause = {};
    
    // ถ้ามีการระบุ employeeId ให้เพิ่มเงื่อนไขใน where
    if (employeeId) {
      whereClause.employee_id = employeeId;
    }
    
    // จัดการเงื่อนไขเกี่ยวกับวันที่
    if (date) {
      // แปลงวันที่จาก string เป็น Date object
      const dateObj = parseISO(date);
      
      // คัดลอกเฉพาะส่วนของวันที่ เดือน ปี โดยไม่สนใจเวลา
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth();
      const day = dateObj.getDate();
      
      // สร้าง Date object ใหม่ที่เริ่มต้นของวัน (00:00:00) แทนที่จะตั้งเป็นเที่ยงวัน
      const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59));
      
      // ตั้งเงื่อนไขการค้นหาเป็นช่วงเวลาตลอดทั้งวัน
      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay
      };
    } else if (startDate && endDate) {
      // ถ้ามีการระบุช่วงวันที่ (startDate และ endDate)
      if (
        employeeId && 
        new Date(startDate) && 
        new Date(endDate)
      ) {
        const existingWorkStatus = await model.findFirst({
          where: {
            employee_id: employeeId,
            OR: [
              {
                AND: [
                  { start_date: { lte: parseISO(startDate) } },
                  { end_date: { gte: parseISO(startDate) } }
                ]
              },
              {
                AND: [
                  { start_date: { lte: parseISO(endDate) } },
                  { end_date: { gte: parseISO(endDate) } }
                ]
              },
              {
                AND: [
                  { start_date: { gte: parseISO(startDate) } },
                  { end_date: { lte: parseISO(endDate) } }
                ]
              }
            ]
          }
        });
      }
    }
    
    console.log('Fetching work statuses with where clause:', whereClause);
    console.log(`Using model: ${hasWorkStatusesModel ? 'work_statuses' : 'workStatus'}`);
    
    // ดึงข้อมูลตามเงื่อนไขที่ระบุ โดยปรับการเรียกใช้ให้เข้ากับชื่อ relation ที่ถูกต้อง
    let workStatuses;
    if (hasWorkStatusesModel) {
      // ถ้าใช้โมเดล work_statuses
      workStatuses = await model.findMany({
        where: whereClause,
        include: {
          employees: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              position: true,
              departments: true,
              image: true,
            },
          },
          created_by: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });
      
      // แปลงชื่อ field ให้เป็นรูปแบบ camelCase เหมือนเดิม
      workStatuses = workStatuses.map(item => ({
        id: item.id,
        employee_id: item.employee_id,
        date: item.date,
        status: item.status,
        note: item.note,
        created_by_id: item.created_by_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        employees: item.employees_work_statuses_employee_id_to_employees ? {
          id: item.employees_work_statuses_employee_id_to_employees.id,
          first_name: item.employees_work_statuses_employee_id_to_employees.first_name,
          last_name: item.employees_work_statuses_employee_id_to_employees.last_name,
          position: item.employees_work_statuses_employee_id_to_employees.position,
          department_id: item.employees_work_statuses_employee_id_to_employees.department_id,
          image: item.employees_work_statuses_employee_id_to_employees.image,
        } : null,
        employees: item.created_by ? {
          id: item.created_by.id,
          first_name: item.created_by.first_name,
          last_name: item.created_by.last_name,
        } : null,
      }));
    } else {
      // ถ้าใช้โมเดล workStatus
      workStatuses = await model.findMany({
        where: whereClause,
        include: {
          employees: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              position: true,
              departments: true,
              image: true,
            },
          },
          created_by: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: workStatuses,
    });
  } catch (error) {
    console.error('Error fetching work statuses:', error);
    return NextResponse.json({
      success: false,
      message: error.message,
    }, { status: 500 });
  }
}

// POST - สร้างหรืออัปเดตสถานะการทำงาน
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    // ตรวจสอบว่าล็อกอินแล้วหรือไม่
    if (!session) {
      return NextResponse.json({ 
        error: true, 
        message: 'ไม่ได้รับอนุญาต' 
      }, { status: 401 });
    }

    const { employee_id, date, status, note } = await req.json();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!employee_id || !date || !status) {
      return NextResponse.json({ 
        error: true, 
        message: 'ข้อมูลไม่ครบถ้วน กรุณาระบุ employee_id, date และ status' 
      }, { status: 400 });
    }
    
    // แปลงวันที่จาก string เป็น Date object
    const dateObj = new Date(date);
    
    // สร้าง Date object ใหม่ ตั้งเวลาเป็น 00:00:00 เพื่อเก็บเฉพาะวันที่
    const normalizedDate = new Date(Date.UTC(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      0, 0, 0
    ));
    
    console.log(`Input date: ${date}`);
    console.log(`Normalized date to save: ${normalizedDate.toISOString()}`);

    // ตรวจสอบว่ามีโมเดล workStatus หรือไม่
    const hasWorkStatusModel = typeof prisma.work_statuses !== 'undefined';
    const hasWorkStatusesModel = typeof prisma.work_statuses !== 'undefined';

    if (!hasWorkStatusModel && !hasWorkStatusesModel) {
      return NextResponse.json({
        success: false,
        message: 'โมเดลข้อมูลสถานะการทำงานยังไม่พร้อมใช้งาน กรุณาตรวจสอบการติดตั้งฐานข้อมูล',
      }, { status: 404 });
    }
    
    // สร้างหรืออัปเดต workStatus
    let result;
    
    // ตรวจสอบว่าขอ้มูลสถานะการทำงานมีอยู่แล้วหรือไม่
    if (hasWorkStatusesModel) {
      // ใช้โมเดล work_statuses
      const existingRecord = await prisma.work_statuses.findFirst({
        where: {
          employee_id: employee_id,
          date: {
            gte: new Date(Date.UTC(
              dateObj.getFullYear(),
              dateObj.getMonth(),
              dateObj.getDate(),
              0, 0, 0
            )),
            lte: new Date(Date.UTC(
              dateObj.getFullYear(),
              dateObj.getMonth(),
              dateObj.getDate(),
              23, 59, 59
            ))
          }
        }
      });
      
      if (existingRecord) {
        // ถ้ามีข้อมูลอยู่แล้ว ให้อัปเดตข้อมูลเดิม
        result = await prisma.work_statuses.update({
          where: { id: existingRecord.id },
          data: {
            status,
            note,
            created_by_id: session.user.id, // อัปเดต created_by_id เป็นคนล่าสุดที่แก้ไขข้อมูล
            updated_at: new Date(), // เพิ่ม updated_at เป็นเวลาปัจจุบัน
          },
          include: {
            employees_work_statuses_employee_id_to_employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                department_id: true,
                image: true,
              },
            },
            created_by: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        });
        
        // แปลงชื่อ field ให้เป็นรูปแบบ camelCase
        result = {
          id: result.id,
          employee_id: result.employee_id,
          date: result.date,
          status: result.status,
          note: result.note,
          created_by_id: result.created_by_id,
          created_at: result.created_at,
          updated_at: result.updated_at,
          employees: result.employees_work_statuses_employee_id_to_employees ? {
            id: result.employees_work_statuses_employee_id_to_employees.id,
            first_name: result.employees_work_statuses_employee_id_to_employees.first_name,
            last_name: result.employees_work_statuses_employee_id_to_employees.last_name,
            position: result.employees_work_statuses_employee_id_to_employees.position,
            department_id: result.employees_work_statuses_employee_id_to_employees.department_id,
            image: result.employees_work_statuses_employee_id_to_employees.image,
          } : null,
          employees: result.created_by ? {
            id: result.created_by.id,
            first_name: result.created_by.first_name,
            last_name: result.created_by.last_name,
          } : null
        };
        
        return NextResponse.json({
          success: true,
          message: 'อัปเดตสถานะการทำงานเรียบร้อยแล้ว',
          data: result
        });
      } else {
        // ถ้าไม่มีข้อมูลอยู่ ให้สร้างข้อมูลใหม่
        result = await prisma.work_statuses.create({
          data: {
            id: crypto.randomUUID(),
            employee_id: employee_id,
            date: normalizedDate,
            status,
            note,
            created_by_id: session.user.id,
            updated_at: new Date(), // เพิ่ม updated_at เป็นเวลาปัจจุบัน
          },
          include: {
            employees_work_statuses_employee_id_to_employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                department_id: true,
                image: true,
              },
            },
            created_by: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        });
        
        // แปลงชื่อ field ให้เป็นรูปแบบ camelCase
        result = {
          id: result.id,
          employee_id: result.employee_id,
          date: result.date,
          status: result.status,
          note: result.note,
          created_by_id: result.created_by_id,
          created_at: result.created_at,
          updated_at: result.updated_at,
          employees: result.employees_work_statuses_employee_id_to_employees ? {
            id: result.employees_work_statuses_employee_id_to_employees.id,
            first_name: result.employees_work_statuses_employee_id_to_employees.first_name,
            last_name: result.employees_work_statuses_employee_id_to_employees.last_name,
            position: result.employees_work_statuses_employee_id_to_employees.position,
            department_id: result.employees_work_statuses_employee_id_to_employees.department_id,
            image: result.employees_work_statuses_employee_id_to_employees.image,
          } : null,
          employees: result.created_by ? {
            id: result.created_by.id,
            first_name: result.created_by.first_name,
            last_name: result.created_by.last_name,
          } : null
        };
        
        return NextResponse.json({
          success: true,
          message: 'บันทึกสถานะการทำงานเรียบร้อยแล้ว',
          data: result
        });
      }
    } else {
      // ใช้โมเดล workStatus
      // ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
      const existingWorkStatus = await prisma.work_statuses.findFirst({
        where: {
          employee_id,
          date: normalizedDate
        }
      });
      
      if (existingWorkStatus) {
        // ถ้ามีข้อมูลอยู่แล้ว ให้อัปเดตข้อมูลเดิม
        result = await prisma.work_statuses.update({
          where: { id: existingWorkStatus.id },
          data: {
            status,
            note,
            created_by_id: session.user.id, // อัปเดต createdById เป็นคนล่าสุดที่แก้ไขข้อมูล
            updated_at: new Date(), // เพิ่ม updated_at เป็นเวลาปัจจุบัน
          },
          include: {
            employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                departments: true,
                image: true,
              },
            },
            created_by: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        });
      } else {
        // ถ้าไม่มีข้อมูลอยู่ ให้สร้างข้อมูลใหม่
        result = await prisma.work_statuses.create({
          data: {
            id: crypto.randomUUID(),
            employee_id,
            date: normalizedDate,
            status,
            note,
            created_by_id: session.user.id,
            updated_at: new Date(), // เพิ่ม updated_at เป็นเวลาปัจจุบัน
          },
          include: {
            employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                departments: true,
                image: true,
              },
            },
            created_by: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        });
      }
      
      return NextResponse.json({
        success: true,
        message: existingWorkStatus ? 'อัปเดตสถานะการทำงานเรียบร้อยแล้ว' : 'บันทึกสถานะการทำงานเรียบร้อยแล้ว',
        data: result
      });
    }
  } catch (error) {
    console.error('Error saving work status:', error);
    return NextResponse.json({
      success: false,
      message: `เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message}`,
    }, { status: 500 });
  }
}

// DELETE - ลบสถานะการทำงาน
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    
    // ตรวจสอบว่าล็อกอินแล้วหรือไม่
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: 'ไม่ได้รับอนุญาต' 
      }, { status: 401 });
    }

    // รับพารามิเตอร์จาก URL
    const searchParams = new URL(req.url).searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'กรุณาระบุ ID' 
      }, { status: 400 });
    }

    // ตรวจสอบว่ามี workStatus model หรือไม่
    const hasWorkStatusModel = typeof prisma.work_statuses !== 'undefined';
    const hasWorkStatusesModel = typeof prisma.work_statuses !== 'undefined';

    if (!hasWorkStatusModel && !hasWorkStatusesModel) {
      return NextResponse.json({
        success: false,
        message: 'โมเดลข้อมูลสถานะการทำงานยังไม่พร้อมใช้งาน กรุณาตรวจสอบการติดตั้งฐานข้อมูล',
        data: null
      }, { status: 404 });
    }
    
    // ใช้โมเดลที่มีอยู่ (work_statuses หรือ workStatus)
    const model = prisma.work_statuses;
    
    // ตรวจสอบว่ามีข้อมูลนี้อยู่หรือไม่
    const workStatus = await model.findUnique({
      where: { id },
    });
    
    if (!workStatus) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบข้อมูลสถานะการทำงานที่ต้องการลบ',
      }, { status: 404 });
    }
    
    // ตรวจสอบสิทธิ์
    const isAdmin = session.user.role === 'admin';
    const isTeamLead = session.user.role === 'team_lead' || session.user.role === 'supervisor';
    
    // ตรวจสอบว่าเป็นเจ้าของข้อมูลหรือไม่ (ต้องปรับตามชื่อฟิลด์ของโมเดล)
    const isSameUser = hasWorkStatusesModel 
      ? session.user.id === workStatus.employee_id
      : session.user.id === workStatus.employee_id;
      
    const isCreator = hasWorkStatusesModel
      ? session.user.id === workStatus.created_by_id
      : session.user.id === workStatus.created_by_id;

    // ถ้าไม่ใช่ admin, team lead, เจ้าของบัญชี หรือผู้สร้างข้อมูล
    if (!isAdmin && !isTeamLead && !isSameUser && !isCreator) {
      return NextResponse.json({
        success: false,
        message: 'ไม่มีสิทธิ์ลบข้อมูลนี้',
      }, { status: 403 });
    }

    // ลบข้อมูล
    await model.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'ลบสถานะการทำงานสำเร็จ',
    });
  } catch (error) {
    console.error('Error deleting work status:', error);
    return NextResponse.json({
      success: false,
      message: `เกิดข้อผิดพลาดในการลบข้อมูล: ${error.message}`,
    }, { status: 500 });
  }
} 