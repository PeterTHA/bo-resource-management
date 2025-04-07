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
    const hasWorkStatusModel = typeof prisma.workStatus !== 'undefined';
    const hasWorkStatusesModel = typeof prisma.work_statuses !== 'undefined';

    if (!hasWorkStatusModel && !hasWorkStatusesModel) {
      return NextResponse.json({
        success: false,
        message: 'โมเดลข้อมูลสถานะการทำงานยังไม่พร้อมใช้งาน กรุณาตรวจสอบการติดตั้งฐานข้อมูล',
        data: []
      }, { status: 404 });
    }
    
    // ใช้โมเดลที่มีอยู่ (work_statuses หรือ workStatus)
    const model = hasWorkStatusesModel ? prisma.work_statuses : prisma.workStatus;
    
    const searchParams = request.nextUrl.searchParams;
    
    // ตรวจสอบพารามิเตอร์ที่ส่งมา
    const employeeId = searchParams.get('employeeId');
    let date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const whereClause = {};
    
    // ถ้ามีการระบุ employeeId ให้เพิ่มเงื่อนไขใน where
    if (employeeId) {
      whereClause.employeeId = employeeId;
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
      const startDateObj = parseISO(startDate);
      const endDateObj = parseISO(endDate);
      
      // สร้าง Date object สำหรับ startDate โดยตั้งเวลาเป็น 00:00:00
      const formattedStartDate = new Date(Date.UTC(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate(), 0, 0, 0));
      
      // สร้าง Date object สำหรับ endDate โดยตั้งเวลาเป็น 23:59:59
      const formattedEndDate = new Date(Date.UTC(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate(), 23, 59, 59));
      
      // ตั้งเงื่อนไขการค้นหาตามช่วงวันที่
      whereClause.date = {
        gte: formattedStartDate,
        lte: formattedEndDate,
      };
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
          employees_work_statuses_employee_idToemployees: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true,
              departmentId: true,
              image: true,
            },
          },
          employees_work_statuses_created_by_idToemployees: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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
        employeeId: item.employee_id,
        date: item.date,
        status: item.status,
        note: item.note,
        createdById: item.created_by_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        employee: item.employees_work_statuses_employee_idToemployees ? {
          id: item.employees_work_statuses_employee_idToemployees.id,
          firstName: item.employees_work_statuses_employee_idToemployees.firstName,
          lastName: item.employees_work_statuses_employee_idToemployees.lastName,
          position: item.employees_work_statuses_employee_idToemployees.position,
          departmentId: item.employees_work_statuses_employee_idToemployees.departmentId,
          image: item.employees_work_statuses_employee_idToemployees.image,
        } : null,
        createdBy: item.employees_work_statuses_created_by_idToemployees ? {
          id: item.employees_work_statuses_created_by_idToemployees.id,
          firstName: item.employees_work_statuses_created_by_idToemployees.firstName,
          lastName: item.employees_work_statuses_created_by_idToemployees.lastName,
        } : null,
      }));
    } else {
      // ถ้าใช้โมเดล workStatus
      workStatuses = await model.findMany({
        where: whereClause,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true,
              department: true,
              image: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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

    const { employeeId, date, status, note } = await req.json();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!employeeId || !date || !status) {
      return NextResponse.json({ 
        error: true, 
        message: 'ข้อมูลไม่ครบถ้วน กรุณาระบุ employeeId, date และ status' 
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
    const hasWorkStatusModel = typeof prisma.workStatus !== 'undefined';
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
          employee_id: employeeId,
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
            employees_work_statuses_employee_idToemployees: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                departmentId: true,
                image: true,
              },
            },
            employees_work_statuses_created_by_idToemployees: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });
        
        // แปลงชื่อ field ให้เป็นรูปแบบ camelCase
        result = {
          id: result.id,
          employeeId: result.employee_id,
          date: result.date,
          status: result.status,
          note: result.note,
          createdById: result.created_by_id,
          createdAt: result.created_at,
          updatedAt: result.updated_at,
          employee: result.employees_work_statuses_employee_idToemployees ? {
            id: result.employees_work_statuses_employee_idToemployees.id,
            firstName: result.employees_work_statuses_employee_idToemployees.firstName,
            lastName: result.employees_work_statuses_employee_idToemployees.lastName,
            position: result.employees_work_statuses_employee_idToemployees.position,
            departmentId: result.employees_work_statuses_employee_idToemployees.departmentId,
            image: result.employees_work_statuses_employee_idToemployees.image,
          } : null,
          createdBy: result.employees_work_statuses_created_by_idToemployees ? {
            id: result.employees_work_statuses_created_by_idToemployees.id,
            firstName: result.employees_work_statuses_created_by_idToemployees.firstName,
            lastName: result.employees_work_statuses_created_by_idToemployees.lastName,
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
            employee_id: employeeId,
            date: normalizedDate,
            status,
            note,
            created_by_id: session.user.id,
            updated_at: new Date(), // เพิ่ม updated_at เป็นเวลาปัจจุบัน
          },
          include: {
            employees_work_statuses_employee_idToemployees: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                departmentId: true,
                image: true,
              },
            },
            employees_work_statuses_created_by_idToemployees: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });
        
        // แปลงชื่อ field ให้เป็นรูปแบบ camelCase
        result = {
          id: result.id,
          employeeId: result.employee_id,
          date: result.date,
          status: result.status,
          note: result.note,
          createdById: result.created_by_id,
          createdAt: result.created_at,
          updatedAt: result.updated_at,
          employee: result.employees_work_statuses_employee_idToemployees ? {
            id: result.employees_work_statuses_employee_idToemployees.id,
            firstName: result.employees_work_statuses_employee_idToemployees.firstName,
            lastName: result.employees_work_statuses_employee_idToemployees.lastName,
            position: result.employees_work_statuses_employee_idToemployees.position,
            departmentId: result.employees_work_statuses_employee_idToemployees.departmentId,
            image: result.employees_work_statuses_employee_idToemployees.image,
          } : null,
          createdBy: result.employees_work_statuses_created_by_idToemployees ? {
            id: result.employees_work_statuses_created_by_idToemployees.id,
            firstName: result.employees_work_statuses_created_by_idToemployees.firstName,
            lastName: result.employees_work_statuses_created_by_idToemployees.lastName,
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
      const existingWorkStatus = await prisma.workStatus.findFirst({
        where: {
          employeeId,
          date: normalizedDate
        }
      });
      
      if (existingWorkStatus) {
        // ถ้ามีข้อมูลอยู่แล้ว ให้อัปเดตข้อมูลเดิม
        result = await prisma.workStatus.update({
          where: { id: existingWorkStatus.id },
          data: {
            status,
            note,
            createdById: session.user.id, // อัปเดต createdById เป็นคนล่าสุดที่แก้ไขข้อมูล
            updated_at: new Date(), // เพิ่ม updated_at เป็นเวลาปัจจุบัน
          },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                department: true,
                image: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });
      } else {
        // ถ้าไม่มีข้อมูลอยู่ ให้สร้างข้อมูลใหม่
        result = await prisma.workStatus.create({
          data: {
            id: crypto.randomUUID(),
            employeeId,
            date: normalizedDate,
            status,
            note,
            createdById: session.user.id,
            updated_at: new Date(), // เพิ่ม updated_at เป็นเวลาปัจจุบัน
          },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                department: true,
                image: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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
    const hasWorkStatusModel = typeof prisma.workStatus !== 'undefined';
    const hasWorkStatusesModel = typeof prisma.work_statuses !== 'undefined';

    if (!hasWorkStatusModel && !hasWorkStatusesModel) {
      return NextResponse.json({
        success: false,
        message: 'โมเดลข้อมูลสถานะการทำงานยังไม่พร้อมใช้งาน กรุณาตรวจสอบการติดตั้งฐานข้อมูล',
        data: null
      }, { status: 404 });
    }
    
    // ใช้โมเดลที่มีอยู่ (work_statuses หรือ workStatus)
    const model = hasWorkStatusesModel ? prisma.work_statuses : prisma.workStatus;
    
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
      : session.user.id === workStatus.employeeId;
      
    const isCreator = hasWorkStatusesModel
      ? session.user.id === workStatus.created_by_id
      : session.user.id === workStatus.createdById;

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