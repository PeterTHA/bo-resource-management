import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { getTeams } from '../../../lib/db-prisma';

// GET - ดึงข้อมูลทีมทั้งหมด
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    // ดึงข้อมูลทีมจาก Prisma
    const result = await getTeams();
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลทีม', connectionError: result.connectionError },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/teams:', error);
    return NextResponse.json(
      { success: false, message: error.message, connectionError: true },
      { status: 500 }
    );
  }
} 