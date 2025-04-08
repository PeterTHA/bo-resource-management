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
    const employees = await prisma.employees.findMany({
      where: {
        is_active: true
      },
      include: {
        departments: true,
        teams: true
      }
    });

    // ดึงข้อมูลสถานะการทำงาน
    const workStatuses = await prisma.work_statuses.findMany({
      where: {
        employee_id: {
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