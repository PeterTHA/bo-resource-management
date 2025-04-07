import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// ดึงรายชื่อสมาชิกในโปรเจค
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
    
    const members = await prisma.projectMember.findMany({
      where: {
        projectId: id
      },
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
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    return NextResponse.json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('Error getting project members:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get project members' },
      { status: 500 }
    );
  }
}

// เพิ่มสมาชิกใหม่ในโปรเจค
export async function POST(req, { params }) {
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
    const { employeeId, roleId } = body;
    
    // ตรวจสอบว่าพนักงานมีอยู่จริงหรือไม่
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });
    
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่า role มีอยู่จริงหรือไม่
    const role = await prisma.projectRole.findUnique({
      where: { id: roleId }
    });
    
    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าพนักงานเป็นสมาชิกในโปรเจคนี้อยู่แล้วหรือไม่
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        employeeId: employeeId
      }
    });
    
    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'Employee is already a member of this project' },
        { status: 409 }
      );
    }
    
    // เพิ่มสมาชิกใหม่
    const member = await prisma.projectMember.create({
      data: {
        project: {
          connect: { id: id }
        },
        employee: {
          connect: { id: employeeId }
        },
        role: {
          connect: { id: roleId }
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true
          }
        },
        role: true
      }
    });
    
    // บันทึก activity log
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        employeeId: session.user.id,
        action: 'add_member',
        details: {
          memberId: member.id,
          memberName: `${member.employee.firstName} ${member.employee.lastName}`,
          role: member.role.name
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: member
    });
  } catch (error) {
    console.error('Error adding project member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add project member' },
      { status: 500 }
    );
  }
}

// อัพเดทบทบาทของสมาชิก
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
    const { memberId, roleId } = body;

    // ตรวจสอบว่า role มีอยู่จริงหรือไม่
    const role = await prisma.projectRole.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่าสมาชิกอยู่ในโปรเจคนี้จริงหรือไม่
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        id: memberId,
        projectId: id
      }
    });

    if (!existingMember) {
      return NextResponse.json(
        { success: false, error: 'Member not found in this project' },
        { status: 404 }
      );
    }

    const member = await prisma.projectMember.update({
      where: {
        id: memberId
      },
      data: {
        roleId
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true
          }
        },
        role: true
      }
    });

    // บันทึก activity log
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        employeeId: session.user.id,
        action: 'update_member_role',
        details: {
          memberId: member.id,
          memberName: `${member.employee.firstName} ${member.employee.lastName}`,
          newRole: member.role.name
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      data: member 
    });
  } catch (error) {
    console.error('Error updating project member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update project member' },
      { status: 500 }
    );
  }
}

// ลบสมาชิกออกจากโปรเจค
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
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');

    const member = await prisma.projectMember.delete({
      where: {
        id: memberId,
        projectId: id
      },
      include: {
        employee: {
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
        action: 'remove_member',
        details: {
          memberId: member.id,
          memberName: `${member.employee.firstName} ${member.employee.lastName}`
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      data: member 
    });
  } catch (error) {
    console.error('Error removing project member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove project member' },
      { status: 500 }
    );
  }
} 