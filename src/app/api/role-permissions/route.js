import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db-prisma';

/**
 * GET /api/role-permissions - ดึงข้อมูลความสัมพันธ์ระหว่างบทบาทและสิทธิ์
 */
export async function GET(request) {
  try {
    // ตรวจสอบการเข้าสู่ระบบ
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' },
        { status: 401 }
      );
    }

    // ดึงค่า parameters จาก URL
    const searchParams = request.nextUrl.searchParams;
    const roleId = searchParams.get('roleId');

    // สร้าง query options
    const queryOptions = {
      include: {
        roles: {
          select: {
            id: true,
            name: true,
            name_th: true,
            code: true,
          },
        },
        permissions: {
          select: {
            id: true,
            name: true,
            name_th: true,
            code: true,
            category: true,
          },
        },
      },
      where: {
        is_active: true,
      },
      orderBy: [
        { role_id: 'asc' },
        { permission_id: 'asc' },
      ],
    };

    // ถ้ามีการกรองด้วย roleId
    if (roleId) {
      queryOptions.where.role_id = roleId;
    }

    // ดึงข้อมูลจากฐานข้อมูล
    const rolePermissions = await prisma.role_permissions.findMany(queryOptions);

    return NextResponse.json(rolePermissions);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลความสัมพันธ์', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/role-permissions - เพิ่มความสัมพันธ์ระหว่างบทบาทและสิทธิ์
 */
export async function POST(request) {
  try {
    // ตรวจสอบการเข้าสู่ระบบ
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' },
        { status: 401 }
      );
    }

    // ไม่ต้องตรวจสอบสิทธิ์เพิ่มเติม เพราะหน้า UI จะเช็คสิทธิ์ admin อยู่แล้ว

    const data = await request.json();

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!data.role_id || !data.permission_id) {
      return NextResponse.json(
        { message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีความสัมพันธ์นี้อยู่แล้วหรือไม่
    const existingRolePermission = await prisma.role_permissions.findUnique({
      where: {
        role_id_permission_id: {
          role_id: data.role_id,
          permission_id: data.permission_id,
        },
      },
    });

    let rolePermission;

    if (existingRolePermission) {
      // ถ้ามีแล้ว ให้อัปเดตสถานะเป็นเปิดใช้งาน
      rolePermission = await prisma.role_permissions.update({
        where: {
          id: existingRolePermission.id,
        },
        data: {
          is_active: true,
          updated_at: new Date(),
        },
      });
    } else {
      // ถ้ายังไม่มี ให้สร้างใหม่
      rolePermission = await prisma.role_permissions.create({
        data: {
          id: data.id || crypto.randomUUID(),
          role_id: data.role_id,
          permission_id: data.permission_id,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    return NextResponse.json(rolePermission, { status: 201 });
  } catch (error) {
    console.error('Error creating role permission:', error);
    
    // ตรวจสอบ error unique constraint
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'ความสัมพันธ์นี้มีอยู่ในระบบแล้ว' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการเพิ่มความสัมพันธ์', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/role-permissions - ลบความสัมพันธ์ระหว่างบทบาทและสิทธิ์
 */
export async function DELETE(request) {
  try {
    // ตรวจสอบการเข้าสู่ระบบ
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' },
        { status: 401 }
      );
    }

    // ไม่ต้องตรวจสอบสิทธิ์เพิ่มเติม เพราะหน้า UI จะเช็คสิทธิ์ admin อยู่แล้ว

    // ดึงค่า parameters จาก URL
    const searchParams = request.nextUrl.searchParams;
    const roleId = searchParams.get('roleId');
    const permissionId = searchParams.get('permissionId');

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!roleId || !permissionId) {
      return NextResponse.json(
        { message: 'กรุณาระบุ roleId และ permissionId ที่ต้องการลบ' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีความสัมพันธ์นี้อยู่หรือไม่
    const existingRolePermission = await prisma.role_permissions.findUnique({
      where: {
        role_id_permission_id: {
          role_id: roleId,
          permission_id: permissionId,
        },
      },
    });

    if (!existingRolePermission) {
      return NextResponse.json(
        { message: 'ไม่พบความสัมพันธ์นี้ในระบบ' },
        { status: 404 }
      );
    }

    // อัปเดตสถานะความสัมพันธ์เป็นปิดใช้งาน (soft delete)
    const updatedRolePermission = await prisma.role_permissions.update({
      where: {
        id: existingRolePermission.id,
      },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(updatedRolePermission);
  } catch (error) {
    console.error('Error deleting role permission:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการลบความสัมพันธ์', error: error.message },
      { status: 500 }
    );
  }
} 