import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// ดึงข้อมูลบทบาทที่มีอยู่ในระบบ
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const roles = await prisma.project_roles.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error getting project roles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get project roles' },
      { status: 500 }
    );
  }
} 