import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '../../../lib/prisma';
import { sendPasswordResetEmail } from '../../../lib/sendgrid-service';

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

// POST - จัดการคำขอรีเซ็ตรหัสผ่าน
export async function POST(request) {
  try {
    const { email, employeeId } = await request.json();
    
    // ตรวจสอบว่ามีการส่งข้อมูลที่จำเป็นมาครบหรือไม่
    if (!email || !employeeId) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกอีเมลและรหัสพนักงาน' },
        { status: 400 }
      );
    }
    
    // ค้นหาพนักงานโดยใช้อีเมลและรหัสพนักงาน
    const employee = await prisma.employee.findFirst({
      where: {
        email: email,
        employeeId: employeeId
      }
    });
    
    // ไม่พบพนักงานที่ตรงกับข้อมูลที่ให้มา
    if (!employee) {
      // สำหรับความปลอดภัย ไม่ควรบอกว่าพบหรือไม่พบข้อมูล แต่ให้แจ้งว่ากำลังดำเนินการ
      return NextResponse.json(
        { 
          success: true, 
          message: 'หากมีบัญชีที่ตรงกับข้อมูลที่ให้มา ระบบจะส่งอีเมลสำหรับรีเซ็ตรหัสผ่านไปให้' 
        },
        { status: 200 }
      );
    }
    
    // สร้างรหัสผ่านใหม่แบบสุ่ม
    const newPassword = generateRandomPassword();
    console.log(`รหัสผ่านที่รีเซ็ตสำหรับพนักงาน ${employee.email}: ${newPassword}`);
    
    // เข้ารหัสรหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // อัปเดตรหัสผ่านในฐานข้อมูล
    await prisma.employee.update({
      where: { id: employee.id },
      data: { password: hashedPassword }
    });
    
    // ส่งอีเมลรหัสผ่านใหม่ให้พนักงาน
    try {
      await sendPasswordResetEmail({
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        password: newPassword,
        role: employee.role,
        employeeId: employee.employeeId,
        resetBy: 'ระบบรีเซ็ตรหัสผ่านอัตโนมัติ (คำขอจากผู้ใช้)'
      });
      console.log(`ส่งอีเมลรีเซ็ตรหัสผ่านไปยัง ${employee.email} เรียบร้อยแล้ว`);
    } catch (emailError) {
      console.error('เกิดข้อผิดพลาดในการส่งอีเมล:', emailError);
      // ยังคงดำเนินการต่อแม้การส่งอีเมลจะล้มเหลว
    }
    
    // สำหรับความปลอดภัย ไม่ควรบอกว่าพบหรือไม่พบข้อมูล แต่ให้แจ้งว่ากำลังดำเนินการ
    return NextResponse.json(
      { 
        success: true, 
        message: 'หากมีบัญชีที่ตรงกับข้อมูลที่ให้มา ระบบจะส่งอีเมลสำหรับรีเซ็ตรหัสผ่านไปให้' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' },
      { status: 500 }
    );
  }
} 