import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import bcrypt from 'bcryptjs';
import { getEmployeeById, updateEmployeePassword } from '../../../../../lib/db-prisma';

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
    
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // ตรวจสอบว่าผู้ใช้มีสิทธิ์เปลี่ยนรหัสผ่านหรือไม่
    if (session.user.role !== 'admin' && session.user.id !== id) {
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
    
    const { currentPassword, newPassword } = await request.json();
    
    // ตรวจสอบว่ามีการส่งรหัสผ่านมาหรือไม่
    if (!newPassword) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุรหัสผ่านใหม่' },
        { status: 400 }
      );
    }
    
    // ถ้าไม่ใช่แอดมิน ต้องตรวจสอบรหัสผ่านปัจจุบัน
    if (session.user.role !== 'admin') {
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