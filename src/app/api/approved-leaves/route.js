import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db-prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  try {
    // Get parameters
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    
    console.log("Parameters:", { start_date, end_date });
    
    // Check if required parameters are provided
    if (!start_date || !end_date) {
      return NextResponse.json(
        { message: "start_date and end_date are required" },
        { status: 400 }
      );
    }
    
    // Create Date objects with UTC time set to midnight
    const startDate = new Date(start_date);
    startDate.setUTCHours(0, 0, 0, 0);
    
    const endDate = new Date(end_date);
    endDate.setUTCHours(23, 59, 59, 999);
    
    // ตรวจสอบการ authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // เพิ่ม log สำหรับ parameter
    console.log('Leave API Parameters:', {
      originalStartDate: start_date,
      originalEndDate: end_date,
      startUTC: startDate.toISOString(),
      endUTC: endDate.toISOString()
    });

    // ดึงข้อมูลการลาที่อนุมัติแล้ว
    const leaves = await prisma.leaves.findMany({
      where: {
        start_date: {
          gte: startDate
        },
        end_date: {
          lte: endDate
        },
        leave_approvals: {
          some: {
            status: 'approved'
          }
        }
      },
      include: {
        employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            departments: true,
            position: true,
            team_id: true
          }
        },
        leave_approvals: {
          orderBy: {
            created_at: 'desc'
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
        }
      }
    });

    // เพิ่ม log สำหรับ result และ SQL query
    console.log('Leave API Query:', {
      where: {
        start_date: {
          gte: startDate.toISOString()
        },
        end_date: {
          lte: endDate.toISOString()
        },
        leave_approvals: {
          some: {
            status: 'approved'
          }
        }
      }
    });

    console.log('Leave API Result:', {
      totalLeaves: leaves.length,
      leaves: leaves.map(leave => ({
        id: leave.id,
        employee_id: leave.employee_id,
        start_date: leave.start_date,
        end_date: leave.end_date,
        leave_type: leave.leave_type,
        status: leave.status,
        employees: leave.employees
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