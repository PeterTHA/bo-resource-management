import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
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

// POST - จัดการคำขอรีเซ็ตรหัสผ่าน
export async function POST(request) {
  try {
    // รับข้อมูลจาก request
    const data = await request.json();
    const { email, employeeId } = data;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!email || !employeeId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'กรุณาระบุอีเมลและรหัสพนักงาน' 
        },
        { status: 400 }
      );
    }

    // ค้นหาพนักงานจากอีเมลและรหัสพนักงาน
    const employee = await prisma.employee.findFirst({
      where: {
        email: email,
        employeeId: employeeId
      }
    });

    // หากไม่พบพนักงาน ให้ส่งข้อความว่าจะส่งอีเมลหากพบบัญชี (เพื่อความปลอดภัย)
    if (!employee) {
      console.log(`[FORGOT PASSWORD] Account not found for email: ${email} with ID: ${employeeId}`);
      
      return NextResponse.json(
        { 
          success: true, 
          message: 'หากพบบัญชีที่ตรงกับข้อมูลของคุณ เราจะส่งรหัสผ่านใหม่ไปยังอีเมลของคุณ' 
        },
        { status: 200 }
      );
    }

    // สร้างรหัสผ่านใหม่
    const newPassword = generateRandomPassword(12);
    
    // เข้ารหัสรหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // อัปเดตรหัสผ่านในฐานข้อมูล
    await prisma.employee.update({
      where: {
        id: employee.id
      },
      data: {
        password: hashedPassword
      }
    });

    // เก็บรหัสผ่านใหม่ไว้ในส่วนของ debug log (ไม่แสดงกลับไปที่ผู้ใช้)
    console.log(`[FORGOT PASSWORD] New password for employee ${employee.email} (${employee.employeeId}): ${newPassword}`);

    // ส่งอีเมลแจ้งรหัสผ่านใหม่ไปให้พนักงาน
    try {
      const emailResult = await sendPasswordResetEmail({
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        password: newPassword,
        employeeId: employee.employeeId,
        role: employee.role,
        resetBy: 'ระบบลืมรหัสผ่าน'
      });
      
      if (emailResult.success) {
        // ส่งอีเมลสำเร็จ
        console.log(`[FORGOT PASSWORD] Email sent successfully to ${employee.email}`);
        
        // แสดง URL พรีวิวในโหมดทดสอบ
        if (emailResult.preview) {
          console.log(`[FORGOT PASSWORD] Email preview URL: ${emailResult.preview}`);
        }
        
        return NextResponse.json({
          success: true,
          message: 'รหัสผ่านใหม่ได้ถูกส่งไปยังอีเมลของคุณแล้ว'
        });
      } else {
        // ส่งอีเมลไม่สำเร็จ แต่รหัสผ่านถูกรีเซ็ตแล้ว
        console.error(`[FORGOT PASSWORD] Failed to send email to ${employee.email}: ${emailResult.message}`);
        
        // อย่าเปิดเผยความผิดพลาดไปยังผู้ใช้ แต่บันทึกไว้ในระบบ
        return NextResponse.json({
          success: true,
          message: 'หากพบบัญชีที่ตรงกับข้อมูลของคุณ เราจะส่งรหัสผ่านใหม่ไปยังอีเมลของคุณ',
          debug: {
            emailSent: false,
            reason: emailResult.message
          }
        });
      }
    } catch (emailError) {
      // เกิดข้อผิดพลาดในการส่งอีเมล แต่รหัสผ่านถูกรีเซ็ตแล้ว
      console.error(`[FORGOT PASSWORD] Error sending email to ${employee.email}:`, emailError.message);
      
      // อย่าเปิดเผยความผิดพลาดไปยังผู้ใช้ แต่บันทึกไว้ในระบบ
      return NextResponse.json({
        success: true,
        message: 'หากพบบัญชีที่ตรงกับข้อมูลของคุณ เราจะส่งรหัสผ่านใหม่ไปยังอีเมลของคุณ',
        debug: {
          emailSent: false,
          reason: emailError.message
        }
      });
    }
  } catch (error) {
    console.error('[FORGOT PASSWORD ERROR]', error.message);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน กรุณาลองใหม่อีกครั้ง' 
      },
      { status: 500 }
    );
  }
} 