import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// สร้างข้อมูลบทบาทเริ่มต้นในระบบ
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    // ความปลอดภัยแบบง่าย ถ้ามี session ให้ทำงานได้เลย เพราะต้องการให้สามารถเพิ่มข้อมูลเริ่มต้นได้ง่าย
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // บทบาทเริ่มต้นที่ต้องการเพิ่ม
    const defaultRoles = [
      {
        id: 'project-manager',
        name: 'Project Manager',
        description: 'ผู้จัดการโปรเจค'
      },
      {
        id: 'team-lead',
        name: 'Team Lead',
        description: 'หัวหน้าทีม'
      },
      {
        id: 'team-member',
        name: 'Team Member',
        description: 'สมาชิกทีม'
      },
      {
        id: 'stakeholder',
        name: 'Stakeholder',
        description: 'ผู้มีส่วนได้ส่วนเสีย'
      },
      {
        id: 'client',
        name: 'Client',
        description: 'ลูกค้า'
      },
      {
        id: 'architect',
        name: 'System Architect',
        description: 'สถาปนิกระบบ ออกแบบสถาปัตยกรรมของระบบ'
      },
      {
        id: 'tech-lead',
        name: 'Technical Lead',
        description: 'ผู้นำด้านเทคนิค กำหนดทิศทางทางเทคนิคของโปรเจค'
      },
      {
        id: 'dev-ops',
        name: 'DevOps Engineer',
        description: 'วิศวกรเดฟออปส์ ดูแลการพัฒนาและการปฏิบัติการ'
      },
      {
        id: 'product-owner',
        name: 'Product Owner',
        description: 'เจ้าของผลิตภัณฑ์ กำหนดทิศทางและความต้องการของผลิตภัณฑ์'
      },
      {
        id: 'scrum-master',
        name: 'Scrum Master',
        description: 'สครัมมาสเตอร์ อำนวยความสะดวกในกระบวนการสครัม'
      },
      {
        id: 'ux-designer',
        name: 'UX Designer',
        description: 'นักออกแบบประสบการณ์ผู้ใช้'
      },
      {
        id: 'qa-engineer',
        name: 'QA Engineer',
        description: 'วิศวกรประกันคุณภาพ ทดสอบและรับรองคุณภาพของซอฟต์แวร์'
      },
      {
        id: 'frontend-dev',
        name: 'Frontend Developer',
        description: 'นักพัฒนาส่วนหน้า พัฒนาส่วนติดต่อผู้ใช้'
      },
      {
        id: 'backend-dev',
        name: 'Backend Developer',
        description: 'นักพัฒนาส่วนหลัง พัฒนาส่วนประมวลผลหลังบ้าน'
      },
      {
        id: 'mobile-dev',
        name: 'Mobile Developer',
        description: 'นักพัฒนาแอปพลิเคชันมือถือ'
      },
      {
        id: 'business-analyst',
        name: 'Business Analyst',
        description: 'นักวิเคราะห์ธุรกิจ วิเคราะห์ความต้องการทางธุรกิจ'
      },
      {
        id: 'tester',
        name: 'Tester',
        description: 'นักทดสอบ ทดสอบการทำงานของซอฟต์แวร์'
      }
    ];

    // เพิ่มข้อมูลบทบาท (ใช้ createMany ไม่ได้ในบางกรณี เช่น SQLite)
    const roles = [];
    
    for (const role of defaultRoles) {
      // ตรวจสอบว่ามีบทบาทนี้อยู่แล้วหรือไม่
      const existingRole = await prisma.project_roles.findUnique({
        where: { id: role.id }
      });
      
      if (!existingRole) {
        // ถ้ายังไม่มี ให้สร้างใหม่
        const newRole = await prisma.project_roles.create({
          data: {
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: []
          }
        });
        
        roles.push(newRole);
      } else {
        // ถ้ามีแล้ว ให้เพิ่มเข้า array เพื่อส่งกลับ
        roles.push(existingRole);
      }
    }

    return NextResponse.json({
      success: true,
      data: roles,
      message: 'Default project roles created successfully'
    });
  } catch (error) {
    console.error('Error seeding project roles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed project roles' },
      { status: 500 }
    );
  }
} 