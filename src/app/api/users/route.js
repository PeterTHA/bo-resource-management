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
      is_active: true,
      ...(role && { role })
    };

    const users = await prisma.employees.findMany({
      where,
      select: {
        id: true,
        employee_id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        position: true,
        position_level: true,
        department_id: true,
        team_id: true,
      },
      orderBy: {
        first_name: 'asc'
      }
    });

    // แปลงข้อมูลให้เหมาะสมกับการแสดงผล
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      role: user.role,
      position: user.position,
      position_level: user.position_level,
      department_id: user.department_id,
      team_id: user.team_id,
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