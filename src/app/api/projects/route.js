import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

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
            position_id: true,
            position_title: true,
            image: true,
            positions: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        },
        project_members: {
          include: {
            employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position_id: true,
                position_title: true,
                image: true,
                positions: {
                  select: {
                    id: true,
                    code: true,
                    name: true
                  }
                }
              }
            },
            project_roles: true
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
    const { name, code, description, start_date, end_date, status, priority, members, jira_url, confluence_url, attachments } = body;

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

    // สร้าง ID สำหรับโปรเจคใหม่
    const projectId = uuidv4();

    // สร้างโปรเจคใหม่
    const project = await prisma.projects.create({
      data: {
        id: projectId,
        name,
        code,
        description,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        status: status || 'active',
        priority: priority || 'medium',
        created_by_id: session.user.id,
        jira_url: jira_url || null,
        confluence_url: confluence_url || null,
        attachments: attachments || []
      },
      include: {
        employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            position_id: true,
            position_title: true,
            image: true,
            positions: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        }
      }
    });

    // เพิ่มสมาชิกให้กับโปรเจค (ถ้ามี)
    if (members && members.length > 0) {
      for (const member of members) {
        await prisma.project_members.create({
          data: {
            id: uuidv4(),
            project_id: projectId,
            employee_id: member.employeeId,
            role_id: member.roleId || '1', // ใช้ roleId ที่ส่งมา หรือใช้ค่าเริ่มต้น '1' ถ้าไม่มี
            is_active: true,
            joined_at: new Date(),
            created_at: new Date(),
            updated_at: new Date()
          }
        });
      }

      // ดึงข้อมูลโปรเจคใหม่พร้อมสมาชิก
      const updatedProject = await prisma.projects.findUnique({
        where: {
          id: projectId
        },
        include: {
          employees: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              position_id: true,
              position_title: true,
              image: true,
              positions: {
                select: {
                  id: true,
                  code: true,
                  name: true
                }
              }
            }
          },
          project_members: {
            include: {
              employees: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  position_id: true,
                  position_title: true,
                  image: true,
                  positions: {
                    select: {
                      id: true,
                      code: true,
                      name: true
                    }
                  }
                }
              },
              project_roles: true
            }
          }
        }
      });

      // บันทึก activity log
      await prisma.project_activity_logs.create({
        data: {
          id: uuidv4(),
          project_id: projectId,
          employee_id: session.user.id,
          action: 'create_project',
          details: {
            projectName: project.name,
            projectCode: project.code,
            membersAdded: members.length
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: updatedProject
      });
    } else {
      // บันทึก activity log
      await prisma.project_activity_logs.create({
        data: {
          id: uuidv4(),
          project_id: projectId,
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
    }
  } catch (error) {
    console.error('Error creating projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project', message: error.message },
      { status: 500 }
    );
  }
} 