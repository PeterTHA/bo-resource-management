import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email-service';

// ฟังก์ชันสำหรับสร้างรหัสผ่านแบบสุ่ม
function generateRandomPassword(length = 10) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

// ฟังก์ชันสำหรับจัดการการรีเซ็ตรหัสผ่าน ซึ่งรองรับทั้ง PUT และ POST
async function handleResetPassword(request, { params }) {
  try {
    // ตรวจสอบสิทธิ์ผู้ใช้
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' },
        { status: 401 }
      );
    }
    
    // ตรวจสอบว่าผู้ใช้มีสิทธิ์ในการรีเซ็ตรหัสผ่าน
    const hasAdminAccess = await prisma.employees.findFirst({
      where: {
        id: session.user.id,
        roles: {
          code: 'ADMIN'
        }
      }
    });
    
    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์ในการรีเซ็ตรหัสผ่าน' },
        { status: 403 }
      );
    }
    
    // ดึงข้อมูลพนักงานจาก ID
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ไม่พบรหัสพนักงาน' },
        { status: 400 }
      );
    }
    
    console.log(`กำลังรีเซ็ตรหัสผ่านสำหรับพนักงาน ID: ${id}`);
    
    // ค้นหาพนักงานในฐานข้อมูล
    const employee = await prisma.employees.findUnique({
      where: {
        id: id,
      },
      include: {
        roles: true
      }
    });
    
    if (!employee) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลพนักงาน' },
        { status: 404 }
      );
    }
    
    // สร้างรหัสผ่านใหม่
    const newPassword = generateRandomPassword(12);
    
    // เข้ารหัสรหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // อัปเดตรหัสผ่านใหม่ในฐานข้อมูล
    await prisma.employees.update({
      where: {
        id: id,
      },
      data: {
        password: hashedPassword,
      },
    });
    
    // เก็บรหัสผ่านใหม่ไว้ในส่วนของ debug log (ไม่แสดงกลับไปที่ผู้ใช้)
    console.log(`[PASSWORD RESET] New password for employee ${employee.email} (${employee.employee_id}): ${newPassword}`);
    
    // ส่งอีเมลแจ้งรหัสผ่านใหม่ไปให้พนักงาน
    try {
      const emailResult = await sendPasswordResetEmail({
        email: employee.email,
        first_name: employee.first_name,
        last_name: employee.last_name,
        password: newPassword,
        employee_id: employee.employee_id,
        role: employee.roles?.code || '',
        resetBy: `${session.user.first_name} ${session.user.last_name} (${session.user.email})`
      });
      
      if (emailResult.success) {
        // ส่งอีเมลสำเร็จ
        console.log(`[PASSWORD RESET] Email sent successfully to ${employee.email}`);
        
        // แสดง URL พรีวิวในโหมดทดสอบ
        if (emailResult.preview) {
          console.log(`[PASSWORD RESET] Email preview URL: ${emailResult.preview}`);
        }
        
        return NextResponse.json({
          success: true,
          message: 'รีเซ็ตรหัสผ่านเรียบร้อยแล้ว และส่งอีเมลไปยังพนักงานแล้ว',
          emailSent: true
        });
      } else {
        // ส่งอีเมลไม่สำเร็จ แต่รหัสผ่านถูกรีเซ็ตแล้ว
        console.error(`[PASSWORD RESET] Failed to send email to ${employee.email}: ${emailResult.message}`);
        
        return NextResponse.json({
          success: true,
          message: 'รีเซ็ตรหัสผ่านเรียบร้อยแล้ว แต่ไม่สามารถส่งอีเมลได้',
          emailSent: false,
          emailError: emailResult.message
        });
      }
    } catch (emailError) {
      // เกิดข้อผิดพลาดในการส่งอีเมล แต่รหัสผ่านถูกรีเซ็ตแล้ว
      console.error(`[PASSWORD RESET] Error sending email to ${employee.email}:`, emailError.message);
      
      return NextResponse.json({
        success: true,
        message: 'รีเซ็ตรหัสผ่านเรียบร้อยแล้ว แต่เกิดข้อผิดพลาดในการส่งอีเมล',
        emailSent: false,
        emailError: emailError.message
      });
    }
  } catch (error) {
    console.error('[PASSWORD RESET ERROR]', error.message);
    
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน', details: error.message },
      { status: 500 }
    );
  }
}

// รองรับทั้ง PUT และ POST method
export async function PUT(request, { params }) {
  return handleResetPassword(request, { params });
}

export async function POST(request, { params }) {
  return handleResetPassword(request, { params });
} 