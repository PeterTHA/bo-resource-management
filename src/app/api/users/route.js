import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    const where = {
      isActive: true,
      ...(role && { role })
    };

    const users = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        position: true,
        positionLevel: true,
        departmentId: true,
        teamId: true,
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    // แปลงข้อมูลให้เหมาะสมกับการแสดงผล
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      position: user.position,
      positionLevel: user.positionLevel,
      departmentId: user.departmentId,
      teamId: user.teamId,
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 