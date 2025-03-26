import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ดึงข้อมูลแผนกตาม ID
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    // ตรวจสอบว่ามีสิทธิ์ในการดูข้อมูลหรือไม่
    if (!session) {
      return NextResponse.json({ 
        error: true,
        message: 'ไม่ได้รับอนุญาต' 
      }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            role: true,
          }
        }
      }
    });

    if (!department) {
      return NextResponse.json({
        error: true,
        message: 'ไม่พบข้อมูลแผนก'
      }, { status: 404 });
    }

    return NextResponse.json({
      data: department,
      message: 'ดึงข้อมูลแผนกสำเร็จ'
    });
  } catch (error) {
    console.error(`GET /api/departments/${params?.id} error:`, error);
    return NextResponse.json({
      error: true,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแผนก'
    }, { status: 500 });
  }
}

// อัปเดตข้อมูลแผนก
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    // ตรวจสอบว่ามีสิทธิ์ admin หรือไม่
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({
        error: true,
        message: 'ไม่ได้รับอนุญาต - เฉพาะ admin เท่านั้น'
      }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;
    const { code, name, description } = await req.json();

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!code || !name) {
      return NextResponse.json({
        error: true,
        message: 'กรุณาระบุรหัสแผนกและชื่อแผนก'
      }, { status: 400 });
    }

    // ตรวจสอบว่ามีแผนกที่ต้องการแก้ไขหรือไม่
    const existingDepartment = await prisma.department.findUnique({
      where: { id }
    });

    if (!existingDepartment) {
      return NextResponse.json({
        error: true,
        message: 'ไม่พบข้อมูลแผนก'
      }, { status: 404 });
    }

    // ตรวจสอบว่ามีรหัสแผนกหรือชื่อแผนกซ้ำกับรายการอื่นหรือไม่
    const duplicateDepartment = await prisma.department.findFirst({
      where: { 
        OR: [
          { code },
          { name }
        ],
        NOT: { id }
      }
    });

    if (duplicateDepartment) {
      return NextResponse.json({
        error: true,
        message: 'รหัสแผนกหรือชื่อแผนกนี้มีอยู่ในระบบแล้ว'
      }, { status: 409 });
    }

    // อัปเดตข้อมูลแผนก
    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: {
        code,
        name,
        description,
      },
    });

    return NextResponse.json({
      data: updatedDepartment,
      message: 'อัพเดทข้อมูลแผนกสำเร็จ'
    });
  } catch (error) {
    console.error(`PUT /api/departments/${params?.id} error:`, error);
    return NextResponse.json({
      error: true,
      message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลแผนก'
    }, { status: 500 });
  }
}

// ลบแผนก
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    // ตรวจสอบว่ามีสิทธิ์ admin หรือไม่
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({
        error: true,
        message: 'ไม่ได้รับอนุญาต - เฉพาะ admin เท่านั้น'
      }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    // ตรวจสอบว่ามีแผนกที่ต้องการลบหรือไม่
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
      include: { employees: true }
    });

    if (!existingDepartment) {
      return NextResponse.json({
        error: true,
        message: 'ไม่พบข้อมูลแผนก'
      }, { status: 404 });
    }

    // ตรวจสอบว่ามีพนักงานในแผนกหรือไม่
    if (existingDepartment.employees.length > 0) {
      return NextResponse.json({
        error: true,
        message: 'ไม่สามารถลบแผนกได้เนื่องจากมีพนักงานในแผนกนี้'
      }, { status: 400 });
    }

    // ลบแผนก
    await prisma.department.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'ลบแผนกเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error(`DELETE /api/departments/${params?.id} error:`, error);
    return NextResponse.json({
      error: true,
      message: 'เกิดข้อผิดพลาดในการลบแผนก'
    }, { status: 500 });
  }
} 