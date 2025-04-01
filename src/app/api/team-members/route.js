import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // ดึงข้อมูลพนักงานในทีมเดียวกัน
    const employees = await prisma.employee.findMany({
      where: {
        teamId: session.user.teamId,
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        positionTitle: true,
        department: {
          select: {
            name: true
          }
        },
        teamData: {
          select: {
            name: true
          }
        },
        image: true,
        workStatuses: {
          where: {
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7))
            }
          },
          orderBy: {
            date: 'desc'
          },
          take: 7,
          select: {
            id: true,
            date: true,
            status: true
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
    const formattedEmployees = employees.map(employee => {
      const { teamData, workStatuses, department, ...employeeData } = employee;
      return {
        ...employeeData,
        department: department?.name || 'ไม่ระบุแผนก',
        teamName: teamData?.name || 'ไม่มีทีม',
        workStatuses: workStatuses.map(status => ({
          id: status.id,
          date: status.date,
          status: status.status
        }))
      };
    });

    // ตรวจสอบและแปลงข้อมูลให้ถูกต้อง
    const validatedEmployees = formattedEmployees.map(employee => ({
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      positionTitle: employee.positionTitle || '',
      department: employee.department || 'ไม่ระบุแผนก',
      teamName: employee.teamName || 'ไม่มีทีม',
      image: employee.image || null,
      workStatuses: employee.workStatuses || []
    }));

    return NextResponse.json({
      success: true,
      data: validatedEmployees
    });

  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิกในทีม' },
      { status: 500 }
    );
  }
} 