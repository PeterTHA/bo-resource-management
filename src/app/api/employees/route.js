import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { getEmployees, createEmployee } from '../../../lib/db-prisma';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '../../../lib/sendgrid-service';

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
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูล' },
        { status: 403 }
      );
    }
    
    // ดึงข้อมูลพนักงานจาก Prisma
    const result = await getEmployees();
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน', connectionError: result.connectionError },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/employees:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST - เพิ่มข้อมูลพนักงาน
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เพิ่มข้อมูลพนักงาน' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!data.employeeId || !data.firstName || !data.lastName || !data.email || !data.position || !data.department || !data.hireDate || !data.role) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (รหัสพนักงาน, ชื่อ, นามสกุล, อีเมล, ตำแหน่ง, แผนก, วันที่เริ่มงาน, บทบาท)' },
        { status: 400 }
      );
    }
    
    // สร้างรหัสผ่านแบบสุ่ม
    const randomPassword = generateRandomPassword();
    console.log(`รหัสผ่านที่สร้างสำหรับพนักงาน ${data.email}: ${randomPassword}`);
    
    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    data.password = hashedPassword;
    
    // เพิ่มข้อมูลพนักงานใน Prisma
    const result = await createEmployee(data);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลพนักงาน' },
        { status: 400 }
      );
    }
    
    // ส่งอีเมลต้อนรับพร้อมรหัสผ่าน
    try {
      await sendWelcomeEmail({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: randomPassword,
        role: data.role,
        employeeId: data.employeeId
      });
      console.log(`ส่งอีเมลต้อนรับไปยัง ${data.email} เรียบร้อยแล้ว`);
    } catch (emailError) {
      console.error('เกิดข้อผิดพลาดในการส่งอีเมล:', emailError);
      // ยังคงดำเนินการต่อแม้การส่งอีเมลจะล้มเหลว
    }
    
    return NextResponse.json(
      { 
        success: true, 
        data: result.data,
        message: `สร้างบัญชีพนักงานสำเร็จแล้วและได้ส่งอีเมลพร้อมรหัสผ่านไปที่ ${data.email}`
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/employees:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 