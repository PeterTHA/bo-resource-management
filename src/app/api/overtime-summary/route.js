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

    // คำนวณสถิติสรุปโดยใช้ Prisma aggregate
    const [approved, pending, totalStats] = await Promise.all([
      // จำนวนและชั่วโมงรวมของรายการที่อนุมัติแล้ว
      prisma.overtime.aggregate({
        where: {
          employeeId: session.user.id,
          OR: [
            { status: 'APPROVED' },
            { status: 'approved' },
            { status: 'อนุมัติ' }
          ],
          date: {
            gte: startOfYear,
            lte: endOfYear
          }
        },
        _count: {
          id: true
        },
        _sum: {
          totalHours: true
        }
      }),
      
      // จำนวนรายการที่รออนุมัติ
      prisma.overtime.count({
        where: {
          employeeId: session.user.id,
          OR: [
            { status: 'PENDING' },
            { status: 'pending' },
            { status: 'waiting_for_approve' }
          ],
          date: {
            gte: startOfYear,
            lte: endOfYear
          }
        }
      }),
      
      // จำนวนรวมทั้งหมด
      prisma.overtime.count({
        where: {
          employeeId: session.user.id,
          date: {
            gte: startOfYear,
            lte: endOfYear
          }
        }
      })
    ]);

    // ดึงข้อมูลรายเดือนสำหรับปีปัจจุบัน - เฉพาะรายการที่อนุมัติแล้ว
    const approvedOvertimes = await prisma.overtime.findMany({
      where: {
        employeeId: session.user.id,
        OR: [
          { status: 'APPROVED' },
          { status: 'approved' },
          { status: 'อนุมัติ' }
        ],
        date: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      select: {
        date: true,
        totalHours: true
      }
    });

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
        hours: 0,
        count: 0
      };
    }
    
    // เพิ่มข้อมูลจริงจาก approved overtimes
    approvedOvertimes.forEach(ot => {
      const date = new Date(ot.date);
      const month = date.getMonth();
      const key = `${currentYear}-${month}`;
      
      if (monthStats[key]) {
        monthStats[key].hours += parseFloat(ot.totalHours) || 0;
        monthStats[key].count += 1;
      }
    });
    
    // เรียงลำดับตามเดือน
    const monthlyStats = Object.values(monthStats);

    // สร้างสถิติรวม
    const stats = {
      pending: pending,
      approved: approved._count.id,
      rejected: 0, // ไม่จำเป็นต้องดึงข้อมูลนี้ตอนแสดง Dashboard
      cancelled: 0, // ไม่จำเป็นต้องดึงข้อมูลนี้ตอนแสดง Dashboard
      total: totalStats,
      approvedHours: approved._sum.totalHours || 0
    };

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          APPROVED: approvedOvertimes
        },
        stats,
        monthlyStats
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