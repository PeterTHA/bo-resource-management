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

    // ดึงข้อมูลสรุปการลาทั้งหมด
    const leaveSummary = await prisma.leave.findMany({
      where: {
        employeeId: session.user.id
      },
      select: {
        id: true,
        leaveType: true,
        status: true,
        startDate: true,
        endDate: true,
        totalDays: true,
        reason: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
            department: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
    const formattedLeaves = leaveSummary.map(leave => {
      return {
        id: leave.id,
        leaveType: leave.leaveType || 'ไม่ระบุ',
        status: leave.status,
        startDate: leave.startDate,
        endDate: leave.endDate,
        totalDays: leave.totalDays,
        reason: leave.reason,
        employeeName: `${leave.employee.firstName} ${leave.employee.lastName}`,
        department: leave.employee.department?.name || 'ไม่ระบุแผนก'
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedLeaves
    });

  } catch (error) {
    console.error('Error fetching leave summary:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปการลา' },
      { status: 500 }
    );
  }
} 