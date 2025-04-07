import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// ดึงข้อมูลโปรเจคตาม ID
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = await Promise.resolve(params);
    
    const project = await prisma.project.findUnique({
      where: { id },
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
        },
        activityLogs: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                image: true
              }
            }
          },
          take: 10
        }
      }
    });
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error getting project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get project' },
      { status: 500 }
    );
  }
}

// อัพเดทข้อมูลโปรเจค
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = await Promise.resolve(params);
    const body = await req.json();
    const { name, code, description, startDate, endDate, status, priority } = body;
    
    // ตรวจสอบว่าโปรเจคมีอยู่จริงหรือไม่
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });
    
    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าผู้ใช้เป็นผู้สร้างหรือมีสิทธิ์ในการแก้ไข
    if (existingProject.creatorId !== session.user.id && !hasPermission(session.user, 'projects.update')) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to update this project' },
        { status: 403 }
      );
    }
    
    // ตรวจสอบการซ้ำของรหัสโปรเจคถ้ามีการเปลี่ยนแปลง
    if (code !== existingProject.code) {
      const duplicateCode = await prisma.project.findFirst({
        where: {
          code,
          id: { not: id }
        }
      });
      
      if (duplicateCode) {
        return NextResponse.json(
          { success: false, error: 'Project code already exists' },
          { status: 409 }
        );
      }
    }
    
    // อัพเดทโปรเจค
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        code,
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status,
        priority
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    // บันทึก activity log
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        employeeId: session.user.id,
        action: 'update_project',
        details: {
          projectName: updatedProject.name,
          changes: determineChanges(existingProject, updatedProject)
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// ลบโปรเจค
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = await Promise.resolve(params);
    
    // ตรวจสอบว่าโปรเจคมีอยู่จริงหรือไม่
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true
      }
    });
    
    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าผู้ใช้เป็นผู้สร้างหรือมีสิทธิ์ในการลบ
    if (existingProject.creatorId !== session.user.id && !hasPermission(session.user, 'projects.delete')) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this project' },
        { status: 403 }
      );
    }
    
    // ลบสมาชิกทั้งหมดของโปรเจค
    await prisma.projectMember.deleteMany({
      where: { projectId: id }
    });
    
    // ลบบันทึกกิจกรรมทั้งหมดของโปรเจค
    await prisma.projectActivityLog.deleteMany({
      where: { projectId: id }
    });
    
    // ลบโปรเจค
    await prisma.project.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

// ฟังก์ชันช่วยตรวจสอบว่าผู้ใช้มีสิทธิ์หรือไม่
function hasPermission(user, permission) {
  // ถ้าเป็น admin หรือ supervisor ให้มีสิทธิ์ได้ทั้งหมด
  if (user.role === 'admin' || user.role === 'supervisor') {
    return true;
  }
  
  // ตรวจสอบสิทธิ์ตามที่กำหนด
  return user.permissions && user.permissions.includes(permission);
}

// ฟังก์ชันช่วยตรวจสอบการเปลี่ยนแปลงข้อมูล
function determineChanges(oldProject, newProject) {
  const changes = {};
  
  if (oldProject.name !== newProject.name) {
    changes.name = { from: oldProject.name, to: newProject.name };
  }
  
  if (oldProject.code !== newProject.code) {
    changes.code = { from: oldProject.code, to: newProject.code };
  }
  
  if (oldProject.description !== newProject.description) {
    changes.description = { from: oldProject.description, to: newProject.description };
  }
  
  // แปลงเป็น ISO string เพื่อเปรียบเทียบ
  const oldStartDate = oldProject.startDate ? new Date(oldProject.startDate).toISOString() : null;
  const newStartDate = newProject.startDate ? new Date(newProject.startDate).toISOString() : null;
  
  if (oldStartDate !== newStartDate) {
    changes.startDate = { 
      from: oldProject.startDate ? new Date(oldProject.startDate).toISOString().split('T')[0] : null, 
      to: newProject.startDate ? new Date(newProject.startDate).toISOString().split('T')[0] : null 
    };
  }
  
  const oldEndDate = oldProject.endDate ? new Date(oldProject.endDate).toISOString() : null;
  const newEndDate = newProject.endDate ? new Date(newProject.endDate).toISOString() : null;
  
  if (oldEndDate !== newEndDate) {
    changes.endDate = { 
      from: oldProject.endDate ? new Date(oldProject.endDate).toISOString().split('T')[0] : null, 
      to: newProject.endDate ? new Date(newProject.endDate).toISOString().split('T')[0] : null 
    };
  }
  
  if (oldProject.status !== newProject.status) {
    changes.status = { from: oldProject.status, to: newProject.status };
  }
  
  if (oldProject.priority !== newProject.priority) {
    changes.priority = { from: oldProject.priority, to: newProject.priority };
  }
  
  return changes;
} 