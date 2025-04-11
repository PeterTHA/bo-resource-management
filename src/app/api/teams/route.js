import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db-prisma';
import { generateUuid } from '@/lib/generate-uuid';

// ดึงรายการทีมทั้งหมด
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ดึงข้อมูลทีม
    const teams = await prisma.teams.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            position_id: true,
            positions: true,
            role_id: true,
            roles: true,
          }
        }
      }
    });

    // แปลงข้อมูลให้อยู่ในรูปแบบที่เหมาะสม
    const transformedTeams = teams.map(team => ({
      ...team,
      employees: team.employees.map(employee => ({
        ...employee,
        position: employee.positions?.code || null,
        role: employee.roles?.code || null
      }))
    }));

    return NextResponse.json({
      success: true,
      data: transformedTeams,
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// สร้างทีมใหม่
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, code, description } = await req.json();

    // ตรวจสอบข้อมูล
    if (!name || !code) {
      return NextResponse.json(
        { success: false, message: 'Name and code are required' },
        { status: 400 }
      );
    }

    // ตรวจสอบการซ้ำ
    const existingTeam = await prisma.teams.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { code: { equals: code, mode: 'insensitive' } }
        ]
      }
    });

    if (existingTeam) {
      return NextResponse.json(
        { success: false, message: 'Team with this name or code already exists' },
        { status: 409 }
      );
    }

    // สร้างทีมใหม่
    const newTeam = await prisma.teams.create({
      data: {
        id: generateUuid(),
        name,
        code,
        description,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: newTeam,
    });
  } catch (error) {
    console.error('Error creating teams:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 