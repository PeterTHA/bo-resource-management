import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { getEmployeeById, updateEmployee, deleteEmployee } from '../../../../lib/db-postgres';

// GET - ดึงข้อมูลพนักงานตาม ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }
    
    // ดึงค่า id จาก params
    const id = params.id;
    
    // ดึงข้อมูลพนักงานจาก Postgres
    const result = await getEmployeeById(id);
    
    if (!result.success) {
      return NextResponse.json(
        { message: result.message || 'ไม่พบข้อมูลพนักงาน' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน', error: error.message },
      { status: 500 }
    );
  }
}

// PUT - อัปเดตข้อมูลพนักงาน
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (!session || (session.user.role !== 'admin' && session.user.id !== params.id)) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูล' },
        { status: 403 }
      );
    }
    
    const id = params.id;
    const data = await request.json();
    
    // อัปเดตข้อมูลพนักงานใน Postgres
    const result = await updateEmployee(id, data);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'ไม่พบข้อมูลพนักงาน' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    console.error('Error updating employee:', error);
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
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูล' },
        { status: 403 }
      );
    }
    
    const id = params.id;
    
    // ลบข้อมูลพนักงานใน Postgres
    const result = await deleteEmployee(id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'ไม่พบข้อมูลพนักงาน' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 