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
    
    const members = await prisma.project_members.findMany({
      where: {
        project_id: id
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
        },
        role: true
      },
      orderBy: {
        created_at: 'asc'
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
    const { employee_id, role_id } = body;
    
    // ตรวจสอบว่าพนักงานมีอยู่จริงหรือไม่
    const employee = await prisma.employees.findUnique({
      where: { id: employee_id }
    });
    
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่า role มีอยู่จริงหรือไม่
    const role = await prisma.project_roles.findUnique({
      where: { id: role_id }
    });
    
    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าพนักงานเป็นสมาชิกในโปรเจคนี้อยู่แล้วหรือไม่
    const existingMember = await prisma.project_members.findFirst({
      where: {
        project_id: id,
        employee_id: employee_id
      }
    });
    
    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'Employee is already a member of this project' },
        { status: 409 }
      );
    }
    
    // เพิ่มสมาชิกใหม่
    const member = await prisma.project_members.create({
      data: {
        projects: {
          connect: { id: id }
        },
        employees: {
          connect: { id: employee_id }
        },
        role: {
          connect: { id: role_id }
        }
      },
      include: {
        employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            position: true
          }
        },
        role: true
      }
    });
    
    // บันทึก activity log
    await prisma.project_activity_logs.create({
      data: {
        project_id: id,
        employee_id: session.user.id,
        action: 'add_member',
        details: {
          memberId: member.id,
          memberName: `${member.employees.first_name} ${member.employees.last_name}`,
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
    const { memberId, role_id } = body;

    // ตรวจสอบว่า role มีอยู่จริงหรือไม่
    const role = await prisma.project_roles.findUnique({
      where: { id: role_id }
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่าสมาชิกอยู่ในโปรเจคนี้จริงหรือไม่
    const existingMember = await prisma.project_members.findFirst({
      where: {
        id: memberId,
        project_id: id
      }
    });

    if (!existingMember) {
      return NextResponse.json(
        { success: false, error: 'Member not found in this project' },
        { status: 404 }
      );
    }

    const member = await prisma.project_members.update({
      where: {
        id: memberId
      },
      data: {
        role_id
      },
      include: {
        employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            position: true
          }
        },
        role: true
      }
    });

    // บันทึก activity log
    await prisma.project_activity_logs.create({
      data: {
        project_id: id,
        employee_id: session.user.id,
        action: 'update_member_role',
        details: {
          memberId: member.id,
          memberName: `${member.employees.first_name} ${member.employees.last_name}`,
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

    const member = await prisma.project_members.delete({
      where: {
        id: memberId,
        project_id: id
      },
      include: {
        employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    // บันทึก activity log
    await prisma.project_activity_logs.create({
      data: {
        project_id: id,
        employee_id: session.user.id,
        action: 'remove_member',
        details: {
          memberId: member.id,
          memberName: `${member.employees.first_name} ${member.employees.last_name}`
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