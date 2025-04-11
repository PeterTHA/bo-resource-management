import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// PUT /api/positions/[id] - อัปเดตตำแหน่ง
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'positions.edit')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const data = await request.json();
    const { name, code, description, category } = data;
    const id = params.id;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !code || !category) {
      return NextResponse.json(
        { error: 'Name, code, and category are required' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีรหัสซ้ำหรือไม่ (ยกเว้นตัวเอง)
    const existingPosition = await prisma.positions.findFirst({
      where: {
        code,
        is_active: true,
        id: { not: id }
      }
    });

    if (existingPosition) {
      return NextResponse.json(
        { error: 'Position code already exists' },
        { status: 400 }
      );
    }

    const position = await prisma.positions.update({
      where: { id },
      data: {
        name,
        code,
        description,
        category
      }
    });

    return NextResponse.json({ success: true, data: position });
  } catch (error) {
    console.error('Error updating position:', error);
    return NextResponse.json(
      { error: 'Failed to update position' },
      { status: 500 }
    );
  }
}

// DELETE /api/positions/[id] - ลบตำแหน่ง (soft delete)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'positions.delete')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const id = params.id;

    const position = await prisma.positions.update({
      where: { id },
      data: { is_active: false }
    });

    return NextResponse.json({ success: true, data: position });
  } catch (error) {
    console.error('Error deleting position:', error);
    return NextResponse.json(
      { error: 'Failed to delete position' },
      { status: 500 }
    );
  }
} 