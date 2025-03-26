import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, canAccessResource } from '@/lib/permissions';
import { hash } from 'bcryptjs';

// GET - ดึงข้อมูลพนักงานตาม ID
export async function GET(req, { params }) {
  try {
    // ตรวจสอบสิทธิ์
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ 
        error: true,
        message: 'กรุณาเข้าสู่ระบบ' 
      }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    // ดึงข้อมูลพนักงาน
    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        position: true,
        positionLevel: true,
        positionTitle: true,
        department: true,
        departmentId: true,
        teamData: true,
        teamId: true,
        hireDate: true,
        role: true,
        isActive: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        gender: true,
        birthDate: true,
        phoneNumber: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ 
        error: true,
        message: 'ไม่พบข้อมูลพนักงาน' 
      }, { status: 404 });
    }

    // ถ้าผู้ใช้ไม่ใช่ admin และพยายามเข้าถึงข้อมูลของ admin
    if (session.user.role !== 'admin' && employee.role === 'admin') {
      return NextResponse.json({ 
        error: true,
        message: 'คุณไม่มีสิทธิ์ดูข้อมูลของผู้ดูแลระบบ' 
      }, { status: 403 });
    }

    // ตรวจสอบสิทธิ์ในการดูข้อมูลพนักงาน
    const canView = 
      hasPermission(session.user, 'employees.view.all') || // Admin ดูได้ทั้งหมด
      (hasPermission(session.user, 'employees.view.team') && employee.teamId === session.user.teamId) || // ดูได้ถ้าอยู่ทีมเดียวกัน
      employee.id === session.user.id; // ดูข้อมูลตัวเองได้เสมอ

    if (!canView) {
      return NextResponse.json({ 
        error: true,
        message: 'คุณไม่มีสิทธิ์ดูข้อมูลพนักงานคนนี้' 
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'ดึงข้อมูลพนักงานสำเร็จ'
    });
  } catch (error) {
    console.error(`Error in GET /api/employees/${params?.id}:`, error);
    return NextResponse.json({ 
      error: true,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน',
      details: error.message 
    }, { status: 500 });
  }
}

// PUT - อัปเดตข้อมูลพนักงาน
export async function PUT(req, { params }) {
  try {
    // ตรวจสอบสิทธิ์
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ 
        error: true,
        message: 'กรุณาเข้าสู่ระบบ' 
      }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;
    const data = await req.json();

    // ตรวจสอบว่ามีพนักงานที่ต้องการอัปเดตหรือไม่
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return NextResponse.json({ 
        error: true,
        message: 'ไม่พบข้อมูลพนักงาน' 
      }, { status: 404 });
    }

    // ตรวจสอบสิทธิ์ในการแก้ไขข้อมูลพนักงาน
    const canEdit = 
      hasPermission(session.user, 'employees.edit.all') || // Admin แก้ไขได้ทั้งหมด
      (hasPermission(session.user, 'employees.edit.team') && employee.teamId === session.user.teamId) || // แก้ไขได้ถ้าอยู่ทีมเดียวกัน
      (hasPermission(session.user, 'employees.edit.own') && employee.id === session.user.id); // แก้ไขข้อมูลตัวเองได้

    if (!canEdit) {
      return NextResponse.json({ 
        error: true,
        message: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลพนักงานคนนี้' 
      }, { status: 403 });
    }

    // จำกัดฟิลด์ที่ผู้ใช้แต่ละประเภทสามารถแก้ไขได้
    const dataToUpdate = {};

    // ผู้ใช้ทั่วไปแก้ไขข้อมูลส่วนตัวของตัวเองได้
    if (employee.id === session.user.id) {
      // สามารถแก้ไขได้เฉพาะฟิลด์บางอย่าง
      if (data.firstName !== undefined) dataToUpdate.firstName = data.firstName;
      if (data.lastName !== undefined) dataToUpdate.lastName = data.lastName;
      if (data.email !== undefined) dataToUpdate.email = data.email;
      
      // อัปเดตรูปภาพทุกครั้งที่มีการส่งมา (รวมถึงกรณีเป็น null เพื่อลบรูป)
      if (data.image !== undefined) {
        dataToUpdate.image = data.image;
        console.log('Updating image to:', data.image);
      }
    }

    // หัวหน้าทีมสามารถแก้ไขข้อมูลของพนักงานในทีมได้
    if ((session.user.role === 'lead' || session.user.role === 'admin') && 
        (employee.teamId === session.user.teamId || session.user.role === 'admin')) {
      if (data.position !== undefined) dataToUpdate.position = data.position;
      if (data.positionLevel !== undefined) dataToUpdate.positionLevel = data.positionLevel;
      if (data.positionTitle !== undefined) dataToUpdate.positionTitle = data.positionTitle;
      
      // แต่ไม่สามารถแก้ไขบทบาทได้ (เฉพาะ admin)
      if (session.user.role === 'admin') {
        if (data.role !== undefined) dataToUpdate.role = data.role;
        if (data.isActive !== undefined) dataToUpdate.isActive = data.isActive;
        if (data.departmentId !== undefined) dataToUpdate.departmentId = data.departmentId;
        if (data.teamId !== undefined) dataToUpdate.teamId = data.teamId;
        if (data.employeeId !== undefined) dataToUpdate.employeeId = data.employeeId;
        if (data.hireDate !== undefined) dataToUpdate.hireDate = new Date(data.hireDate);
        if (data.gender !== undefined) dataToUpdate.gender = data.gender;
        if (data.birthDate !== undefined) dataToUpdate.birthDate = data.birthDate ? new Date(data.birthDate) : null;
        if (data.phoneNumber !== undefined) dataToUpdate.phoneNumber = data.phoneNumber;
        
        // Admin สามารถอัปเดตรูปภาพได้
        if (data.image !== undefined) {
          dataToUpdate.image = data.image;
          console.log('Admin updating image to:', data.image);
        }
      }
    }

    // ตรวจสอบอีเมลซ้ำ
    if (dataToUpdate.email && dataToUpdate.email !== employee.email) {
      const existingEmail = await prisma.employee.findFirst({
        where: {
          email: dataToUpdate.email,
          NOT: { id },
        },
      });

      if (existingEmail) {
        return NextResponse.json({ 
          error: true,
          message: 'อีเมลนี้มีอยู่ในระบบแล้ว' 
        }, { status: 409 });
      }
    }

    // ตรวจสอบรหัสพนักงานซ้ำ
    if (dataToUpdate.employeeId && dataToUpdate.employeeId !== employee.employeeId) {
      const existingEmployeeId = await prisma.employee.findFirst({
        where: {
          employeeId: dataToUpdate.employeeId,
          NOT: { id },
        },
      });

      if (existingEmployeeId) {
        return NextResponse.json({ 
          error: true,
          message: 'รหัสพนักงานนี้มีอยู่ในระบบแล้ว' 
        }, { status: 409 });
      }
    }

    // อัปเดตข้อมูลพนักงาน
    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ 
        message: 'ไม่มีข้อมูลที่จะอัปเดต' 
      });
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        position: true,
        department: true,
        departmentId: true,
        teamData: true,
        teamId: true,
        hireDate: true,
        role: true,
        isActive: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      message: 'อัปเดตข้อมูลพนักงานสำเร็จ'
    });
  } catch (error) {
    console.error(`Error in PUT /api/employees/${params?.id}:`, error);
    return NextResponse.json({ 
      error: true,
      message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลพนักงาน',
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE - ลบข้อมูลพนักงาน
export async function DELETE(req, { params }) {
  try {
    // ตรวจสอบสิทธิ์
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ 
        error: true,
        message: 'กรุณาเข้าสู่ระบบ' 
      }, { status: 401 });
    }

    // เฉพาะ admin ที่สามารถลบพนักงานได้
    if (!hasPermission(session.user, 'employees.delete')) {
      return NextResponse.json({ 
        error: true,
        message: 'คุณไม่มีสิทธิ์ลบพนักงาน' 
      }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    // ตรวจสอบว่ามีพนักงานที่ต้องการลบหรือไม่
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return NextResponse.json({ 
        error: true,
        message: 'ไม่พบข้อมูลพนักงาน' 
      }, { status: 404 });
    }

    // ตรวจสอบว่ามีข้อมูลการลาหรือการทำงานล่วงเวลาที่เกี่ยวข้องหรือไม่
    const relatedRecords = await prisma.$transaction([
      prisma.leave.count({ where: { OR: [{ employeeId: id }, { approvedById: id }] } }),
      prisma.overtime.count({ where: { OR: [{ employeeId: id }, { approvedById: id }] } }),
    ]);

    const hasRelatedRecords = relatedRecords[0] > 0 || relatedRecords[1] > 0;

    if (hasRelatedRecords) {
      // ถ้ามีข้อมูลที่เกี่ยวข้อง ให้ทำ soft delete โดยการอัปเดตสถานะเป็นไม่ใช้งาน
      await prisma.employee.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: 'อัปเดตสถานะพนักงานเป็นไม่ใช้งานเรียบร้อยแล้ว'
      });
    }

    // ถ้าไม่มีข้อมูลที่เกี่ยวข้อง ให้ลบพนักงานออกจากระบบ
    await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'ลบพนักงานเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error(`Error in DELETE /api/employees/${params?.id}:`, error);
    return NextResponse.json({ 
      error: true,
      message: 'เกิดข้อผิดพลาดในการลบพนักงาน',
      details: error.message
    }, { status: 500 });
  }
} 