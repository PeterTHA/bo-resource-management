import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// ดึงรายการโปรเจคทั้งหมด
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ดึงข้อมูลโปรเจคพร้อม creator และ members
    const projects = await prisma.project.findMany({
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            image: true
          }
        },
        members: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                image: true
              }
            },
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Error getting projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get projects' },
      { status: 500 }
    );
  }
}

// สร้างโปรเจคใหม่
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, code, description, startDate, endDate, status, priority } = body;

    // ตรวจสอบว่าข้อมูลครบถ้วนหรือไม่
    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีรหัสโปรเจคซ้ำหรือไม่
    const existingProject = await prisma.project.findFirst({
      where: {
        code
      }
    });

    if (existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project code already exists' },
        { status: 409 }
      );
    }

    // สร้างโปรเจคใหม่
    const project = await prisma.project.create({
      data: {
        name,
        code,
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'active',
        priority: priority || 'medium',
        creator: {
          connect: { id: session.user.id }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            image: true
          }
        }
      }
    });

    // บันทึก activity log
    await prisma.projectActivityLog.create({
      data: {
        projectId: project.id,
        employeeId: session.user.id,
        action: 'create_project',
        details: {
          projectName: project.name,
          projectCode: project.code
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
} 