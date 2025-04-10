import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, canAccessResource } from '@/lib/permissions';
import { hash } from 'bcryptjs';

// GET - ดึงข้อมูลพนักงานตาม ID
export async function GET(req, { params }) {
  try {
    // ตรวจสอบสิทธิ์
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ 
        error: true,
        message: 'กรุณาเข้าสู่ระบบ' 
      }, { status: 401 });
    }

    // รอให้ params พร้อมก่อนใช้งาน
    const resolvedParams = await params;
    
    // ตรวจสอบว่า params มีค่าหรือไม่
    if (!resolvedParams?.id) {
      return NextResponse.json({ 
        error: true,
        message: 'ไม่ระบุรหัสพนักงาน' 
      }, { status: 400 });
    }

    const id = resolvedParams.id;

    // ดึงข้อมูลพนักงาน
    const employee = await prisma.employees.findUnique({
      where: { id },
      select: {
        id: true,
        employee_id: true,
        first_name: true,
        last_name: true,
        email: true,
        position: true,
        position_level: true,
        position_title: true,
        departments: true,
        department_id: true,
        teams: true,
        team_id: true,
        hire_date: true,
        role_id: true,
        roles: true,
        is_active: true,
        image: true,
        created_at: true,
        updated_at: true,
        gender: true,
        birth_date: true,
        phone_number: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ 
        error: true,
        message: 'ไม่พบข้อมูลพนักงาน' 
      }, { status: 404 });
    }

    // เพิ่มฟิลด์ role เพื่อความเข้ากันได้กับโค้ดเดิม
    const transformedEmployee = {
      ...employee,
      role: employee.roles?.code || null,
      roleName: employee.roles?.name || null,
      roleNameTh: employee.roles?.name_th || null
    };

    // ถ้าผู้ใช้ไม่ใช่ admin และพยายามเข้าถึงข้อมูลของ admin
    const isUserAdmin = session.user.roles?.code?.toUpperCase() === 'ADMIN' || session.user.role?.toUpperCase() === 'ADMIN';
    const isEmployeeAdmin = employee.roles?.code?.toUpperCase() === 'ADMIN';

    if (!isUserAdmin && isEmployeeAdmin) {
      return NextResponse.json({ 
        error: true,
        message: 'คุณไม่มีสิทธิ์ดูข้อมูลของผู้ดูแลระบบ' 
      }, { status: 403 });
    }

    // ตรวจสอบสิทธิ์ในการดูข้อมูลพนักงาน
    const canView = 
      isUserAdmin || // Admin ดูได้ทั้งหมด
      hasPermission(session.user, 'employees.view.all') || 
      (hasPermission(session.user, 'employees.view.teams') && employee.team_id === session.user.team_id) || // ดูได้ถ้าอยู่ทีมเดียวกัน
      employee.id === session.user.id; // ดูข้อมูลตัวเองได้เสมอ

    if (!canView) {
      return NextResponse.json({ 
        error: true,
        message: 'คุณไม่มีสิทธิ์ดูข้อมูลพนักงานคนนี้' 
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: transformedEmployee,
      message: 'ดึงข้อมูลพนักงานสำเร็จ'
    });
  } catch (error) {
    // ในบล็อก catch เราไม่สามารถเข้าถึง resolvedParams ได้เพราะอาจเกิด error ก่อนที่จะ resolve params
    console.error(`Error in GET /api/employees/${params?.id || 'unknown'}:`, error);
    return NextResponse.json({ 
      error: true,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน',
      details: error.message 
    }, { status: 500 });
  }
}

// PUT - อัปเดตข้อมูลพนักงาน
export async function PUT(req, { params }) {
  try {
    // ตรวจสอบสิทธิ์
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ 
        error: true,
        message: 'กรุณาเข้าสู่ระบบ' 
      }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;
    const data = await req.json();

    // ตรวจสอบว่ามีพนักงานที่ต้องการอัปเดตหรือไม่
    const employee = await prisma.employees.findUnique({
      where: { id },
      include: {
        roles: true
      }
    });

    if (!employee) {
      return NextResponse.json({ 
        error: true,
        message: 'ไม่พบข้อมูลพนักงาน' 
      }, { status: 404 });
    }

    // ตรวจสอบสิทธิ์ในการแก้ไขข้อมูลพนักงาน
    const isAdmin = session.user.roles?.code?.toUpperCase() === 'ADMIN' || session.user.role?.toUpperCase() === 'ADMIN';
    const canEdit = 
      isAdmin || // Admin แก้ไขได้ทั้งหมด
      hasPermission(session.user, 'employees.edit.all') || 
      (hasPermission(session.user, 'employees.edit.teams') && employee.team_id === session.user.team_id) || // แก้ไขได้ถ้าอยู่ทีมเดียวกัน
      (hasPermission(session.user, 'employees.edit.own') && employee.id === session.user.id); // แก้ไขข้อมูลตัวเองได้

    if (!canEdit) {
      return NextResponse.json({ 
        error: true,
        message: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลพนักงานคนนี้' 
      }, { status: 403 });
    }

    // จำกัดฟิลด์ที่ผู้ใช้แต่ละประเภทสามารถแก้ไขได้
    const dataToUpdate = {};

    // ผู้ใช้ทั่วไปแก้ไขข้อมูลส่วนตัวของตัวเองได้
    if (employee.id === session.user.id) {
      // สามารถแก้ไขได้เฉพาะฟิลด์บางอย่าง
      if (data.first_name !== undefined) dataToUpdate.first_name = data.first_name;
      if (data.last_name !== undefined) dataToUpdate.last_name = data.last_name;
      if (data.email !== undefined) dataToUpdate.email = data.email;
      
      // อัปเดตรูปภาพทุกครั้งที่มีการส่งมา (รวมถึงกรณีเป็น null เพื่อลบรูป)
      if (data.image !== undefined) {
        dataToUpdate.image = data.image;
        console.log('Updating image to:', data.image);
      }
    }

    // หัวหน้าทีมสามารถแก้ไขข้อมูลของพนักงานในทีมได้
    const isSupervisor = hasPermission(session.user, 'employees.edit.teams');
    if ((isSupervisor || isAdmin) && 
        (employee.team_id === session.user.team_id || isAdmin)) {
      if (data.position !== undefined) dataToUpdate.position = data.position;
      if (data.position_level !== undefined) dataToUpdate.position_level = data.position_level;
      if (data.position_title !== undefined) dataToUpdate.position_title = data.position_title;
      
      // แต่ไม่สามารถแก้ไขบทบาทได้ (เฉพาะ admin)
      if (isAdmin) {
        if (data.role_id !== undefined) dataToUpdate.role_id = data.role_id;
        if (data.is_active !== undefined) dataToUpdate.is_active = data.is_active;
        if (data.department_id !== undefined) dataToUpdate.department_id = data.department_id;
        if (data.team_id !== undefined) dataToUpdate.team_id = data.team_id;
        if (data.employee_id !== undefined) dataToUpdate.employee_id = data.employee_id;
        if (data.hire_date !== undefined) dataToUpdate.hire_date = new Date(data.hire_date);
        if (data.gender !== undefined) dataToUpdate.gender = data.gender;
        if (data.birth_date !== undefined) dataToUpdate.birth_date = data.birth_date ? new Date(data.birth_date) : null;
        if (data.phone_number !== undefined) dataToUpdate.phone_number = data.phone_number;
        
        // Admin สามารถอัปเดตรูปภาพได้
        if (data.image !== undefined) {
          dataToUpdate.image = data.image;
          console.log('Admin updating image to:', data.image);
        }
      }
    }
    
    // ถ้าเป็น admin อนุญาตให้แก้ไขทุกฟิลด์ได้
    if (isAdmin) {
      Object.keys(data).forEach(key => {
        if (key !== 'id' && data[key] !== undefined) {
          // แปลงวันที่ในรูปแบบที่ถูกต้อง
          if (key === 'birth_date' || key === 'hire_date') {
            dataToUpdate[key] = data[key] ? new Date(data[key]) : null;
          } 
          // ตัด role และ role_name ออกเพราะไม่มีในฐานข้อมูลแล้ว
          else if (key !== 'role' && key !== 'role_name') {
            dataToUpdate[key] = data[key];
          }
        }
      });
    }

    // ตรวจสอบอีเมลซ้ำ
    if (dataToUpdate.email && dataToUpdate.email !== employee.email) {
      const existingEmail = await prisma.employees.findFirst({
        where: {
          email: dataToUpdate.email,
          NOT: { id },
        },
      });

      if (existingEmail) {
        return NextResponse.json({ 
          error: true,
          message: 'อีเมลนี้มีอยู่ในระบบแล้ว' 
        }, { status: 409 });
      }
    }

    // ตรวจสอบรหัสพนักงานซ้ำ
    if (dataToUpdate.employee_id && dataToUpdate.employee_id !== employee.employee_id) {
      const existingEmployeeId = await prisma.employees.findFirst({
        where: {
          employee_id: dataToUpdate.employee_id,
          NOT: { id },
        },
      });

      if (existingEmployeeId) {
        return NextResponse.json({ 
          error: true,
          message: 'รหัสพนักงานนี้มีอยู่ในระบบแล้ว' 
        }, { status: 409 });
      }
    }

    // อัปเดตข้อมูลพนักงาน
    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ 
        message: 'ไม่มีข้อมูลที่จะอัปเดต' 
      });
    }

    const updatedEmployee = await prisma.employees.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        employee_id: true,
        first_name: true,
        last_name: true,
        email: true,
        position: true,
        departments: true,
        department_id: true,
        teams: true,
        team_id: true,
        hire_date: true,
        role_id: true,
        roles: true,
        is_active: true,
        image: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      message: 'อัปเดตข้อมูลพนักงานสำเร็จ'
    });
  } catch (error) {
    console.error(`Error in PUT /api/employees/${params?.id || 'unknown'}:`, error);
    return NextResponse.json({ 
      error: true,
      message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลพนักงาน',
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE - ลบข้อมูลพนักงาน
export async function DELETE(req, { params }) {
  try {
    // ตรวจสอบสิทธิ์
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ 
        error: true,
        message: 'กรุณาเข้าสู่ระบบ' 
      }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    // ตรวจสอบว่าผู้ใช้มีสิทธิ์ในการลบข้อมูล
    if (!hasPermission(session.user, 'employees.delete')) {
      return NextResponse.json({ 
        error: true, 
        message: 'คุณไม่มีสิทธิ์ในการลบข้อมูลพนักงาน' 
      }, { status: 403 });
    }

    // ตรวจสอบว่ามีพนักงานที่ต้องการลบหรือไม่
    const employee = await prisma.employees.findUnique({
      where: { id },
      include: {
        roles: true
      }
    });

    if (!employee) {
      return NextResponse.json({ 
        error: true,
        message: 'ไม่พบข้อมูลพนักงาน' 
      }, { status: 404 });
    }

    // ห้ามลบข้อมูลตัวเอง
    if (employee.id === session.user.id) {
      return NextResponse.json({ 
        error: true,
        message: 'ไม่สามารถลบบัญชีของตัวเองได้' 
      }, { status: 403 });
    }

    // ผู้ใช้ที่ไม่ใช่ admin หรือไม่มีสิทธิ์ employees.delete.all จะลบได้เฉพาะพนักงานในทีมตัวเองเท่านั้น
    const isAdmin = await prisma.employees.findFirst({
      where: {
        id: session.user.id,
        roles: {
          code: 'ADMIN'
        }
      }
    });
    
    if (!isAdmin && !hasPermission(session.user, 'employees.delete.all')) {
      // ผู้ใช้ที่ไม่ใช่ admin ห้ามลบ admin
      if (employee.roles?.code?.toUpperCase() === 'ADMIN') {
        return NextResponse.json({ 
          error: true,
          message: 'คุณไม่มีสิทธิ์ในการลบข้อมูลของผู้ดูแลระบบ' 
        }, { status: 403 });
      }

      // ถ้าไม่ใช่ admin และพยายามลบคนนอกทีม
      if (hasPermission(session.user, 'employees.delete.teams') && 
          session.user.teamId !== employee.team_id) {
        return NextResponse.json({ 
          error: true,
          message: 'คุณไม่มีสิทธิ์ในการลบข้อมูลพนักงานนอกทีมของคุณ' 
        }, { status: 403 });
      }
    }

    // ลบข้อมูลพนักงาน
    await prisma.employees.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'ลบข้อมูลพนักงานสำเร็จ'
    });
  } catch (error) {
    console.error(`Error in DELETE /api/employees/${params?.id || 'unknown'}:`, error);
    return NextResponse.json({ 
      error: true,
      message: 'เกิดข้อผิดพลาดในการลบข้อมูลพนักงาน',
      details: error.message 
    }, { status: 500 });
  }
} 