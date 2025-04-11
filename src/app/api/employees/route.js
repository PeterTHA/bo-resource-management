import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/email-service';
import { hasPermission } from '@/lib/permissions';

// ฟังก์ชันสำหรับสร้าง UUID
function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ฟังก์ชันสำหรับสร้างรหัสผ่านแบบสุ่ม
function generateRandomPassword(length = 10) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

// GET - ดึงข้อมูลพนักงานทั้งหมด
export async function GET(req) {
  try {
    // ตรวจสอบสิทธิ์
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    // ตรวจสอบ query parameters
    const url = new URL(req.url);
    const includeInactive = url.searchParams.get('includeInactive') !== 'false';
    const includeAll = url.searchParams.get('includeAll') === 'true';
    
    // สร้างเงื่อนไขการค้นหา
    const where = {};
    
    // ถ้าไม่ใช่ admin จะเห็นเฉพาะพนักงานในทีมเดียวกัน หรือตัวเอง
    // เว้นแต่จะมีการระบุ includeAll=true
    if (!includeAll) {
      // เช็คว่าผู้ใช้เป็น admin หรือไม่
      const isAdmin = session.user.roles?.code?.toUpperCase() === 'ADMIN' || 
                     session.user.role?.toUpperCase() === 'ADMIN' ||
                     hasPermission(session.user, 'employees.view.all');
      
      if (!isAdmin) {
        // ทุกคนที่ไม่ใช่ admin จะไม่เห็นข้อมูลของ admin
        where.roles = {
          code: {
            not: 'ADMIN'
          }
        };
        
        // ถ้าเป็น lead หรือ supervisor ให้ดูเฉพาะทีมตัวเอง
        if (hasPermission(session.user, 'employees.view.teams')) {
          where.team_id = session.user.team_id;
        } 
        // ถ้าเป็น staff หรือ outsource ที่ไม่มีสิทธิ์ดูทีม ให้ดูแค่ตัวเอง
        else if (!hasPermission(session.user, 'employees.view.teams')) {
          where.id = session.user.id;
        }
      }
    }
    // หมายเหตุ: กรณีเป็น admin จะไม่มีเงื่อนไข where พิเศษ ทำให้สามารถดูข้อมูลทั้งหมดได้ (รวมถึงข้อมูลของ admin เอง)

    // ดึงข้อมูลพนักงาน
    const employees = await prisma.employees.findMany({
      where,
      orderBy: { employee_id: 'asc' },
      select: {
        id: true,
        employee_id: true,
        first_name: true,
        last_name: true,
        email: true,
        position_id: true,
        position_level_id: true,
        position_title: true,
        departments: true,
        department_id: true,
        teams: true,
        team_id: true,
        hire_date: true,
        role_id: true,
        roles: true,
        is_active: true,
        image: true,
        created_at: true,
        updated_at: true,
        gender: true,
        birth_date: true,
        phone_number: true,
        positions: true,
        position_levels: true,
      },
    });

    // แปลงข้อมูลให้เข้ากับรูปแบบเดิมที่ client ใช้
    const transformedEmployees = employees.map(employee => ({
      ...employee,
      position: employee.positions?.code || null,
      position_level: employee.position_levels?.code || null,
      role: employee.roles?.code || null,
      roleName: employee.roles?.name || null,
      roleNameTh: employee.roles?.name_th || null,
    }));

    // ส่งข้อมูลกลับในรูปแบบ { data: [...] } เพื่อให้สอดคล้องกับการใช้งานใน client-side
    return NextResponse.json({
      data: transformedEmployees,
      message: 'ดึงข้อมูลพนักงานสำเร็จ',
    });
  } catch (error) {
    console.error('Error in GET /api/employees:', error);
    return NextResponse.json(
      {
        error: true,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน',
        connectionError: error.message.includes('database'),
      },
      { status: 500 }
    );
  }
}

// POST - เพิ่มข้อมูลพนักงาน
export async function POST(req) {
  try {
    // ตรวจสอบสิทธิ์
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    // ตรวจสอบสิทธิ์ในการสร้างพนักงาน
    if (!hasPermission(session.user, 'employees.create')) {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ในการสร้างพนักงาน' }, { status: 403 });
    }

    // ดึงข้อมูลจาก request
    const employeeData = await req.json();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!employeeData.employee_id || !employeeData.first_name || !employeeData.last_name || !employeeData.email) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // ตรวจสอบอีเมลซ้ำ
    const existingEmail = await prisma.employees.findUnique({
      where: { email: employeeData.email },
    });

    if (existingEmail) {
      return NextResponse.json(
        {
          error: true,
          message: `พนักงานที่มีอีเมล ${employeeData.email} มีอยู่ในระบบแล้ว`,
        },
        { status: 400 }
      );
    }
    
    // ตรวจสอบรหัสพนักงานซ้ำ
    const existingEmployeeId = await prisma.employees.findUnique({
      where: { employee_id: employeeData.employee_id },
    });

    if (existingEmployeeId) {
      return NextResponse.json(
        {
          error: true,
          message: `รหัสพนักงาน ${employeeData.employee_id} มีอยู่ในระบบแล้ว`,
        },
        { status: 400 }
      );
    }

    // สร้างรหัสผ่านแบบสุ่ม
    const randomPassword = Math.random().toString(36).slice(-8);
    
    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await hash(randomPassword, 10);
    
    // ตรวจสอบว่ามี departmentId หรือไม่ 
    const departmentId = employeeData.department_id || null;

    // สร้างพนักงานใหม่
    const newEmployee = await prisma.employees.create({
      data: {
        id: generateUuid(),
        employee_id: employeeData.employee_id,
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        email: employeeData.email,
        password: hashedPassword,
        position_id: employeeData.position_id,
        position_level_id: employeeData.position_level_id,
        position_title: employeeData.position_title,
        department_id: departmentId,
        team_id: employeeData.team_id || null,
        role_id: employeeData.role_id || null,
        hire_date: employeeData.hire_date ? new Date(employeeData.hire_date) : new Date(),
        is_active: employeeData.is_active !== undefined ? employeeData.is_active : true,
        image: employeeData.image || null,
        gender: employeeData.gender || 'male',
        birth_date: employeeData.birth_date ? new Date(employeeData.birth_date) : null,
        phone_number: employeeData.phone_number || null,
        updated_at: new Date(),
      },
      include: {
        departments: true,
        teams: true,
        roles: true,
        positions: true,
        position_levels: true,
      },
    });

    // ส่งอีเมลแจ้งรหัสผ่านให้พนักงานใหม่
    const emailResult = await sendWelcomeEmail({
      to: newEmployee.email,
      name: `${newEmployee.first_name} ${newEmployee.last_name}`,
      first_name: newEmployee.first_name,
      last_name: newEmployee.last_name,
      employee_id: newEmployee.employee_id,
      position: newEmployee.position_title,
      departments: newEmployee.departments?.name,
      teams: newEmployee.teams?.name,
      password: randomPassword,
      role: newEmployee.role_id,
    });

    // ส่งข้อมูลกลับในรูปแบบ { data: [...] } เพื่อให้สอดคล้องกับการใช้งานใน client-side
    return NextResponse.json({
      success: true,
      data: {
        ...newEmployee,
        password: undefined,
        emailSent: emailResult.success,
      },
      message: 'สร้างพนักงานสำเร็จ',
    });
  } catch (error) {
    console.error('Error in POST /api/employees:', error);
    return NextResponse.json(
      {
        success: false,
        error: true,
        message: 'เกิดข้อผิดพลาดในการสร้างพนักงาน',
        details: error.message,
      },
      { status: 500 }
    );
  }
} 