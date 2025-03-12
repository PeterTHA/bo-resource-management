import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { getEmployees, createEmployee } from '../../../lib/db-postgres';

// GET - ดึงข้อมูลพนักงานทั้งหมด
export async function GET() {
  try {
    // ดึงข้อมูลพนักงานจาก Postgres
    const result = await getEmployees();
    
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        message: result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน',
        connectionError: true
      }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/employees:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน',
      error: error.message,
      connectionError: true
    }, { status: 500 });
  }
}

// POST - เพิ่มข้อมูลพนักงาน
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูล' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // เพิ่มข้อมูลพนักงานใน Postgres
    const result = await createEmployee(data);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || result.error || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลพนักงาน' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: result.data },
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