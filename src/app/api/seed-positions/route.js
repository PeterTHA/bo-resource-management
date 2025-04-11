import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req) {
  try {
    // ตรวจสอบสิทธิ์ (เฉพาะ admin เท่านั้น)
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์ในการเข้าถึง API นี้' },
        { status: 401 }
      );
    }

    // ข้อมูลตำแหน่ง
    const positions = [
      { code: 'PM', name: 'Project Manager', category: 'management', description: 'ผู้จัดการโครงการ' },
      { code: 'BU', name: 'Business Analyst', category: 'management', description: 'นักวิเคราะห์ธุรกิจ' },
      { code: 'QA', name: 'Quality Assurance', category: 'testing', description: 'ผู้ทดสอบคุณภาพซอฟต์แวร์' },
      { code: 'SA', name: 'System Analyst', category: 'development', description: 'นักวิเคราะห์ระบบ' },
      { code: 'DEVOPS', name: 'DevOps Engineer', category: 'devops', description: 'วิศวกร DevOps' },
      { code: 'FE', name: 'Frontend Developer', category: 'development', description: 'นักพัฒนาฝั่งลูกข่าย' },
      { code: 'BE', name: 'Backend Developer', category: 'development', description: 'นักพัฒนาฝั่งแม่ข่าย' },
      { code: 'FS', name: 'Fullstack Developer', category: 'development', description: 'นักพัฒนาทั้งฝั่งลูกข่ายและแม่ข่าย' },
      { code: 'MOB', name: 'Mobile Developer', category: 'development', description: 'นักพัฒนาแอปพลิเคชันมือถือ' },
      { code: 'PS', name: 'Production Support', category: 'support', description: 'ผู้ดูแลระบบการผลิต' },
      { code: 'UX', name: 'UX/UI Designer', category: 'design', description: 'นักออกแบบประสบการณ์และส่วนติดต่อผู้ใช้' },
      { code: 'TL', name: 'Technical Lead', category: 'management', description: 'หัวหน้าทีมเทคนิค' },
    ];

    // ข้อมูลระดับตำแหน่ง
    const positionLevels = [
      { code: 'INTERN', name: 'Intern', level: 1, description: 'นักศึกษาฝึกงาน' },
      { code: 'JR', name: 'Junior', level: 2, description: 'ระดับเริ่มต้น' },
      { code: 'MID', name: 'Mid', level: 3, description: 'ระดับกลาง' }, 
      { code: 'SR', name: 'Senior', level: 4, description: 'ระดับอาวุโส' },
      { code: 'LEAD', name: 'Lead', level: 5, description: 'ระดับหัวหน้า' },
      { code: 'PRINCIPAL', name: 'Principal', level: 6, description: 'ระดับหลัก' },
      { code: 'DIRECTOR', name: 'Director', level: 7, description: 'ระดับผู้อำนวยการ' },
    ];

    console.log('กำลังเพิ่มข้อมูลตำแหน่ง...');
    
    // ตรวจสอบว่ามีโมเดล Position และ PositionLevel ใน schema หรือไม่
    try {
      // เพิ่มข้อมูลตำแหน่ง
      for (const position of positions) {
        await prisma.positions.upsert({
          where: { code: position.code },
          update: position,
          create: position,
        });
      }

      // เพิ่มข้อมูลระดับตำแหน่ง
      for (const level of positionLevels) {
        await prisma.position_levels.upsert({
          where: { code: level.code },
          update: level,
          create: level,
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'เพิ่มข้อมูลตำแหน่งและระดับตำแหน่งเรียบร้อยแล้ว',
        data: {
          positions: positions.length,
          levels: positionLevels.length,
        },
      });
    } catch (error) {
      console.error('Error adding positions to Prisma:', error);
      
      // ถ้าโมเดลไม่มี ให้แจ้งเตือน
      if (error.message.includes('does not exist in the current database')) {
        return NextResponse.json({
          success: false,
          message: 'โมเดล Position หรือ PositionLevel ไม่มีใน schema Prisma โปรดอัปเดต schema ก่อน',
          error: error.message,
        }, { status: 500 });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error seeding positions:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล',
      error: error.message,
    }, { status: 500 });
  }
}

// ฟังก์ชันสำหรับเรียกดูข้อมูลที่มีอยู่
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

    try {
      // ดึงข้อมูลตำแหน่ง
      const positions = await prisma.positions.findMany();
      
      // ดึงข้อมูลระดับตำแหน่ง
      const positionLevels = await prisma.position_levels.findMany({
        orderBy: { level: 'asc' }
      });
      
      return NextResponse.json({
        success: true,
        data: {
          positions,
          positionLevels,
        },
      });
    } catch (error) {
      console.error('Error fetching positions from Prisma:', error);
      
      // ถ้าโมเดลไม่มี ให้แจ้งเตือน
      if (error.message.includes('does not exist in the current database')) {
        return NextResponse.json({
          success: false,
          message: 'โมเดล Position หรือ PositionLevel ไม่มีใน schema Prisma โปรดอัปเดต schema ก่อน',
          error: error.message,
        }, { status: 500 });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      error: error.message,
    }, { status: 500 });
  }
} 