import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - ดึงข้อมูลทีมทั้งหมด
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

    const teams = await prisma.team.findMany({
      orderBy: { code: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: teams,
      message: 'ดึงข้อมูลทีมสำเร็จ'
    });
  } catch (error) {
    console.error('GET /api/teams error:', error);
    return NextResponse.json({ 
      error: true, 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลทีม' 
    }, { status: 500 });
  }
}

// สร้างทีมใหม่
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
        message: 'กรุณาระบุรหัสทีมและชื่อทีม' 
      }, { status: 400 });
    }

    // ตรวจสอบว่ามีรหัสทีมซ้ำหรือไม่
    const existingTeam = await prisma.team.findFirst({
      where: { 
        OR: [
          { code },
          { name }
        ]
      }
    });

    if (existingTeam) {
      return NextResponse.json({ 
        error: true, 
        message: 'รหัสทีมหรือชื่อทีมนี้มีอยู่ในระบบแล้ว' 
      }, { status: 409 });
    }

    // สร้างทีมใหม่
    const newTeam = await prisma.team.create({
      data: {
        code,
        name,
        description,
      },
    });

    return NextResponse.json({
      data: newTeam,
      message: 'สร้างทีมใหม่สำเร็จ'
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/teams error:', error);
    return NextResponse.json({ 
      error: true, 
      message: 'เกิดข้อผิดพลาดในการสร้างทีม' 
    }, { status: 500 });
  }
} 