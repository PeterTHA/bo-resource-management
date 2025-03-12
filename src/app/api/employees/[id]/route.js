import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import Employee from '../../../../models/Employee';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

// GET - ดึงข้อมูลพนักงานตาม ID
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const employee = await Employee.findById(params.id).select('-password');
    
    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลพนักงาน' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: employee }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
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
    
    await connectDB();
    
    const data = await request.json();
    
    // ตรวจสอบว่ามีอีเมลซ้ำหรือไม่
    if (data.email) {
      const existingEmployee = await Employee.findOne({
        email: data.email,
        _id: { $ne: params.id }
      });
      
      if (existingEmployee) {
        return NextResponse.json(
          { success: false, message: 'อีเมลนี้มีอยู่ในระบบแล้ว' },
          { status: 400 }
        );
      }
    }
    
    // ตรวจสอบว่ามีรหัสพนักงานซ้ำหรือไม่
    if (data.employeeId) {
      const existingEmployee = await Employee.findOne({
        employeeId: data.employeeId,
        _id: { $ne: params.id }
      });
      
      if (existingEmployee) {
        return NextResponse.json(
          { success: false, message: 'รหัสพนักงานนี้มีอยู่ในระบบแล้ว' },
          { status: 400 }
        );
      }
    }
    
    const employee = await Employee.findByIdAndUpdate(
      params.id,
      data,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลพนักงาน' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: employee }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
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
    
    await connectDB();
    
    const employee = await Employee.findByIdAndDelete(params.id);
    
    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลพนักงาน' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
} 