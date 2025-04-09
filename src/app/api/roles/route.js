import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db-prisma';

/**
 * GET /api/roles - ดึงข้อมูลบทบาททั้งหมด
 */
export async function GET(request) {
  try {
    // ตรวจสอบการเข้าสู่ระบบ
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' },
        { status: 401 }
      );
    }

    // ดึงข้อมูลจากฐานข้อมูล
    const roles = await prisma.roles.findMany({
      orderBy: { code: 'asc' },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบทบาท', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/roles - เพิ่มบทบาทใหม่
 */
export async function POST(request) {
  try {
    // ตรวจสอบการเข้าสู่ระบบ
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'คุณไม่มีสิทธิ์ในการเพิ่มบทบาท' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!data.code || !data.name || !data.name_th) {
      return NextResponse.json(
        { message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // เพิ่มข้อมูลลงฐานข้อมูล
    const newRole = await prisma.roles.create({
      data: {
        id: data.id || crypto.randomUUID(),
        code: data.code,
        name: data.name,
        name_th: data.name_th,
        description: data.description,
        permissions: data.permissions || [],
        is_active: data.is_active !== undefined ? data.is_active : true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    
    // ตรวจสอบ error unique constraint
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: `บทบาท ${error.meta.target} นี้มีอยู่ในระบบแล้ว` },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการเพิ่มบทบาท', error: error.message },
      { status: 500 }
    );
  }
} 