import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req) {
  try {
    // ตรวจสอบสิทธิ์
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    // ตรวจสอบว่าเป็น admin หรือไม่
    const isAdmin = session.user.roles?.code?.toUpperCase() === 'ADMIN' || 
                   session.user.role?.toUpperCase() === 'ADMIN';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์เข้าถึง API นี้' }, { status: 403 });
    }

    // ดึงข้อมูลพนักงานทั้งหมด
    const employees = await prisma.employees.findMany({
      select: {
        id: true,
        position: true,
        position_id: true,
        position_level: true,
        position_level_id: true,
      }
    });

    // ดึงข้อมูลตำแหน่งทั้งหมด
    const positions = await prisma.positions.findMany();
    
    // ดึงข้อมูลระดับตำแหน่งทั้งหมด
    const positionLevels = await prisma.position_levels.findMany();

    // อัพเดตข้อมูลพนักงาน
    const updatedCount = {
      positions: 0,
      positionLevels: 0,
      totalEmployees: employees.length
    };

    for (const employee of employees) {
      let updated = false;
      const updateData = {};

      // ถ้ามี position แต่ไม่มี position_id ให้หา position_id จาก code
      if (employee.position && !employee.position_id) {
        const foundPosition = positions.find(p => p.code === employee.position);
        if (foundPosition) {
          updateData.position_id = foundPosition.id;
          updatedCount.positions++;
          updated = true;
        }
      }

      // ถ้ามี position_level แต่ไม่มี position_level_id ให้หา position_level_id จาก code
      if (employee.position_level && !employee.position_level_id) {
        const foundPositionLevel = positionLevels.find(p => p.code === employee.position_level);
        if (foundPositionLevel) {
          updateData.position_level_id = foundPositionLevel.id;
          updatedCount.positionLevels++;
          updated = true;
        }
      }

      // ถ้ามีการเปลี่ยนแปลงให้อัพเดตข้อมูล
      if (updated) {
        await prisma.employees.update({
          where: { id: employee.id },
          data: updateData
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'อัพเดตข้อมูลสำเร็จ',
      result: updatedCount
    });
  } catch (error) {
    console.error('Error migrating position data:', error);
    return NextResponse.json(
      {
        success: false,
        error: true,
        message: 'เกิดข้อผิดพลาดในการอัพเดตข้อมูล',
        details: error.message,
      },
      { status: 500 }
    );
  }
} 