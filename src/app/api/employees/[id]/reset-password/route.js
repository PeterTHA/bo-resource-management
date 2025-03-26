import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import bcrypt from 'bcryptjs';
import { getEmployeeById, updateEmployeePassword } from '../../../../../lib/db-prisma';
import { sendPasswordResetEmail } from '../../../../../lib/sendgrid-service';

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

// POST - รีเซ็ตรหัสผ่าน
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // ตรวจสอบว่าผู้ใช้มีสิทธิ์รีเซ็ตรหัสผ่านหรือไม่ (เฉพาะ admin เท่านั้น)
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์รีเซ็ตรหัสผ่านของผู้ใช้' },
        { status: 403 }
      );
    }
    
    // ดึงข้อมูลพนักงานจาก Prisma
    const employeeResult = await getEmployeeById(id);
    
    if (!employeeResult.success) {
      return NextResponse.json(
        { success: false, message: employeeResult.message || 'ไม่พบข้อมูลพนักงาน' },
        { status: 404 }
      );
    }
    
    // สร้างรหัสผ่านใหม่แบบสุ่ม
    const newPassword = generateRandomPassword();
    console.log(`รหัสผ่านที่รีเซ็ตสำหรับพนักงาน ${employeeResult.data.email}: ${newPassword}`);
    
    // เข้ารหัสรหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // อัปเดตรหัสผ่านใน Prisma
    const result = await updateEmployeePassword(id, hashedPassword);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' },
        { status: 500 }
      );
    }
    
    // ส่งอีเมลรหัสผ่านใหม่ให้พนักงาน
    try {
      await sendPasswordResetEmail({
        email: employeeResult.data.email,
        firstName: employeeResult.data.firstName,
        lastName: employeeResult.data.lastName,
        password: newPassword,
        role: employeeResult.data.role,
        employeeId: employeeResult.data.employeeId,
        resetBy: session.user.name || session.user.email
      });
      console.log(`ส่งอีเมลรีเซ็ตรหัสผ่านไปยัง ${employeeResult.data.email} เรียบร้อยแล้ว`);
    } catch (emailError) {
      console.error('เกิดข้อผิดพลาดในการส่งอีเมล:', emailError);
      // ยังคงดำเนินการต่อแม้การส่งอีเมลจะล้มเหลว
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'รีเซ็ตรหัสผ่านสำเร็จและส่งรหัสผ่านใหม่ทางอีเมลแล้ว', 
        password: newPassword,  // ส่งรหัสผ่านกลับไปแสดงให้ admin เห็น
        email: employeeResult.data.email
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 