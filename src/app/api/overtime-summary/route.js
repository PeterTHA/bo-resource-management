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

    // ดึงข้อมูลสรุปการทำงานล่วงเวลาทั้งหมด
    const overtimeSummary = await prisma.overtime.findMany({
      where: {
        employeeId: session.user.id
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        totalHours: true,
        status: true,
        reason: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
            department: true,
            teamData: {
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

    // แบ่งข้อมูลตาม status
    const overtimesByStatus = {
      PENDING: overtimeSummary.filter(ot => 
        ot.status === 'PENDING' || 
        ot.status === 'pending' || 
        ot.status === 'waiting_for_approve' || 
        ot.status?.toLowerCase() === 'pending'),
      APPROVED: overtimeSummary.filter(ot => 
        ot.status === 'APPROVED' || 
        ot.status === 'approved' || 
        ot.status === 'อนุมัติ' || 
        ot.status?.toLowerCase() === 'approved'),
      REJECTED: overtimeSummary.filter(ot => 
        ot.status === 'REJECTED' || 
        ot.status === 'rejected' || 
        ot.status === 'ไม่อนุมัติ' || 
        ot.status?.toLowerCase() === 'rejected'),
      CANCELLED: overtimeSummary.filter(ot => 
        ot.status === 'CANCELLED' || 
        ot.status === 'cancelled' || 
        ot.status === 'ยกเลิก' || 
        ot.status?.toLowerCase() === 'cancelled' || 
        ot.isCancelled === true)
    };

    // คำนวณสถิติ
    const stats = {
      pending: overtimesByStatus.PENDING.length,
      approved: overtimesByStatus.APPROVED.length,
      rejected: overtimesByStatus.REJECTED.length,
      cancelled: overtimesByStatus.CANCELLED.length,
      total: overtimeSummary.length,
      totalHours: overtimeSummary.reduce((sum, ot) => sum + (ot.totalHours || 0), 0),
      approvedHours: overtimesByStatus.APPROVED.reduce((sum, ot) => sum + (ot.totalHours || 0), 0)
    };

    return NextResponse.json({
      success: true,
      data: {
        summary: overtimesByStatus,
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching overtime summary:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปการทำงานล่วงเวลา' },
      { status: 500 }
    );
  }
} 