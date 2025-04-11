import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET: ดึงข้อมูลระดับตำแหน่งทั้งหมด
export async function GET(req) {
  try {
    // ตรวจสอบสิทธิ์
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // เงื่อนไขพื้นฐานคือระดับตำแหน่งที่ยังใช้งานอยู่
    const where = { is_active: true };

    // ดึงข้อมูลระดับตำแหน่ง
    let positionLevels = await prisma.position_levels.findMany({
      where,
      orderBy: { level: 'asc' }
    });
    
    // ถ้าเป็น admin เพิ่มระดับตำแหน่ง Admin ที่มีไว้สำหรับ admin เท่านั้น
    if (session.user.role === 'admin') {
      // ตรวจสอบว่ามีระดับตำแหน่ง Admin อยู่แล้วหรือไม่
      const adminLevelExists = await prisma.position_levels.findUnique({
        where: { code: 'ADMIN' }
      });
      
      // ถ้ายังไม่มี ให้สร้างระดับตำแหน่ง Admin
      if (!adminLevelExists) {
        await prisma.position_levels.create({
          data: {
            id: uuidv4(),
            code: 'ADMIN',
            name: 'Admin',
            level: 8, // ระดับสูงสุด (สูงกว่า Director)
            description: 'ระดับผู้ดูแลระบบ (สำหรับ Admin เท่านั้น)',
            is_active: true,
            updated_at: new Date()
          }
        });
      }
      
      // ดึงข้อมูลระดับตำแหน่งทั้งหมดอีกครั้งเพื่อให้ได้ข้อมูลล่าสุด
      positionLevels = await prisma.position_levels.findMany({
        where,
        orderBy: { level: 'asc' }
      });
    } else {
      // ถ้าไม่ใช่ admin ไม่แสดงระดับ Admin
      positionLevels = positionLevels.filter(level => level.code !== 'ADMIN');
    }
    
    return NextResponse.json({
      success: true,
      data: positionLevels
    });
  } catch (error) {
    console.error('Error fetching position levels:', error);
    
    // ตรวจสอบข้อผิดพลาดเกี่ยวกับตารางไม่มีในฐานข้อมูล
    if (error.message.includes('does not exist in the current database')) {
      return NextResponse.json({
        success: false,
        message: 'ตารางข้อมูลระดับตำแหน่งไม่มีในฐานข้อมูล โปรดตรวจสอบ migration หรือ schema',
        error: error.message,
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลระดับตำแหน่ง',
      error: error.message,
    }, { status: 500 });
  }
} 