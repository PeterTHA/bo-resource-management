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
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!startDate || !endDate) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required parameters' 
      }, { status: 400 });
    }

    // แปลงวันที่เป็น Date object
    const start = new Date(startDate);
    const end = new Date(endDate);

    // ดึงข้อมูล OT ที่อนุมัติแล้ว
    const overtimes = await prisma.overtimes.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        },
        status: 'อนุมัติ'
      },
      include: {
        employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            departments: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: overtimes
    });

  } catch (error) {
    console.error('Error fetching approved overtimes:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 