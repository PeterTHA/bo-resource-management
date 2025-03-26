import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/email-service';
import { hasPermission } from '@/lib/permissions';

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
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    
    // สร้างเงื่อนไขการค้นหา
    const where = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    
    // ถ้าไม่ใช่ admin จะเห็นเฉพาะพนักงานในทีมเดียวกัน หรือตัวเอง
    if (session.user.role !== 'admin') {
      // ทุกคนที่ไม่ใช่ admin จะไม่เห็นข้อมูลของ admin
      where.role = { not: 'admin' };
      
      // ถ้าเป็น lead หรือ supervisor ให้ดูเฉพาะทีมตัวเอง
      if ((session.user.role === 'lead' || session.user.role === 'supervisor') && hasPermission(session.user, 'employees.view.team')) {
        where.teamId = session.user.teamId;
      } 
      // ถ้าเป็น staff หรือ outsource ที่ไม่มีสิทธิ์ดูทีม ให้ดูแค่ตัวเอง
      else if (!hasPermission(session.user, 'employees.view.team')) {
        where.id = session.user.id;
      }
    }
    // หมายเหตุ: กรณีเป็น admin จะไม่มีเงื่อนไข where พิเศษ ทำให้สามารถดูข้อมูลทั้งหมดได้ (รวมถึงข้อมูลของ admin เอง)

    // ดึงข้อมูลพนักงาน
    const employees = await prisma.employee.findMany({
      where,
      orderBy: { employeeId: 'asc' },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        position: true,
        positionLevel: true,
        positionTitle: true,
        department: true,
        departmentId: true,
        teamData: true,
        teamId: true,
        hireDate: true,
        role: true,
        isActive: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        gender: true,
        birthDate: true,
        phoneNumber: true,
      },
    });

    // ส่งข้อมูลกลับในรูปแบบ { data: [...] } เพื่อให้สอดคล้องกับการใช้งานใน client-side
    return NextResponse.json({
      data: employees,
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
    if (!employeeData.employeeId || !employeeData.firstName || !employeeData.lastName || !employeeData.email || !employeeData.position) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // ตรวจสอบอีเมลซ้ำ
    const existingEmail = await prisma.employee.findUnique({
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
    const existingEmployeeId = await prisma.employee.findUnique({
      where: { employeeId: employeeData.employeeId },
    });

    if (existingEmployeeId) {
      return NextResponse.json(
        {
          error: true,
          message: `รหัสพนักงาน ${employeeData.employeeId} มีอยู่ในระบบแล้ว`,
        },
        { status: 400 }
      );
    }

    // สร้างรหัสผ่านแบบสุ่ม
    const randomPassword = Math.random().toString(36).slice(-8);
    
    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await hash(randomPassword, 10);
    
    // ตรวจสอบว่ามี departmentId หรือไม่ 
    const departmentId = employeeData.departmentId || null;

    // สร้างพนักงานใหม่
    const newEmployee = await prisma.employee.create({
      data: {
        employeeId: employeeData.employeeId,
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        email: employeeData.email,
        password: hashedPassword,
        position: employeeData.position,
        positionLevel: employeeData.positionLevel || null,
        positionTitle: employeeData.positionTitle || null,
        departmentId: departmentId,
        teamId: employeeData.teamId || null,
        role: employeeData.role || 'staff',
        hireDate: employeeData.hireDate ? new Date(employeeData.hireDate) : new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: employeeData.image || null,
        gender: employeeData.gender || 'male',
        birthDate: employeeData.birthDate ? new Date(employeeData.birthDate) : null,
        phoneNumber: employeeData.phoneNumber || null,
      },
      include: {
        department: true,
        teamData: true,
      },
    });

    // ส่งอีเมลแจ้งรหัสผ่านให้พนักงานใหม่
    const emailResult = await sendWelcomeEmail({
      to: newEmployee.email,
      name: `${newEmployee.firstName} ${newEmployee.lastName}`,
      firstName: newEmployee.firstName,
      lastName: newEmployee.lastName,
      employeeId: newEmployee.employeeId,
      position: newEmployee.position,
      department: newEmployee.department?.name,
      team: newEmployee.teamData?.name,
      password: randomPassword,
      role: newEmployee.role,
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