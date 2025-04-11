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
    const projects = await prisma.projects.findMany({
      include: {
        employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            position: true,
            image: true
          }
        },
        members: {
          include: {
            employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                image: true
              }
            },
            role: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
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
    const { name, code, description, start_date, end_date, status, priority } = body;

    // ตรวจสอบว่าข้อมูลครบถ้วนหรือไม่
    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีรหัสโปรเจคซ้ำหรือไม่
    const existingProject = await prisma.projects.findFirst({
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
    const project = await prisma.projects.create({
      data: {
        name,
        code,
        description,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        status: status || 'active',
        priority: priority || 'medium',
        created_by_id: session.user.id
      },
      include: {
        employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            position: true,
            image: true
          }
        }
      }
    });

    // บันทึก activity log
    await prisma.project_activity_logs.create({
      data: {
        project_id: project.id,
        employee_id: session.user.id,
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
    console.error('Error creating projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
} 