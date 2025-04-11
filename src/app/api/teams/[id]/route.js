import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ดึงข้อมูลทีมตาม ID
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
    
    const team = await prisma.teams.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            employee_id: true,
            first_name: true,
            last_name: true,
            email: true,
            position: true,
            role: true,
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ 
        error: true,
        message: 'ไม่พบข้อมูลทีม' 
      }, { status: 404 });
    }

    return NextResponse.json({
      data: team,
      message: 'ดึงข้อมูลทีมสำเร็จ'
    });
  } catch (error) {
    console.error(`GET /api/teams/${params?.id} error:`, error);
    return NextResponse.json({ 
      error: true,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลทีม' 
    }, { status: 500 });
  }
}

// อัปเดตข้อมูลทีม
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
        message: 'กรุณาระบุรหัสทีมและชื่อทีม' 
      }, { status: 400 });
    }

    // ตรวจสอบว่ามีทีมที่ต้องการแก้ไขหรือไม่
    const existingTeam = await prisma.teams.findUnique({
      where: { id }
    });

    if (!existingTeam) {
      return NextResponse.json({ 
        error: true,
        message: 'ไม่พบข้อมูลทีม' 
      }, { status: 404 });
    }

    // ตรวจสอบว่ามีรหัสทีมหรือชื่อทีมซ้ำกับรายการอื่นหรือไม่
    const duplicateTeam = await prisma.teams.findFirst({
      where: { 
        OR: [
          { code },
          { name }
        ],
        NOT: { id }
      }
    });

    if (duplicateTeam) {
      return NextResponse.json({ 
        error: true,
        message: 'รหัสทีมหรือชื่อทีมนี้มีอยู่ในระบบแล้ว' 
      }, { status: 409 });
    }

    // อัปเดตข้อมูลทีม
    const updatedTeam = await prisma.teams.update({
      where: { id },
      data: {
        code,
        name,
        description,
      },
    });

    return NextResponse.json({
      data: updatedTeam,
      message: 'อัพเดทข้อมูลทีมสำเร็จ'
    });
  } catch (error) {
    console.error(`PUT /api/teams/${params?.id} error:`, error);
    return NextResponse.json({ 
      error: true,
      message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลทีม' 
    }, { status: 500 });
  }
}

// ลบทีม
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

    // ตรวจสอบว่ามีทีมที่ต้องการลบหรือไม่
    const existingTeam = await prisma.teams.findUnique({
      where: { id },
      include: { employees: true }
    });

    if (!existingTeam) {
      return NextResponse.json({ 
        error: true,
        message: 'ไม่พบข้อมูลทีม' 
      }, { status: 404 });
    }

    // ตรวจสอบว่ามีพนักงานในทีมหรือไม่
    if (existingTeam.employees.length > 0) {
      return NextResponse.json({ 
        error: true,
        message: 'ไม่สามารถลบทีมได้เนื่องจากมีพนักงานในทีมนี้' 
      }, { status: 400 });
    }

    // ลบทีม
    await prisma.teams.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'ลบทีมเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error(`DELETE /api/teams/${params?.id} error:`, error);
    return NextResponse.json({ 
      error: true,
      message: 'เกิดข้อผิดพลาดในการลบทีม' 
    }, { status: 500 });
  }
} 