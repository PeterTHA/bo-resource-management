import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db-prisma';

export async function GET(request) {
  try {
    // ตรวจสอบการ authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // ดึงข้อมูลพนักงานทั้งหมดที่ active
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true
      },
      include: {
        department: true,
        teamData: true
      }
    });

    // ดึงข้อมูลสถานะการทำงาน
    const workStatuses = await prisma.workStatus.findMany({
      where: {
        employeeId: {
          in: employees.map(emp => emp.id)
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        employees,
        workStatuses
      }
    });

  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 