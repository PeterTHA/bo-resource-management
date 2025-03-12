import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getEmployeeById, updateEmployee, deleteEmployee } from '../../../../lib/db-prisma';

// GET - ดึงข้อมูลพนักงานตาม ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    const id = params?.id;
    
    // ดึงข้อมูลพนักงานจาก Prisma
    const result = await getEmployeeById(id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (session.user.role === 'employee' && session.user.id !== id) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูล' },
        { status: 403 }
      );
    }
    
    // ไม่ส่งรหัสผ่านกลับไป
    const { password, ...employeeWithoutPassword } = result.data;
    
    return NextResponse.json({ success: true, data: employeeWithoutPassword }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/employees/[id]:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PUT - อัปเดตข้อมูลพนักงาน
export async function PUT(request, { params }) {
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
        { success: false, message: 'ไม่มีสิทธิ์แก้ไขข้อมูลพนักงาน' },
        { status: 403 }
      );
    }
    
    const id = params.id;
    const data = await request.json();
    
    // ถ้าไม่ใช่แอดมิน ไม่สามารถเปลี่ยนบทบาทได้
    if (session.user.role !== 'admin' && data.role) {
      delete data.role;
    }
    
    // อัปเดตข้อมูลพนักงานใน Prisma
    const result = await updateEmployee(id, data);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลพนักงาน' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: result.data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PUT /api/employees/[id]:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - ลบข้อมูลพนักงาน
export async function DELETE(request, { params }) {
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
        { success: false, message: 'ไม่มีสิทธิ์ลบข้อมูลพนักงาน' },
        { status: 403 }
      );
    }
    
    const id = params.id;
    
    // ลบข้อมูลพนักงานใน Prisma
    const result = await deleteEmployee(id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการลบข้อมูลพนักงาน' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: 'ลบข้อมูลพนักงานสำเร็จ' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/employees/[id]:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 