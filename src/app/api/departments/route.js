import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ดึงข้อมูลแผนกทั้งหมด
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // ตรวจสอบว่ามีสิทธิ์ในการดูข้อมูลหรือไม่
    if (!session) {
      return NextResponse.json({ 
        error: true, 
        message: 'ไม่ได้รับอนุญาต' 
      }, { status: 401 });
    }

    const departments = await prisma.departments.findMany({
      orderBy: { code: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: departments,
      message: 'ดึงข้อมูลแผนกสำเร็จ'
    });
  } catch (error) {
    console.error('GET /api/departments error:', error);
    return NextResponse.json({ 
      error: true,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแผนก' 
    }, { status: 500 });
  }
}

// สร้างแผนกใหม่
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    // ตรวจสอบว่ามีสิทธิ์ admin หรือไม่
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ 
        error: true, 
        message: 'ไม่ได้รับอนุญาต - เฉพาะ admin เท่านั้น' 
      }, { status: 403 });
    }

    const { code, name, description } = await req.json();

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!code || !name) {
      return NextResponse.json({ 
        error: true, 
        message: 'กรุณาระบุรหัสแผนกและชื่อแผนก' 
      }, { status: 400 });
    }

    // ตรวจสอบว่ามีรหัสแผนกซ้ำหรือไม่
    const existingDepartment = await prisma.departments.findFirst({
      where: { 
        OR: [
          { code },
          { name }
        ]
      }
    });

    if (existingDepartment) {
      return NextResponse.json({ 
        error: true, 
        message: 'รหัสแผนกหรือชื่อแผนกนี้มีอยู่ในระบบแล้ว' 
      }, { status: 409 });
    }

    // สร้างแผนกใหม่
    const newDepartment = await prisma.departments.create({
      data: {
        code,
        name,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      data: newDepartment,
      message: 'สร้างแผนกใหม่สำเร็จ'
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/departments error:', error);
    return NextResponse.json({ 
      error: true, 
      message: 'เกิดข้อผิดพลาดในการสร้างแผนก' 
    }, { status: 500 });
  }
} 