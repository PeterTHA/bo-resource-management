import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import Employee from '../../../models/Employee';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

// GET - ดึงข้อมูลพนักงานทั้งหมด
export async function GET() {
  try {
    await connectDB();
    
    const employees = await Employee.find({}).select('-password');
    
    return NextResponse.json({ success: true, data: employees }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
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
    
    await connectDB();
    
    const data = await request.json();
    
    // ตรวจสอบว่ามีอีเมลหรือรหัสพนักงานซ้ำหรือไม่
    const existingEmployee = await Employee.findOne({
      $or: [{ email: data.email }, { employeeId: data.employeeId }]
    });
    
    if (existingEmployee) {
      return NextResponse.json(
        { success: false, message: 'อีเมลหรือรหัสพนักงานนี้มีอยู่ในระบบแล้ว' },
        { status: 400 }
      );
    }
    
    const employee = await Employee.create(data);
    
    return NextResponse.json(
      { success: true, data: employee },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 