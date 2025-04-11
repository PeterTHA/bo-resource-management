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

    // ดึงข้อมูลปีปัจจุบัน
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    // ดึงข้อมูลประเภทการลา
    const leaveTypes = await prisma.leaves.groupBy({
      by: ['leave_type'],
      where: {
        employee_id: session.user.id,
        created_at: {
          gte: startOfYear,
          lte: endOfYear
        },
        OR: [
          { status: 'approved' },
          { status: 'waiting_for_approve' }
        ]
      }
    });

    // สร้าง Promise สำหรับดึงข้อมูลแต่ละประเภทการลาพร้อมกัน
    const leavePromises = leaveTypes.map(async ({ leave_type }) => {
      const [approved, waiting, leaveData] = await Promise.all([
        // จำนวนวันลาที่อนุมัติแล้ว
        prisma.leaves.aggregate({
          where: {
            employee_id: session.user.id,
            leave_type,
            status: 'approved',
            created_at: {
              gte: startOfYear,
              lte: endOfYear
            }
          },
          _count: {
            id: true
          },
          _sum: {
            total_days: true
          }
        }),
        
        // จำนวนวันลาที่รออนุมัติ
        prisma.leaves.aggregate({
          where: {
            employee_id: session.user.id,
            leave_type,
            status: 'waiting_for_approve',
            created_at: {
              gte: startOfYear,
              lte: endOfYear
            }
          },
          _count: {
            id: true
          },
          _sum: {
            total_days: true
          }
        }),
        
        // ข้อมูลการลาอนุมัติแล้วเพื่อใช้ในการคำนวณรายเดือน
        prisma.leaves.findMany({
          where: {
            employee_id: session.user.id,
            leave_type,
            status: 'approved',
            created_at: {
              gte: startOfYear,
              lte: endOfYear
            }
          },
          select: {
            start_date: true,
            total_days: true
          }
        })
      ]);

      return {
        type: leave_type || 'ไม่ระบุ',
        total: approved._count.id + waiting._count.id,
        total_days: (approved._sum.total_days || 0) + (waiting._sum.total_days || 0),
        approved: {
          count: approved._count.id,
          days: approved._sum.total_days || 0,
          data: leaveData
        },
        waiting_for_approve: {
          count: waiting._count.id,
          days: waiting._sum.total_days || 0
        }
      };
    });

    // รอให้ข้อมูลทั้งหมดมาครบ
    const leavesByType = await Promise.all(leavePromises);

    // เตรียมข้อมูลสถิติรายเดือน
    const thaiMonthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    
    // สร้างข้อมูลเริ่มต้นสำหรับทุกเดือน
    const monthStats = {};
    for (let i = 0; i < 12; i++) {
      const monthName = `${thaiMonthNames[i]} ${currentYear}`;
      const key = `${currentYear}-${i}`;
      
      monthStats[key] = {
        name: monthName,
        days: 0,
        count: 0
      };
    }
    
    // เพิ่มข้อมูลจริงจาก approved leaves
    leavesByType.forEach(leaveType => {
      leaveType.approved.data.forEach(leave => {
        const startDate = new Date(leave.start_date);
        const month = startDate.getMonth();
        const key = `${currentYear}-${month}`;
        
        if (monthStats[key]) {
          monthStats[key].days += leave.total_days || 0;
          monthStats[key].count += 1;
        }
      });
    });
    
    // คำนวณจำนวนรวมของวันลาที่อนุมัติแล้ว
    const totalApprovedDays = leavesByType.reduce((total, data) => 
      total + data.approved.days, 0);
    
    // คำนวณจำนวนรวมของวันลาทั้งหมด (อนุมัติ + รออนุมัติ)
    const totalLeaveDays = leavesByType.reduce((total, data) => 
      total + data.total_days, 0);

    // เรียงลำดับเดือน
    const monthlyStats = Object.values(monthStats);

    return NextResponse.json({
      success: true,
      data: {
        byType: leavesByType.sort((a, b) => b.total - a.total),
        totalApprovedDays,
        totalLeaveDays,
        monthlyStats
      }
    });

  } catch (error) {
    console.error('Error fetching leave summary:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปการลา' },
      { status: 500 }
    );
  }
} 