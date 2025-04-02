import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getEmployeeCalendarData } from "@/lib/db-prisma";

export async function GET(request) {
  try {
    // ตรวจสอบการยืนยันตัวตน
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'ไม่ได้รับอนุญาตให้เข้าถึงข้อมูล' },
        { status: 401 }
      );
    }

    // รับพารามิเตอร์จาก URL
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date().toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();

    // ดึงข้อมูลปฏิทินพนักงาน
    const result = await getEmployeeCalendarData(startDate, endDate);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in employee calendar API:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
} 