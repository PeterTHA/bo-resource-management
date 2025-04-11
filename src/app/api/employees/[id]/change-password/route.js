import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getEmployeeById, updateEmployeePassword } from '../../../../../lib/db-prisma';
import { decryptData } from '@/app/employees/utils/encryptionUtils';

// ฟังก์ชันตรวจสอบสิทธิ์ admin
function isAdminUser(user) {
  // ตรวจสอบหลายรูปแบบ
  return user.role?.toLowerCase() === 'admin' || 
         user.roles?.code?.toLowerCase() === 'admin' ||
         user.isAdmin === true || 
         user.permissions?.includes('admin') ||
         user.role?.toUpperCase() === 'ADMIN';
}

// PUT - เปลี่ยนรหัสผ่าน
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    console.log('Session user in change-password API:', session.user);
    console.log('User role:', session.user.role);
    console.log('Is admin check:', isAdminUser(session.user));
    
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // ตรวจสอบว่าผู้ใช้มีสิทธิ์เปลี่ยนรหัสผ่านหรือไม่
    if (!isAdminUser(session.user) && session.user.id !== id) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เปลี่ยนรหัสผ่านของผู้ใช้อื่น' },
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
    
    const requestData = await request.json();
    let { currentPassword, newPassword, isEncrypted } = requestData;
    
    // ถอดรหัสข้อมูลหากมีการส่งข้อมูลแบบเข้ารหัส
    if (isEncrypted) {
      try {
        if (currentPassword) {
          currentPassword = await decryptData(currentPassword);
        }
        newPassword = await decryptData(newPassword);
      } catch (decryptError) {
        console.error('Error decrypting password data:', decryptError);
        return NextResponse.json(
          { success: false, message: 'เกิดข้อผิดพลาดในการประมวลผลข้อมูลรหัสผ่าน' },
          { status: 400 }
        );
      }
    }
    
    // ตรวจสอบว่ามีการส่งรหัสผ่านมาหรือไม่
    if (!newPassword) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุรหัสผ่านใหม่' },
        { status: 400 }
      );
    }
    
    // ถ้าไม่ใช่แอดมิน ต้องตรวจสอบรหัสผ่านปัจจุบัน
    if (!isAdminUser(session.user)) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, message: 'กรุณาระบุรหัสผ่านปัจจุบัน' },
          { status: 400 }
        );
      }
      
      // ตรวจสอบรหัสผ่านปัจจุบัน
      const isMatch = await bcrypt.compare(currentPassword, employeeResult.data.password);
      
      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' },
          { status: 400 }
        );
      }
    }
    
    // เข้ารหัสรหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // อัปเดตรหัสผ่านใน Prisma
    const result = await updateEmployeePassword(id, hashedPassword);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 