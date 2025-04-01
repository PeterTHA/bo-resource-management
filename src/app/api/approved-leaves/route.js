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

    // ดึง query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required parameters' 
      }, { status: 400 });
    }

    // แปลงวันที่เป็น Date object และจัดการ timezone
    const start = new Date(startDate);
    const end = new Date(endDate);

    // ปรับเวลาเป็น UTC
    const startUTC = new Date(Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate(),
      0, 0, 0, 0
    ));

    const endUTC = new Date(Date.UTC(
      end.getUTCFullYear(),
      end.getUTCMonth(),
      end.getUTCDate(),
      0, 0, 0, 0
    ));

    // เพิ่ม log สำหรับ parameter
    console.log('Leave API Parameters:', {
      originalStartDate: startDate,
      originalEndDate: endDate,
      startUTC: startUTC.toISOString(),
      endUTC: endUTC.toISOString()
    });

    // ดึงข้อมูลการลาที่อนุมัติแล้ว
    const leaves = await prisma.leave.findMany({
      where: {
        startDate: {
          gte: startUTC
        },
        endDate: {
          lte: endUTC
        },
        status: 'approved'
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
            teamId: true
          }
        }
      }
    });

    // เพิ่ม log สำหรับ result และ SQL query
    console.log('Leave API Query:', {
      where: {
        startDate: {
          lte: startUTC.toISOString()
        },
        endDate: {
          gte: endUTC.toISOString()
        },
        status: 'approved'
      }
    });

    console.log('Leave API Result:', {
      totalLeaves: leaves.length,
      leaves: leaves.map(leave => ({
        id: leave.id,
        employeeId: leave.employeeId,
        startDate: leave.startDate,
        endDate: leave.endDate,
        leaveType: leave.leaveType,
        status: leave.status,
        employee: leave.employee
      }))
    });

    return NextResponse.json({
      success: true,
      data: leaves
    });

  } catch (error) {
    console.error('Error fetching approved leaves:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 