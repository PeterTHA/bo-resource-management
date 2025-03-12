import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import Overtime from '../../../../models/Overtime';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

// GET - ดึงข้อมูลการทำงานล่วงเวลาตาม ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const overtime = await Overtime.findById(params.id).populate('employee', 'firstName lastName employeeId');
    
    if (!overtime) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (session.user.role === 'employee' && overtime.employee._id.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูล' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ success: true, data: overtime }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT - อัปเดตข้อมูลการทำงานล่วงเวลา
export async function PUT(request, { params }) {
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
    
    // ตรวจสอบว่ามีข้อมูลการทำงานล่วงเวลาหรือไม่
    const overtime = await Overtime.findById(params.id);
    
    if (!overtime) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (session.user.role === 'employee') {
      // พนักงานสามารถแก้ไขข้อมูลการทำงานล่วงเวลาของตัวเองได้เท่านั้น และต้องเป็นสถานะ 'รออนุมัติ' เท่านั้น
      if (overtime.employee.toString() !== session.user.id || overtime.status !== 'รออนุมัติ') {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูล' },
          { status: 403 }
        );
      }
      
      // พนักงานไม่สามารถเปลี่ยนสถานะการอนุมัติได้
      if (data.status && data.status !== 'รออนุมัติ') {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์เปลี่ยนสถานะการอนุมัติ' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'manager' || session.user.role === 'admin') {
      // ผู้จัดการหรือแอดมินสามารถอนุมัติหรือไม่อนุมัติการทำงานล่วงเวลาได้
      if (data.status && data.status !== 'รออนุมัติ') {
        data.approvedBy = session.user.id;
        data.approvedAt = new Date();
      }
    }
    
    const updatedOvertime = await Overtime.findByIdAndUpdate(
      params.id,
      data,
      { new: true, runValidators: true }
    ).populate('employee', 'firstName lastName employeeId');
    
    return NextResponse.json({ success: true, data: updatedOvertime }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE - ลบข้อมูลการทำงานล่วงเวลา
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // ตรวจสอบว่ามีข้อมูลการทำงานล่วงเวลาหรือไม่
    const overtime = await Overtime.findById(params.id);
    
    if (!overtime) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (session.user.role === 'employee') {
      // พนักงานสามารถลบข้อมูลการทำงานล่วงเวลาของตัวเองได้เท่านั้น และต้องเป็นสถานะ 'รออนุมัติ' เท่านั้น
      if (overtime.employee.toString() !== session.user.id || overtime.status !== 'รออนุมัติ') {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูล' },
          { status: 403 }
        );
      }
    } else if (session.user.role !== 'admin') {
      // เฉพาะแอดมินเท่านั้นที่สามารถลบข้อมูลการทำงานล่วงเวลาที่ได้รับการอนุมัติแล้วได้
      if (overtime.status !== 'รออนุมัติ') {
        return NextResponse.json(
          { success: false, message: 'ไม่มีสิทธิ์ลบข้อมูลการทำงานล่วงเวลาที่ได้รับการอนุมัติแล้ว' },
          { status: 403 }
        );
      }
    }
    
    await Overtime.findByIdAndDelete(params.id);
    
    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
} 