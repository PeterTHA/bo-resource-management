import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import Overtime from '../../../models/Overtime';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

// GET - ดึงข้อมูลการทำงานล่วงเวลาทั้งหมด
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    
    let query = {};
    
    // ถ้าเป็น admin หรือ manager สามารถดูข้อมูลการทำงานล่วงเวลาทั้งหมดได้
    // ถ้าเป็น employee สามารถดูข้อมูลการทำงานล่วงเวลาของตัวเองเท่านั้น
    if (session.user.role === 'employee') {
      query.employee = session.user.id;
    } else if (employeeId) {
      query.employee = employeeId;
    }
    
    const overtimes = await Overtime.find(query).populate('employee', 'firstName lastName employeeId');
    
    return NextResponse.json({ success: true, data: overtimes }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST - เพิ่มข้อมูลการทำงานล่วงเวลา
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const data = await request.json();
    
    // ถ้าเป็น employee ให้ใช้ ID ของตัวเอง
    if (session.user.role === 'employee') {
      data.employee = session.user.id;
    }
    
    const overtime = await Overtime.create(data);
    
    return NextResponse.json(
      { success: true, data: overtime },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 