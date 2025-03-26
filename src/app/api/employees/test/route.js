import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-prisma';

export async function GET(req) {
  try {
    // ทดสอบการเชื่อมต่อกับฐานข้อมูล
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      success: true,
      message: 'ระบบทำงานปกติ',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API test error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูล',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
