import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export { prisma };
export default prisma;

/**
 * ฟังก์ชันสำหรับดึงข้อมูลพนักงานทั้งหมด
 */
export async function getEmployees() {
  try {
    const employees = await prisma.employees.findMany({
      orderBy: {
        created_at: 'desc'
      },
      include: {
        teams: true
      },
      select: undefined
    });
    
    // ไม่ส่งรหัสผ่านกลับไป
    const employeesWithoutPassword = employees.map(employee => {
      const { password, ...employeeWithoutPassword } = employee;
      return employeeWithoutPassword;
    });
    
    return { success: true, data: employeesWithoutPassword };
  } catch (error) {
    console.error('Error fetching employees:', error);
    return { success: false, message: error.message, connectionError: true };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลพนักงานตาม ID
 */
export async function getEmployeeById(id) {
  try {
    const employee = await prisma.employees.findUnique({
      where: { id },
      include: {
        teams: true
      }
    });
    
    if (!employee) {
      return { success: false, message: 'ไม่พบข้อมูลพนักงาน' };
    }
    
    return { success: true, data: employee };
  } catch (error) {
    console.error(`Error fetching employee with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลพนักงานตามอีเมล
 */
export async function getEmployeeByEmail(email) {
  try {
    const employee = await prisma.employees.findUnique({
      where: { email },
      select: {
        id: true,
        employee_id: true,
        first_name: true,
        last_name: true,
        email: true,
        password: true,
        position: true,
        departments: true,
        hire_date: true,
        role: true,
        is_active: true,
        image: true,
        created_at: true,
        updated_at: true,
      }
    });
    
    if (!employee) {
      return { success: false, message: 'ไม่พบข้อมูลพนักงาน' };
    }
    
    return { success: true, data: employee };
  } catch (error) {
    console.error(`Error fetching employee with email ${email}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลทีมทั้งหมด
 */
export async function getTeams() {
  try {
    const teams = await prisma.teams.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    
    return { success: true, data: teams };
  } catch (error) {
    console.error('Error fetching teams:', error);
    return { success: false, message: error.message, connectionError: true };
  }
}

/**
 * ฟังก์ชันสำหรับเพิ่มข้อมูลพนักงาน
 */
export async function createEmployee(data) {
  try {
    // ตรวจสอบว่ามีอีเมลซ้ำหรือไม่
    const existingEmployee = await prisma.employees.findUnique({
      where: { email: data.email },
    });
    
    if (existingEmployee) {
      return { success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' };
    }
    
    // ตรวจสอบว่ามีรหัสพนักงานซ้ำหรือไม่
    const existingEmployeeId = await prisma.employees.findUnique({
      where: { employee_id: data.employee_id },
    });
    
    if (existingEmployeeId) {
      return { success: false, message: 'รหัสพนักงานนี้ถูกใช้งานแล้ว' };
    }
    
    // สร้างพนักงานใหม่
    const newEmployee = await prisma.employees.create({
      data: {
        employee_id: data.employee_id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
        position: data.position,
        departments: data.departments,
        team_id: data.team_id || null,
        teams: data.teams || null,
        hire_date: new Date(data.hire_date),
        role: data.role || 'employee',
        is_active: data.is_active !== undefined ? data.is_active : true,
        image: data.image || null,
      },
    });
    
    // ไม่ส่งรหัสผ่านกลับไป
    const { password, ...employeeWithoutPassword } = newEmployee;
    
    return { success: true, data: employeeWithoutPassword };
  } catch (error) {
    console.error('Error creating employees:', error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับอัปเดตข้อมูลพนักงาน
 */
export async function updateEmployee(id, data) {
  try {
    // ตรวจสอบว่ามีอีเมลซ้ำหรือไม่ (ถ้ามีการเปลี่ยนอีเมล)
    if (data.email) {
      const existingEmployee = await prisma.employees.findFirst({
        where: {
          email: data.email,
          id: { not: id },
        },
      });
      
      if (existingEmployee) {
        return { success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' };
      }
    }
    
    // ตรวจสอบว่ามีรหัสพนักงานซ้ำหรือไม่ (ถ้ามีการเปลี่ยนรหัสพนักงาน)
    if (data.employee_id) {
      const existingEmployeeId = await prisma.employees.findFirst({
        where: {
          employee_id: data.employee_id,
          id: { not: id },
        },
      });
      
      if (existingEmployeeId) {
        return { success: false, message: 'รหัสพนักงานนี้ถูกใช้งานแล้ว' };
      }
    }
    
    // เตรียมข้อมูลสำหรับอัปเดต
    const updateData = {};
    
    // เพิ่มเฉพาะฟิลด์ที่ส่งมา
    if (data.employee_id !== undefined) updateData.employee_id = data.employee_id;
    if (data.first_name !== undefined) updateData.first_name = data.first_name;
    if (data.last_name !== undefined) updateData.last_name = data.last_name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.departments !== undefined) updateData.departments = data.departments;
    if (data.team_id !== undefined) updateData.team_id = data.team_id;
    if (data.teams !== undefined) updateData.teams = data.teams;
    if (data.hire_date !== undefined) updateData.hire_date = new Date(data.hire_date);
    if (data.role !== undefined) updateData.role = data.role;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.image !== undefined) updateData.image = data.image;
    
    // อัปเดตพนักงาน
    const updatedEmployee = await prisma.employees.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        employee_id: true,
        first_name: true,
        last_name: true,
        email: true,
        position: true,
        departments: true,
        hire_date: true,
        role: true,
        is_active: true,
        image: true,
        created_at: true,
        updated_at: true,
        password: false,
      },
    });
    
    return { success: true, data: updatedEmployee };
  } catch (error) {
    console.error(`Error updating employee with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับลบข้อมูลพนักงาน
 */
export async function deleteEmployee(id) {
  try {
    // ตรวจสอบว่ามีการลาหรือการทำงานล่วงเวลาที่เกี่ยวข้องหรือไม่
    const leaves = await prisma.leaves.findMany({
      where: { employee_id: id },
    });
    
    const overtimes = await prisma.overtimes.findMany({
      where: { employee_id: id },
    });
    
    // ถ้ามีข้อมูลที่เกี่ยวข้อง ให้ทำการอัปเดตสถานะเป็นไม่ใช้งานแทนการลบ
    if (leaves.length > 0 || overtimes.length > 0) {
      const updatedEmployee = await prisma.employees.update({
        where: { id },
        data: { is_active: false },
        select: {
          id: true,
          employee_id: true,
          first_name: true,
          last_name: true,
          email: true,
          position: true,
          departments: true,
          hire_date: true,
          role: true,
          is_active: true,
          image: true,
          created_at: true,
          updated_at: true,
        },
      });
      
      return {
        success: true,
        data: updatedEmployee,
        message: 'พนักงานถูกปรับสถานะเป็นไม่ใช้งานแล้ว เนื่องจากมีข้อมูลที่เกี่ยวข้อง',
      };
    }
    
    // ถ้าไม่มีข้อมูลที่เกี่ยวข้อง ให้ลบได้เลย
    await prisma.employees.delete({
      where: { id },
    });
    
    return { success: true, message: 'ลบพนักงานสำเร็จ' };
  } catch (error) {
    console.error(`Error deleting employee with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับเปลี่ยนรหัสผ่านพนักงาน
 */
export async function updateEmployeePassword(id, hashedPassword) {
  try {
    await prisma.employees.update({
      where: { id },
      data: { password: hashedPassword },
    });
    
    return { success: true, message: 'อัปเดตรหัสผ่านสำเร็จ' };
  } catch (error) {
    console.error(`Error updating password for employee with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลการลาทั้งหมด
 */
export async function getLeaves(options = {}) {
  try {
    const { employee_id, status, start_date, end_date } = options;
    
    // สร้างเงื่อนไขการค้นหา
    const whereCondition = {};
    
    // เพิ่มเงื่อนไขการค้นหาตาม ID พนักงาน
    if (employee_id) {
      whereCondition.employee_id = employee_id;
    }
    
    // เพิ่มเงื่อนไขการค้นหาตามสถานะ
    if (status) {
      whereCondition.status = status;
    }
    
    // เพิ่มเงื่อนไขการค้นหาตามช่วงวันที่
    if (start_date && end_date) {
      whereCondition.OR = [
        {
          start_date: {
            gte: new Date(start_date),
            lte: new Date(end_date)
          }
        },
        {
          end_date: {
            gte: new Date(start_date),
            lte: new Date(end_date)
          }
        },
        {
          AND: [
            { start_date: { lte: new Date(start_date) } },
            { end_date: { gte: new Date(end_date) } }
          ]
        }
      ];
    } else if (start_date) {
      whereCondition.start_date = {
        gte: new Date(start_date)
      };
    } else if (end_date) {
      whereCondition.end_date = {
        lte: new Date(end_date)
      };
    }
    
    // ดึงข้อมูลการลาพร้อมข้อมูลพนักงาน
    const leaves = await prisma.leaves.findMany({
      where: whereCondition,
      include: {
        employees: {
          select: {
            id: true,
            employee_id: true,
            first_name: true,
            last_name: true,
            email: true,
            position: true,
            departments: true,
            role: true,
            image: true,
            team_id: true
          }
        },
        leave_approvals: {
          orderBy: {
            created_at: 'desc'
          },
          include: {
            employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
    const transformedLeaves = leaves.map(leave => {
      // แปลงข้อมูลพนักงาน
      const formattedEmployee = leave.employees ? {
        id: leave.employees.id,
        employeeId: leave.employees.employee_id,
        firstName: leave.employees.first_name,
        lastName: leave.employees.last_name,
        email: leave.employees.email,
        position: leave.employees.position,
        departments: leave.employees.departments,
        role: leave.employees.role,
        image: leave.employees.image,
        teamId: leave.employees.team_id
      } : null;
      
      // แปลงข้อมูลประวัติการอนุมัติ
      const formattedApprovals = leave.leave_approvals ? leave.leave_approvals.map(approval => {
        const formattedApprovalEmployee = approval.employees ? {
          id: approval.employees.id,
          firstName: approval.employees.first_name,
          lastName: approval.employees.last_name,
          position: approval.employees.position,
          role: approval.employees.role
        } : null;
        
        return {
          id: approval.id,
          type: approval.type,
          status: approval.status,
          reason: approval.reason,
          comment: approval.comment,
          employeeId: approval.employee_id,
          createdAt: approval.created_at,
          updatedAt: approval.updated_at,
          employees: formattedApprovalEmployee
        };
      }) : [];
      
      // ค้นหา approval ล่าสุดตามประเภท
      const lastApproval = leave.leave_approvals && leave.leave_approvals.length > 0 ? leave.leave_approvals[0] : null;
      const approveAction = leave.leave_approvals ? leave.leave_approvals.find(a => a.type === 'approve' && a.status === 'completed') : null;
      const rejectAction = leave.leave_approvals ? leave.leave_approvals.find(a => a.type === 'reject' && a.status === 'completed') : null;
      const requestCancelAction = leave.leave_approvals ? leave.leave_approvals.find(a => a.type === 'request_cancel' && a.status === 'completed') : null;
      const approveCancelAction = leave.leave_approvals ? leave.leave_approvals.find(a => a.type === 'approve_cancel' && a.status === 'completed') : null;
      const rejectCancelAction = leave.leave_approvals ? leave.leave_approvals.find(a => a.type === 'reject_cancel' && a.status === 'completed') : null;
      
      // ตรวจสอบสถานะล่าสุดจาก transaction log
      const isLatestRequestCancel = lastApproval && lastApproval.type === 'request_cancel';
      
      // สถานะยกเลิก
      let cancelStatusValue = null;
      if (approveCancelAction) {
        cancelStatusValue = 'approved';
      } else if (isLatestRequestCancel && !approveCancelAction && !rejectCancelAction) {
        cancelStatusValue = 'waiting_for_approve';
      } else if (rejectCancelAction) {
        cancelStatusValue = 'rejected';
      }
      
      // ประมวลผลสถานะสำหรับแสดงผล
      let statusText = leave.status;
      let statusDisplay = "";
      
      if (statusText === 'waiting_for_approve') {
        statusDisplay = 'รออนุมัติ';
      } else if (statusText === 'approved') {
        statusDisplay = 'อนุมัติ';
      } else if (statusText === 'rejected') {
        statusDisplay = 'ไม่อนุมัติ';
      } else if (statusText === 'canceled') {
        statusDisplay = 'ยกเลิกแล้ว';
      }
      
      // สร้างเวอร์ชันของข้อมูลที่เข้ากันได้กับโค้ดเดิม
      const transformed = {
        id: leave.id,
        employeeId: leave.employee_id,
        startDate: leave.start_date,
        endDate: leave.end_date,
        reason: leave.reason,
        leaveType: leave.leave_type,
        status: leave.status,
        statusText: statusDisplay,
        leaveFormat: leave.leave_format || 'เต็มวัน',
        leaveDays: leave.total_days || 0, // เพิ่ม leaveDays สำหรับแสดงผล
        totalDays: leave.total_days || 0,
        attachments: leave.attachments || [],
        createdAt: leave.created_at,
        updatedAt: leave.updated_at,
        
        // ข้อมูลพนักงานและประวัติการอนุมัติ
        employee: formattedEmployee,
        approvals: formattedApprovals,
        
        // สำหรับการอนุมัติ/ไม่อนุมัติปกติ
        approvedById: approveAction?.employee_id || rejectAction?.employee_id || null,
        approvedAt: approveAction?.created_at || rejectAction?.created_at || null,
        comment: approveAction?.comment || rejectAction?.comment || null,
        approvedBy: approveAction?.employees ? {
          id: approveAction.employees.id,
          firstName: approveAction.employees.first_name,
          lastName: approveAction.employees.last_name,
          position: approveAction.employees.position,
          role: approveAction.employees.role
        } : null,
        
        // สำหรับการขอยกเลิก
        cancelRequestedAt: requestCancelAction?.created_at || null,
        cancelReason: requestCancelAction?.reason || null,
        cancelRequestBy: requestCancelAction?.employees ? {
          id: requestCancelAction.employees.id,
          firstName: requestCancelAction.employees.first_name,
          lastName: requestCancelAction.employees.last_name,
          position: requestCancelAction.employees.position,
          role: requestCancelAction.employees.role
        } : null,
        
        // สำหรับการตอบกลับการขอยกเลิก
        cancelStatus: cancelStatusValue,
        cancelResponseAt: approveCancelAction?.created_at || rejectCancelAction?.created_at || null,
        cancelResponseComment: approveCancelAction?.comment || rejectCancelAction?.comment || null,
        cancelResponseBy: approveCancelAction?.employees ? {
          id: approveCancelAction.employees.id,
          firstName: approveCancelAction.employees.first_name,
          lastName: approveCancelAction.employees.last_name,
          position: approveCancelAction.employees.position,
          role: approveCancelAction.employees.role
        } : rejectCancelAction?.employees ? {
          id: rejectCancelAction.employees.id,
          firstName: rejectCancelAction.employees.first_name,
          lastName: rejectCancelAction.employees.last_name,
          position: rejectCancelAction.employees.position,
          role: rejectCancelAction.employees.role
        } : null,
        
        // สถานะการขอยกเลิก
        isDuringCancel: requestCancelAction && !approveCancelAction && !rejectCancelAction,
        isCancelled: !!approveCancelAction,
      };
      
      return transformed;
    });
    
    return { success: true, data: transformedLeaves };
  } catch (error) {
    console.error('Error fetching leaves:', error);
    return { success: false, message: error.message, connectionError: true };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลการลาตาม ID
 */
export async function getLeaveById(id) {
  try {
    const leave = await prisma.leaves.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            employee_id: true,
            first_name: true,
            last_name: true,
            email: true,
            position: true,
            departments: true,
            role: true,
            image: true,
            team_id: true
          }
        },
        leave_approvals: {
          orderBy: {
            created_at: 'desc'
          },
          include: {
            employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                role: true
              }
            }
          }
        }
      }
    });
    
    if (!leave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    // แปลงข้อมูลพนักงาน
    const formattedEmployee = leave.employees ? {
      id: leave.employees.id,
      employeeId: leave.employees.employee_id,
      firstName: leave.employees.first_name,
      lastName: leave.employees.last_name,
      email: leave.employees.email,
      position: leave.employees.position,
      departments: leave.employees.departments,
      role: leave.employees.role,
      image: leave.employees.image,
      teamId: leave.employees.team_id
    } : null;
    
    // แปลงข้อมูลประวัติการอนุมัติ
    const formattedApprovals = leave.leave_approvals ? leave.leave_approvals.map(approval => {
      const formattedApprovalEmployee = approval.employees ? {
        id: approval.employees.id,
        firstName: approval.employees.first_name,
        lastName: approval.employees.last_name,
        position: approval.employees.position,
        role: approval.employees.role
      } : null;
      
      return {
        id: approval.id,
        type: approval.type,
        status: approval.status,
        reason: approval.reason,
        comment: approval.comment,
        employeeId: approval.employee_id,
        createdAt: approval.created_at,
        updatedAt: approval.updated_at,
        employees: formattedApprovalEmployee
      };
    }) : [];
    
    // ค้นหา approval ล่าสุดตามประเภท
    const lastApproval = leave.leave_approvals && leave.leave_approvals.length > 0 ? leave.leave_approvals[0] : null;
    const approveAction = leave.leave_approvals ? leave.leave_approvals.find(a => a.type === 'approve' && a.status === 'completed') : null;
    const rejectAction = leave.leave_approvals ? leave.leave_approvals.find(a => a.type === 'reject' && a.status === 'completed') : null;
    const requestCancelAction = leave.leave_approvals ? leave.leave_approvals.find(a => a.type === 'request_cancel' && a.status === 'completed') : null;
    const approveCancelAction = leave.leave_approvals ? leave.leave_approvals.find(a => a.type === 'approve_cancel' && a.status === 'completed') : null;
    const rejectCancelAction = leave.leave_approvals ? leave.leave_approvals.find(a => a.type === 'reject_cancel' && a.status === 'completed') : null;
    
    // สถานะยกเลิก
    let cancelStatusValue = null;
    if (approveCancelAction) {
      cancelStatusValue = 'approved';
    } else if (requestCancelAction && !approveCancelAction && !rejectCancelAction) {
      cancelStatusValue = 'waiting_for_approve';
    } else if (rejectCancelAction) {
      cancelStatusValue = 'rejected';
    }
    
    // ประมวลผลสถานะสำหรับแสดงผล
    let statusText = leave.status;
    let statusDisplay = "";
    
    if (statusText === 'waiting_for_approve') {
      statusDisplay = 'รออนุมัติ';
    } else if (statusText === 'approved') {
      statusDisplay = 'อนุมัติ';
    } else if (statusText === 'rejected') {
      statusDisplay = 'ไม่อนุมัติ';
    } else if (statusText === 'canceled') {
      statusDisplay = 'ยกเลิกแล้ว';
    }
    
    // สร้างข้อมูลสำหรับส่งกลับ
    const transformedLeave = {
      id: leave.id,
      employeeId: leave.employee_id,
      startDate: leave.start_date,
      endDate: leave.end_date,
      reason: leave.reason,
      leaveType: leave.leave_type,
      status: leave.status,
      statusText: statusDisplay,
      leaveFormat: leave.leave_format || 'เต็มวัน',
      leaveDays: leave.total_days || 0, // เพิ่ม leaveDays สำหรับแสดงผล
      totalDays: leave.total_days || 0,
      attachments: leave.attachments || [],
      createdAt: leave.created_at,
      updatedAt: leave.updated_at,
      
      // ข้อมูลพนักงานและประวัติการอนุมัติ
      employee: formattedEmployee,
      approvals: formattedApprovals,
      
      // สำหรับการอนุมัติ/ไม่อนุมัติปกติ
      approvedById: approveAction?.employee_id || rejectAction?.employee_id || null,
      approvedAt: approveAction?.created_at || rejectAction?.created_at || null,
      comment: approveAction?.comment || rejectAction?.comment || null,
      approvedBy: approveAction?.employees ? {
        id: approveAction.employees.id,
        firstName: approveAction.employees.first_name,
        lastName: approveAction.employees.last_name,
        position: approveAction.employees.position,
        role: approveAction.employees.role
      } : null,
      
      // สำหรับการขอยกเลิก
      cancelRequestedAt: requestCancelAction?.created_at || null,
      cancelReason: requestCancelAction?.reason || null,
      cancelRequestBy: requestCancelAction?.employees ? {
        id: requestCancelAction.employees.id,
        firstName: requestCancelAction.employees.first_name,
        lastName: requestCancelAction.employees.last_name,
        position: requestCancelAction.employees.position,
        role: requestCancelAction.employees.role
      } : null,
      
      // สำหรับการตอบกลับการขอยกเลิก
      cancelStatus: cancelStatusValue,
      cancelResponseAt: approveCancelAction?.created_at || rejectCancelAction?.created_at || null,
      cancelResponseComment: approveCancelAction?.comment || rejectCancelAction?.comment || null,
      cancelResponseBy: approveCancelAction?.employees ? {
        id: approveCancelAction.employees.id,
        firstName: approveCancelAction.employees.first_name,
        lastName: approveCancelAction.employees.last_name,
        position: approveCancelAction.employees.position,
        role: approveCancelAction.employees.role
      } : rejectCancelAction?.employees ? {
        id: rejectCancelAction.employees.id,
        firstName: rejectCancelAction.employees.first_name,
        lastName: rejectCancelAction.employees.last_name,
        position: rejectCancelAction.employees.position,
        role: rejectCancelAction.employees.role
      } : null,
      
      // สถานะการขอยกเลิก
      isDuringCancel: requestCancelAction && !approveCancelAction && !rejectCancelAction,
      isCancelled: !!approveCancelAction,
    };
    
    return { success: true, data: transformedLeave };
  } catch (error) {
    console.error('Error fetching leave by ID:', error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับเพิ่มข้อมูลการลา
 */
export async function createLeave(data) {
  try {
    // ตรวจสอบว่าพนักงานมีอยู่จริงหรือไม่
    const employee = await prisma.employees.findUnique({
      where: { id: data.employee_id },
    });
    
    if (!employee) {
      return { success: false, message: 'ไม่พบข้อมูลพนักงาน' };
    }
    
    // แปลงสถานะให้เป็นแบบใหม่
    let newStatus = 'waiting_for_approve';
    if (data.status) {
      if (data.status === 'รออนุมัติ') newStatus = 'waiting_for_approve';
      else if (data.status === 'อนุมัติ') newStatus = 'approved';
      else if (data.status === 'ไม่อนุมัติ') newStatus = 'rejected';
      else if (data.status === 'ยกเลิกแล้ว') newStatus = 'canceled';
    }
    
    // ตรวจสอบและแปลงค่า attachments ให้เป็น array เสมอ
    const attachments = Array.isArray(data.attachments) ? data.attachments : 
                        (data.attachments ? [data.attachments] : []);
    
    // สร้างข้อมูลการลาใหม่
    const newLeave = await prisma.leaves.create({
      data: {
        id: crypto.randomUUID(),
        employee_id: data.employee_id,
        leave_type: data.leave_type,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        reason: data.reason,
        status: newStatus,
        leave_format: data.leave_format || 'เต็มวัน',
        total_days: data.total_days || 0,
        attachments: attachments,
        updated_at: new Date(),
      },
    });
    
    // ถ้ามีข้อมูลการอนุมัติ สร้าง approval record
    if (data.approvedById && data.approvedAt) {
      await prisma.leave_approvals.create({
        data: {
          leave_id: newLeave.id,
          employee_id: data.approvedById,
          type: data.status === 'อนุมัติ' ? 'approve' : 'reject',
          status: 'completed',
          comment: data.comment || null,
          created_at: new Date(data.approvedAt),
        },
      });
    }
    
    // ดึงข้อมูลการลาพร้อมข้อมูลเพิ่มเติม
    const fullLeave = await getLeaveById(newLeave.id);
    
    return { success: true, data: fullLeave.data };
  } catch (error) {
    console.error('Error creating leaves:', error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับอัปเดตข้อมูลการลา
 */
export async function updateLeave(id, data) {
  try {
    // ตรวจสอบว่ามีข้อมูลการลาหรือไม่
    const existingLeave = await prisma.leaves.findUnique({
      where: { id },
      include: {
        leave_approvals: true
      }
    });
    
    if (!existingLeave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    const updateData = {};
    const transactions = [];
    
    // ข้อมูลพื้นฐานที่อัปเดตได้เสมอ
    if (data.leave_type !== undefined) updateData.leave_type = data.leave_type;
    if (data.start_date !== undefined) updateData.start_date = new Date(data.start_date);
    if (data.end_date !== undefined) updateData.end_date = new Date(data.end_date);
    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.leave_format !== undefined) updateData.leave_format = data.leave_format;
    if (data.total_days !== undefined) updateData.total_days = data.total_days;
    if (data.attachments !== undefined) updateData.attachments = data.attachments;
    
    // ถ้ามีการเปลี่ยนสถานะ
    if (data.status !== undefined) {
      // แปลงสถานะเดิมเป็นสถานะใหม่
      let newStatus = data.status;
      if (data.status === 'รออนุมัติ') newStatus = 'waiting_for_approve';
      else if (data.status === 'อนุมัติ') newStatus = 'approved';
      else if (data.status === 'ไม่อนุมัติ') newStatus = 'rejected';
      else if (data.status === 'ยกเลิกแล้ว') newStatus = 'canceled';
      
      updateData.status = newStatus;
      
      // ถ้าสถานะเป็นอนุมัติหรือไม่อนุมัติ และยังไม่เคยมีการอนุมัติก่อนหน้านี้
      if ((data.status === 'approved' || data.status === 'rejected' || 
           data.status === 'อนุมัติ' || data.status === 'ไม่อนุมัติ') && 
          data.approvedById) {
        
        // ตรวจสอบว่ามีการอนุมัติหรือปฏิเสธไปแล้วหรือไม่
        const hasApproveOrReject = existingLeave.leave_approvals.some(
          a => (a.type === 'approve' || a.type === 'reject') && a.status === 'completed'
        );
        
        // ถ้ายังไม่มีการอนุมัติหรือปฏิเสธ ให้สร้าง approval record ใหม่
        if (!hasApproveOrReject) {
          const type = (data.status === 'approved' || data.status === 'อนุมัติ') ? 'approve' : 'reject';
          
          transactions.push(
            prisma.leave_approvals.create({
              data: {
                leave_id: id,
                employee_id: data.approvedById,
                type,
                status: 'completed',
                comment: data.comment || null,
                created_at: data.approvedAt ? new Date(data.approvedAt) : new Date(),
              },
            })
          );
        }
      }
    }
    
    // อัปเดตข้อมูลการลาและสร้าง approval records ถ้ามี
    const updatedLeave = await prisma.$transaction(async (tx) => {
      // อัปเดตข้อมูลการลา
      const updated = await tx.leaves.update({
        where: { id },
        data: updateData,
      });
      
      // ทำรายการอื่นๆ ที่เกี่ยวข้อง (เช่น สร้าง approval)
      for (const txn of transactions) {
        await txn;
      }
      
      return updated;
    });
    
    // ดึงข้อมูลการลาที่อัปเดตแล้วพร้อมข้อมูลเพิ่มเติม
    const fullLeave = await getLeaveById(id);
    
    return { success: true, data: fullLeave.data };
  } catch (error) {
    console.error(`Error updating leave with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับขอยกเลิกการลา
 */
export async function requestCancelLeave(id, data) {
  try {
    console.log('Request Cancel Leave Input:', { 
      id, 
      dataKeys: data ? Object.keys(data) : [], 
      requestedById: data?.requestedById,
      hasData: !!data
    });
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!data || !data.requestedById) {
      console.error('Missing required field: requestedById');
      return { 
        success: false, 
        message: 'ข้อมูลไม่ครบถ้วน กรุณาระบุผู้ขอยกเลิก' 
      };
    }
    
    // ตรวจสอบว่ามีข้อมูลการลาหรือไม่
    const existingLeave = await prisma.leaves.findUnique({
      where: { id },
      include: {
        employees: true,
        leave_approvals: {
          orderBy: { created_at: 'desc' }
        }
      }
    });
    
    if (!existingLeave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    console.log('Existing Leave:', {
      id: existingLeave.id,
      status: existingLeave.status,
      numApprovals: existingLeave.leave_approvals?.length || 0
    });
    
    // ตรวจสอบว่าเป็นการลาที่อนุมัติแล้วหรือไม่
    if (existingLeave.status !== 'อนุมัติ' && existingLeave.status !== 'approved') {
      return { 
        success: false, 
        message: 'สามารถขอยกเลิกได้เฉพาะการลาที่อนุมัติแล้วเท่านั้น',
        currentStatus: existingLeave.status 
      };
    }
    
    // ตรวจสอบว่ามีคำขอยกเลิกที่ยังรออนุมัติอยู่แล้วหรือไม่
    existingLeave.approvals = existingLeave.leave_approvals || [];
    const pendingCancelRequest = existingLeave.leave_approvals?.some(a => 
      a.type === 'request_cancel' && 
      a.status === 'completed' && 
      !existingLeave.leave_approvals.some(b => 
        (b.type === 'approve_cancel' || b.type === 'reject_cancel') && 
        b.status === 'completed' && 
        b.created_at > a.created_at
      )
    );
    
    if (pendingCancelRequest) {
      console.log('Found pending cancel request');
      return { 
        success: false, 
        message: 'มีคำขอยกเลิกการลานี้ที่ยังรออนุมัติอยู่แล้ว'
      };
    }
    
    try {
      // สร้างคำขอการยกเลิกใน LeaveApproval
      const approvalData = {
        leave_id: id,
        employee_id: data.requestedById,
        type: 'request_cancel',
        status: 'completed',
        reason: data.cancelReason || null
      };
      
      console.log('Creating approval with data:', approvalData);
      
      const approval = await prisma.leave_approvals.create({
        data: approvalData
      });
      
      console.log('Created approval:', {
        id: approval.id,
        type: approval.type,
        employee_id: approval.employee_id
      });
      
      // ดึงข้อมูลการลาที่อัปเดตแล้วพร้อมข้อมูลเพิ่มเติม
      const fullLeave = await prisma.leaves.findUnique({
        where: { id },
        include: {
          employees: true,
          leave_approvals: {
            orderBy: { created_at: 'desc' }
          }
        }
      });
      
      console.log('Successfully created cancel request');
      
      return { 
        success: true, 
        data: fullLeave,
        message: 'ส่งคำขอยกเลิกการลาเรียบร้อยแล้ว กรุณารอการอนุมัติ'
      };
    } catch (dbError) {
      console.error(`Database error creating cancel request:`, dbError);
      return { 
        success: false, 
        message: `เกิดข้อผิดพลาดในการสร้างคำขอยกเลิก: ${dbError.message}` 
      };
    }
  } catch (error) {
    console.error(`Error requesting cancel leave with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับอนุมัติการลา
 */
export async function approveLeave(id, approverId, comment = null) {
  try {
    // ตรวจสอบว่ามีข้อมูลการลาหรือไม่
    const existingLeave = await prisma.leaves.findUnique({
      where: { id }
    });
    
    if (!existingLeave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    // ตรวจสอบว่าเป็นการลาที่รออนุมัติหรือไม่
    if (existingLeave.status !== 'waiting_for_approve') {
      return { success: false, message: 'ไม่สามารถอนุมัติการลานี้ได้ เนื่องจากไม่ได้อยู่ในสถานะรออนุมัติ' };
    }
    
    // อัปเดตสถานะการลาและสร้าง approval record
    const [updatedLeave, newApproval] = await prisma.$transaction([
      prisma.leaves.update({
        where: { id },
        data: {
          status: 'approved',
        },
      }),
      prisma.leave_approvals.create({
        data: {
          leave_id: id,
          employee_id: approverId,
          type: 'approve',
          status: 'completed',
          comment: comment,
        },
      })
    ]);
    
    // ดึงข้อมูลการลาที่อัปเดตแล้วพร้อมข้อมูลเพิ่มเติม
    const fullLeave = await getLeaveById(id);
    
    return { success: true, data: fullLeave.data, message: 'อนุมัติการลาเรียบร้อยแล้ว' };
  } catch (error) {
    console.error(`Error approving leave with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับไม่อนุมัติการลา
 */
export async function rejectLeave(id, approverId, comment = null) {
  try {
    // ตรวจสอบว่ามีข้อมูลการลาหรือไม่
    const existingLeave = await prisma.leaves.findUnique({
      where: { id }
    });
    
    if (!existingLeave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    // ตรวจสอบว่าเป็นการลาที่รออนุมัติหรือไม่
    if (existingLeave.status !== 'waiting_for_approve') {
      return { success: false, message: 'ไม่สามารถปฏิเสธการลานี้ได้ เนื่องจากไม่ได้อยู่ในสถานะรออนุมัติ' };
    }
    
    // อัปเดตสถานะการลาและสร้าง approval record
    const [updatedLeave, newApproval] = await prisma.$transaction([
      prisma.leaves.update({
        where: { id },
        data: {
          status: 'rejected',
        },
      }),
      prisma.leave_approvals.create({
        data: {
          leave_id: id,
          employee_id: approverId,
          type: 'reject',
          status: 'completed',
          comment: comment,
        },
      })
    ]);
    
    // ดึงข้อมูลการลาที่อัปเดตแล้วพร้อมข้อมูลเพิ่มเติม
    const fullLeave = await getLeaveById(id);
    
    return { success: true, data: fullLeave.data, message: 'ปฏิเสธการลาเรียบร้อยแล้ว' };
  } catch (error) {
    console.error(`Error rejecting leave with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับอนุมัติการยกเลิกการลา (โครงสร้างใหม่ใช้ LeaveApproval)
 */
export async function approveCancelLeave(id, approverId, comment = null) {
  try {
    // ตรวจสอบว่ามีข้อมูลการลาหรือไม่
    const existingLeave = await prisma.leaves.findUnique({
      where: { id },
      include: {
        employees: true,
        leave_approvals: {
          where: { 
            type: 'request_cancel',
            status: 'completed'
          },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });
    
    if (!existingLeave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    // ตรวจสอบว่ามีคำขอยกเลิกหรือไม่
    if (!existingLeave.leave_approvals || existingLeave.leave_approvals.length === 0) {
      return { success: false, message: 'ไม่พบคำขอยกเลิกการลานี้' };
    }
    
    // ตรวจสอบว่าสถานะการลาเป็น "อนุมัติ" หรือไม่
    if (existingLeave.status !== 'อนุมัติ' && existingLeave.status !== 'approved') {
      return { success: false, message: 'สามารถอนุมัติการยกเลิกได้เฉพาะการลาที่อนุมัติแล้วเท่านั้น' };
    }
    
    // อัปเดตสถานะการลาและสร้าง approval record
    const [updatedLeave, newApproval] = await prisma.$transaction([
      prisma.leaves.update({
        where: { id },
        data: {
          status: 'canceled',
        },
      }),
      prisma.leave_approvals.create({
        data: {
          leave_id: id,
          employee_id: approverId,
          type: 'approve_cancel',
          status: 'completed',
          comment: comment,
        },
      })
    ]);
    
    // ดึงข้อมูลการลาที่อัปเดตแล้วพร้อมข้อมูลเพิ่มเติม
    const fullLeave = await getLeaveById(id);
    
    return { success: true, data: fullLeave.data, message: 'อนุมัติการยกเลิกการลาเรียบร้อยแล้ว' };
  } catch (error) {
    console.error(`Error approving cancel request for leave with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับไม่อนุมัติการยกเลิกการลา (โครงสร้างใหม่ใช้ LeaveApproval)
 */
export async function rejectCancelLeave(id, approverId, comment = null) {
  try {
    // ตรวจสอบว่ามีข้อมูลการลาหรือไม่
    const existingLeave = await prisma.leaves.findUnique({
      where: { id },
      include: {
        employees: true,
        leave_approvals: {
          where: { 
            type: 'request_cancel',
            status: 'completed'
          },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });
    
    if (!existingLeave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    // ตรวจสอบว่ามีคำขอยกเลิกหรือไม่
    if (!existingLeave.leave_approvals || existingLeave.leave_approvals.length === 0) {
      return { success: false, message: 'ไม่พบคำขอยกเลิกการลานี้' };
    }
    
    // ตรวจสอบว่าสถานะการลาเป็น "อนุมัติ" หรือไม่
    if (existingLeave.status !== 'อนุมัติ' && existingLeave.status !== 'approved') {
      return { success: false, message: 'สามารถปฏิเสธการยกเลิกได้เฉพาะการลาที่อนุมัติแล้วเท่านั้น' };
    }
    
    // สร้าง approval record สำหรับการไม่อนุมัติการยกเลิก
    const newApproval = await prisma.leave_approvals.create({
      data: {
        leave_id: id,
        employee_id: approverId,
        type: 'reject_cancel',
        status: 'completed',
        comment: comment,
      },
    });
    
    // ดึงข้อมูลการลาที่อัปเดตแล้วพร้อมข้อมูลเพิ่มเติม
    const fullLeave = await getLeaveById(id);
    
    return { success: true, data: fullLeave.data, message: 'ปฏิเสธการยกเลิกการลาเรียบร้อยแล้ว' };
  } catch (error) {
    console.error(`Error rejecting cancel request for leave with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลการทำงานล่วงเวลาทั้งหมด
 */
export async function getOvertimes(employeeId = null, startDate = null, endDate = null, summary = false) {
  try {
    let where = {};
    if (employeeId) {
      where.employee_id = employeeId;
    }
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.date = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.date = {
        lte: new Date(endDate),
      };
    }
    
    // ถ้าต้องการดูสรุปรายเดือน
    if (summary) {
      const result = await prisma.$queryRaw`
        SELECT 
          EXTRACT(YEAR FROM date) as year, 
          EXTRACT(MONTH FROM date) as month, 
          SUM(total_hours) as total_hours,
          COUNT(*) as count,
          STRING_AGG(DISTINCT status, ', ') as statuses
        FROM overtimes
        WHERE employee_id = ${employee_id}
        GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
        ORDER BY year DESC, month DESC
      `;
      
      return { success: true, data: result };
    }
    
    // ดึงข้อมูลการทำงานล่วงเวลาทั้งหมด
    const overtimes = await prisma.overtimes.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
      include: {
        employees: {
          select: {
            id: true,
            employee_id: true,
            first_name: true,
            last_name: true,
            position: true,
            departments: true,
            department_id: true,
            email: true,
            role: true,
            image: true,
            team_id: true,
          },
        },
        overtime_approvals: {
          orderBy: {
            created_at: 'desc'
          },
          include: {
            employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                role: true
              }
            }
          }
        }
      },
    });
    
    // แปลงข้อมูลเพื่อความเข้ากันได้กับโค้ดเดิม
    const transformedOvertimes = overtimes.map(overtime => {
      // สร้างข้อมูลเพิ่มเติมจาก approvals
      overtime.approvals = overtime.overtime_approvals || [];
      overtime.approvals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      const approveAction = overtime.approvals.find(a => a.type === 'approve' && a.status === 'completed');
      const rejectAction = overtime.approvals.find(a => a.type === 'reject' && a.status === 'completed');
      const requestCancelAction = overtime.approvals.find(a => a.type === 'request_cancel' && a.status === 'completed');
      const approveCancelAction = overtime.approvals.find(a => a.type === 'approve_cancel' && a.status === 'completed');
      const rejectCancelAction = overtime.approvals.find(a => a.type === 'reject_cancel' && a.status === 'completed');
      
      // กำหนด cancelStatus เป็นภาษาอังกฤษ
      const cancelStatus = requestCancelAction && !approveCancelAction && !rejectCancelAction ? 'waiting_for_approve' :
                           approveCancelAction ? 'approved' :
                           null;
      
      // สร้างข้อมูลเพิ่มเติมเพื่อความเข้ากันได้กับ UI เดิม
      return {
        ...overtime,
        // ข้อมูลการอนุมัติ
        approvedBy: approveAction ? approveAction.employees : null,
        approvedAt: approveAction ? approveAction.created_at : null,
        comment: approveAction ? approveAction.comment : (rejectAction ? rejectAction.comment : null),
        // ข้อมูลการยกเลิก
        cancelStatus: cancelStatus,
        cancelReason: requestCancelAction ? requestCancelAction.reason : null,
        cancelRequestBy: requestCancelAction ? requestCancelAction.employees : null,
        cancelRequestAt: requestCancelAction ? requestCancelAction.created_at : null,
        cancelResponseBy: approveCancelAction ? approveCancelAction.employees : 
                         (rejectCancelAction ? rejectCancelAction.employees : null),
        cancelResponseAt: approveCancelAction ? approveCancelAction.created_at :
                         (rejectCancelAction ? rejectCancelAction.created_at : null),
        cancelResponseComment: approveCancelAction ? approveCancelAction.comment :
                             (rejectCancelAction ? rejectCancelAction.comment : null),
        isCancelled: approveCancelAction ? true : false
      };
    });
    
    return { success: true, data: transformedOvertimes };
  } catch (error) {
    console.error('Error fetching overtimes:', error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลการทำงานล่วงเวลาตาม ID
 */
export async function getOvertimeById(id) {
  try {
    const overtime = await prisma.overtimes.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            employee_id: true,
            first_name: true,
            last_name: true,
            email: true,
            position: true,
            departments: true,
            role: true,
            image: true,
            team_id: true
          }
        },
        overtime_approvals: {
          orderBy: {
            created_at: 'desc'
          },
          include: {
            employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                role: true
              }
            }
          }
        }
      }
    });
    
    if (!overtime) {
      return { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' };
    }
    
    // เรียงลำดับ approvals ตาม createdAt ใหม่ ให้ล่าสุดอยู่ก่อน
    overtime.approvals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const lastApproval = overtime.approvals[0] || null;
    const approveAction = overtime.approvals.find(a => a.type === 'approve' && a.status === 'completed');
    const rejectAction = overtime.approvals.find(a => a.type === 'reject' && a.status === 'completed');
    const requestCancelAction = overtime.approvals.find(a => a.type === 'request_cancel' && a.status === 'completed');
    const approveCancelAction = overtime.approvals.find(a => a.type === 'approve_cancel' && a.status === 'completed');
    const rejectCancelAction = overtime.approvals.find(a => a.type === 'reject_cancel' && a.status === 'completed');
    
    // กำหนด cancelStatus เป็นภาษาอังกฤษ
    const cancelStatus = requestCancelAction && !approveCancelAction && !rejectCancelAction ? 'waiting_for_approve' :
                 approveCancelAction ? 'approved' :
                 null;
    
    // สร้างข้อมูลเพิ่มเติมเพื่อความเข้ากันได้กับ UI เดิม
    const transformedOvertime = {
      ...overtime,
      // ข้อมูลการอนุมัติ
      approvedBy: approveAction ? approveAction.employees : null,
      approvedAt: approveAction ? approveAction.created_at : null,
      comment: approveAction ? approveAction.comment : (rejectAction ? rejectAction.comment : null),
      // ข้อมูลการยกเลิก
      cancelStatus: cancelStatus,
      cancelReason: requestCancelAction ? requestCancelAction.reason : null,
      cancelRequestBy: requestCancelAction ? requestCancelAction.employees : null,
      cancelRequestAt: requestCancelAction ? requestCancelAction.created_at : null,
      cancelResponseBy: approveCancelAction ? approveCancelAction.employees : 
                        (rejectCancelAction ? rejectCancelAction.employees : null),
      cancelResponseAt: approveCancelAction ? approveCancelAction.created_at :
                        (rejectCancelAction ? rejectCancelAction.created_at : null),
      cancelResponseComment: approveCancelAction ? approveCancelAction.comment :
                            (rejectCancelAction ? rejectCancelAction.comment : null),
      isCancelled: approveCancelAction ? true : false
    };
    
    return { success: true, data: transformedOvertime };
  } catch (error) {
    console.error(`Error fetching overtime with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับเพิ่มข้อมูลการทำงานล่วงเวลา (โครงสร้างใหม่)
 */
export async function createOvertimeNew(data) {
  try {
    // ตรวจสอบว่าพนักงานมีอยู่จริงหรือไม่
    const employee = await prisma.employees.findUnique({
      where: { id: data.employee_id },
    });
    
    if (!employee) {
      return { success: false, message: 'ไม่พบข้อมูลพนักงาน' };
    }
    
    // แปลงสถานะเป็นภาษาอังกฤษ
    let status = 'waiting_for_approve';
    if (data.status) {
      if (data.status === 'รออนุมัติ') status = 'waiting_for_approve';
      else if (data.status === 'อนุมัติ') status = 'approved';
      else if (data.status === 'ไม่อนุมัติ') status = 'rejected';
      else if (data.status === 'ยกเลิกแล้ว') status = 'canceled';
      else status = data.status; // ถ้าเป็นภาษาอังกฤษอยู่แล้ว
    }
    
    // สร้างข้อมูลการทำงานล่วงเวลาใหม่
    const newOvertime = await prisma.overtimes.create({
      data: {
        employee_id: data.employee_id,
        date: new Date(data.date),
        start_time: data.start_time,
        end_time: data.end_time,
        total_hours: parseFloat(data.total_hours),
        reason: data.reason,
        status: status,
      },
    });
    
    // ถ้ามีข้อมูลการอนุมัติ สร้าง approval record
    if (data.approvedById) {
      await prisma.overtime_approvals.create({
        data: {
          overtime_id: newOvertime.id,
          employee_id: data.approvedById,
          type: status === 'approved' ? 'approve' : 'reject',
          status: 'completed',
          comment: data.comment || null,
          created_at: data.approvedAt ? new Date(data.approvedAt) : new Date(),
        },
      });
    }
    
    // ดึงข้อมูลการทำงานล่วงเวลาพร้อมข้อมูลเพิ่มเติม
    const fullOvertime = await getOvertimeById(newOvertime.id);
    
    return { success: true, data: fullOvertime.data };
  } catch (error) {
    console.error('Error creating overtimes:', error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับอัปเดตข้อมูลการทำงานล่วงเวลา (โครงสร้างใหม่)
 */
export async function updateOvertimeNew(id, data) {
  try {
    // ตรวจสอบว่ามีข้อมูลการทำงานล่วงเวลาหรือไม่
    const existingOvertime = await prisma.overtimes.findUnique({
      where: { id },
      include: {
        overtime_approvals: true
      }
    });
    
    if (!existingOvertime) {
      return { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' };
    }
    
    const updateData = {};
    const transactions = [];
    
    // ข้อมูลพื้นฐานที่อัปเดตได้เสมอ
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.start_time !== undefined) updateData.start_time = data.start_time;
    if (data.end_time !== undefined) updateData.end_time = data.end_time;
    if (data.total_hours !== undefined) updateData.total_hours = parseFloat(data.total_hours);
    if (data.reason !== undefined) updateData.reason = data.reason;
    
    // ถ้ามีการเปลี่ยนสถานะ
    if (data.status !== undefined) {
      // แปลงสถานะเดิมเป็นสถานะใหม่
      let newStatus = data.status;
      if (data.status === 'รออนุมัติ') newStatus = 'waiting_for_approve';
      else if (data.status === 'อนุมัติ') newStatus = 'approved';
      else if (data.status === 'ไม่อนุมัติ') newStatus = 'rejected';
      else if (data.status === 'ยกเลิกแล้ว') newStatus = 'canceled';
      
      updateData.status = newStatus;
      
      // ถ้าสถานะเป็นอนุมัติหรือไม่อนุมัติ สร้าง approval record
      if ((data.status === 'อนุมัติ' || data.status === 'ไม่อนุมัติ') && data.approvedById) {
        transactions.push(
          prisma.overtime_approvals.create({
            data: {
              overtime_id: id,
              employee_id: data.approvedById,
              type: data.status === 'อนุมัติ' ? 'approve' : 'reject',
              status: 'completed',
              comment: data.comment || null,
            },
          })
        );
      }
    }
    
    // อัปเดตข้อมูลการทำงานล่วงเวลาและสร้าง approval records ถ้ามี
    const [updatedOvertime] = await prisma.$transaction([
      prisma.overtimes.update({
        where: { id },
        data: updateData,
      }),
      ...transactions
    ]);
    
    // ดึงข้อมูลการทำงานล่วงเวลาที่อัปเดตแล้วพร้อมข้อมูลเพิ่มเติม
    const fullOvertime = await getOvertimeById(id);
    
    return { success: true, data: fullOvertime.data };
  } catch (error) {
    console.error(`Error updating overtime with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับลบข้อมูลการทำงานล่วงเวลา
 */
export async function deleteOvertime(id) {
  try {
    // ตรวจสอบว่ามีข้อมูลการทำงานล่วงเวลาหรือไม่
    const existingOvertime = await prisma.overtimes.findUnique({
      where: { id },
      include: {
        overtime_approvals: true
      }
    });
    
    if (!existingOvertime) {
      return { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' };
    }
    
    // ลบทั้ง OvertimeApproval และ Overtime ในชุดคำสั่งเดียว
    await prisma.$transaction([
      prisma.overtime_approvals.deleteMany({
        where: { overtime_id: id }
      }),
      prisma.overtimes.delete({
        where: { id }
      })
    ]);
    
    return { success: true, message: 'ลบข้อมูลการทำงานล่วงเวลาเรียบร้อยแล้ว' };
  } catch (error) {
    console.error(`Error deleting overtime with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับดึงสถิติสำหรับหน้า Dashboard
 */
export async function getStatistics() {
  try {
    // ตรวจสอบการเชื่อมต่อกับฐานข้อมูล
    try {
      await prisma.$connect();
    } catch (connectionError) {
      console.error('Database connection error:', connectionError);
      return { 
        success: false, 
        message: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้', 
        connectionError: true 
      };
    }

    // ดึงจำนวนพนักงานทั้งหมด
    const totalEmployees = await prisma.employees.count({
      where: {
        is_active: true
      }
    });
    
    // ดึงจำนวนคำขอลาที่รออนุมัติ
    const pendingLeaves = await prisma.leaves.count({
      where: {
        status: 'รออนุมัติ'
      }
    });
    
    // ดึงจำนวนคำขอทำงานล่วงเวลาที่รออนุมัติ
    const pendingOvertimes = await prisma.overtimes.count({
      where: {
        status: 'รออนุมัติ'
      }
    });
    
    return {
      success: true,
      data: {
        totalEmployees,
        pendingLeaves,
        pendingOvertimes
      }
    };
  } catch (error) {
    console.error('Error getting statistics:', error);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ',
      error: true
    };
  } finally {
    // ปิดการเชื่อมต่อกับฐานข้อมูล
    await prisma.$disconnect();
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลปฏิทินพนักงาน (ปรับปรุงประสิทธิภาพ)
 */
export async function getEmployeeCalendarData(startDate, endDate) {
  try {
    // แปลงวันที่ให้เป็น UTC เพื่อป้องกันปัญหา timezone
    const startUTC = new Date(startDate);
    const endUTC = new Date(endDate);
    
    // สร้าง date object ให้ถูกต้องเพื่อการค้นหา
    const start = new Date(startUTC.getUTCFullYear(), startUTC.getUTCMonth(), startUTC.getUTCDate(), 0, 0, 0);
    const end = new Date(endUTC.getUTCFullYear(), endUTC.getUTCMonth(), endUTC.getUTCDate(), 23, 59, 59);
    
    console.log('Calendar range - start:', start.toISOString(), 'end:', end.toISOString());
    
    // ตรวจสอบว่ามี prisma.work_statusesือไม่
    const hasWorkStatus = typeof prisma.work_statuses !== 'undefined';
    
    // สร้าง Promise ทั้งหมดเพื่อดึงข้อมูลพร้อมกัน
    let employees = [], leaves = [], overtimes = [], workStatuses = [];
    
    if (hasWorkStatus) {
      // ถ้ามี workStatus model ให้ดึงข้อมูลทั้งหมดพร้อมกัน
      [employees, leaves, overtimes, workStatuses] = await Promise.all([
        // ดึงข้อมูลพนักงานเฉพาะที่ active และเฉพาะฟิลด์ที่จำเป็น
        prisma.employees.findMany({
          where: {
            is_active: true,
          },
          select: {
            id: true,
            employee_id: true,
            first_name: true,
            last_name: true,
            email: true,
            position: true,
            departments: true,
            role: true,
            image: true,
            team_id: true,
            teams: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          },
          orderBy: {
            first_name: 'asc',
          },
        }),
        
        // ดึงข้อมูลการลาในช่วงเวลาที่กำหนด (เฉพาะที่ได้รับอนุมัติหรือรออนุมัติ)
        prisma.leaves.findMany({
          where: {
            start_date: {
              lte: end,
            },
            end_date: {
              gte: start,
            },
            // เฉพาะที่ได้รับอนุมัติหรือรออนุมัติ
            status: {
              in: ['approved', 'waiting_for_approve']
            }
          },
          select: {
            id: true,
            employee_id: true,
            start_date: true,
            end_date: true,
            leave_type: true,
            total_days: true,
            status: true,
            reason: true,
            employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                team_id: true,
              },
            },
          },
        }),
        
        // ดึงข้อมูลการทำงานล่วงเวลาในช่วงเวลาที่กำหนด
        prisma.overtimes.findMany({
          where: {
            date: {
              gte: start,
              lte: end,
            },
            // เฉพาะที่ได้รับอนุมัติหรือรออนุมัติ
            status: {
              in: ['approved', 'waiting_for_approve']
            }
          },
          select: {
            id: true,
            employee_id: true,
            date: true,
            start_time: true,
            end_time: true,
            total_hours: true,
            status: true,
            reason: true,
            employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                team_id: true,
              },
            },
          },
        }),
        
        // ดึงข้อมูลสถานะการทำงาน
        prisma.work_statuses.findMany({
          where: {
            date: {
              gte: start,
              lte: end,
            },
          },
          select: {
            id: true,
            employee_id: true,
            date: true,
            status: true,
            note: true,
            employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                team_id: true,
                teams: {
                  select: {
                    id: true,
                    name: true
                  }
                },
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
        })
      ]);
    } else {
      // ถ้าไม่มี workStatus model ให้ดึงข้อมูลเฉพาะ employee, leave, และ overtime
      [employees, leaves, overtimes] = await Promise.all([
        // ดึงข้อมูลพนักงานเฉพาะที่ active และเฉพาะฟิลด์ที่จำเป็น
        prisma.employees.findMany({
          where: {
            is_active: true,
          },
          select: {
            id: true,
            employee_id: true,
            first_name: true,
            last_name: true,
            email: true,
            position: true,
            departments: true,
            role: true,
            image: true,
            team_id: true,
            teams: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          },
          orderBy: {
            first_name: 'asc',
          },
        }),
        
        // ดึงข้อมูลการลาในช่วงเวลาที่กำหนด (เฉพาะที่ได้รับอนุมัติหรือรออนุมัติ)
        prisma.leaves.findMany({
          where: {
            start_date: {
              lte: end,
            },
            end_date: {
              gte: start,
            },
            // เฉพาะที่ได้รับอนุมัติหรือรออนุมัติ
            status: {
              in: ['approved', 'waiting_for_approve']
            }
          },
          select: {
            id: true,
            employee_id: true,
            start_date: true,
            end_date: true,
            leave_type: true,
            total_days: true,
            status: true,
            reason: true,
            employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                team_id: true,
              },
            },
          },
        }),
        
        // ดึงข้อมูลการทำงานล่วงเวลาในช่วงเวลาที่กำหนด
        prisma.overtimes.findMany({
          where: {
            date: {
              gte: start,
              lte: end,
            },
            // เฉพาะที่ได้รับอนุมัติหรือรออนุมัติ
            status: {
              in: ['approved', 'waiting_for_approve']
            }
          },
          select: {
            id: true,
            employee_id: true,
            date: true,
            start_time: true,
            end_time: true,
            total_hours: true,
            status: true,
            reason: true,
            employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                team_id: true,
              },
            },
          },
        })
      ]);
      
      // ให้ workStatuses เป็น array ว่าง
      workStatuses = [];
    }
    
    return {
      success: true,
      data: {
        employees,
        leaves,
        overtimes,
        workStatuses,
      },
    };
  } catch (error) {
    console.error('Error fetching employee calendar data:', error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับดึงสถานะการทำงาน (WFH)
 */
export async function getWorkStatuses(employeeId = null, date = null, startDate = null, endDate = null) {
  try {
    // ตรวจสอบว่ามี workStatus model หรือไม่
    const hasWorkStatusesModel = typeof prisma.work_statuses !== 'undefined';
    
    if (!hasWorkStatusesModel) {
      return {
        success: false,
        message: 'โมเดลข้อมูลสถานะการทำงานยังไม่พร้อมใช้งาน กรุณาตรวจสอบการติดตั้งฐานข้อมูล',
        data: []
      };
    }
    
    // ใช้โมเดลที่มีอยู่ (work_statuses หรือ workStatus)
    const model = prisma.work_statuses
    
    console.log('================ WORK STATUS FETCH DEBUG ================');
    console.log(`Using model: work_statuses`);
    
    const whereClause = {};
    
    if (employeeId) {
      // ปรับตามชื่อฟิลด์ของแต่ละโมเดล
      whereClause.employee_id = employeeId;
      console.log('Filtering by employee_id:', employeeId);
    }
    
    if (date) {
      // แปลงวันที่เป็น UTC เวลา 12:00 น. เพื่อป้องกันปัญหา timezone
      const dateObj = new Date(date);
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth();
      const day = dateObj.getDate();
      const utcDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
      
      whereClause.date = utcDate;
      console.log('Filtering by specific date (UTC):', utcDate.toISOString());
    }
    else if (startDate && endDate) {
      // ถ้ามีทั้งวันที่เริ่มต้นและวันที่สิ้นสุด
      const startObj = new Date(startDate);
      const endObj = new Date(endDate);
      
      // แปลงเป็น UTC โดยวันเริ่มต้นเวลา 00:00:00 และวันสิ้นสุดเวลา 23:59:59
      const startUTC = new Date(Date.UTC(
        startObj.getFullYear(),
        startObj.getMonth(),
        startObj.getDate(),
        0, 0, 0
      ));
      
      const endUTC = new Date(Date.UTC(
        endObj.getFullYear(),
        endObj.getMonth(),
        endObj.getDate(),
        23, 59, 59
      ));
      
      whereClause.date = {
        gte: startUTC,
        lte: endUTC
      };
      
      console.log('Filtering by date range:');
      console.log('- Start (UTC):', startUTC.toISOString());
      console.log('- End (UTC):', endUTC.toISOString());
    }
    
    console.log('Final where clause:', JSON.stringify(whereClause, null, 2));
    
    // ดึงข้อมูลตามโมเดลที่มี
    let workStatuses;
    
    if (hasWorkStatusesModel) {
      // ถ้าใช้โมเดล work_statuses
      workStatuses = await model.findMany({
        where: whereClause,
        include: {
          employees_work_statuses_employee_id_to_employees: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              position: true,
              department_id: true,
              image: true,
            },
          },
          employees_work_statuses_created_by_idToemployees: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });
      
      // แปลงชื่อ field ให้เป็นรูปแบบ camelCase
      workStatuses = workStatuses.map(item => ({
        id: item.id,
        employee_id: item.employee_id,
        date: item.date,
        status: item.status,
        note: item.note,
        created_by_id: item.created_by_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        employee: item.employees_work_statuses_employee_id_to_employees ? {
          id: item.employees_work_statuses_employee_id_to_employees.id,
          first_name: item.employees_work_statuses_employee_id_to_employees.first_name,
          last_name: item.employees_work_statuses_employee_id_to_employees.last_name,
          position: item.employees_work_statuses_employee_id_to_employees.position,
          department_id: item.employees_work_statuses_employee_id_to_employees.department_id,
          image: item.employees_work_statuses_employee_id_to_employees.image,
        } : null,
        created_by: item.employees_work_statuses_created_by_idToemployees ? {
          id: item.employees_work_statuses_created_by_idToemployees.id,
          first_name: item.employees_work_statuses_created_by_idToemployees.first_name,
          last_name: item.employees_work_statuses_created_by_idToemployees.last_name,
        } : null,
      }));
    } else {
      // ถ้าใช้โมเดล workStatus
      workStatuses = await model.findMany({
        where: whereClause,
        include: {
          employees: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              position: true,
              team_id: true,
              teams: true,
              departments: true,
              image: true,
            },
          },
          employees: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });
    }
    
    console.log(`Found ${workStatuses.length} work status records`);
    
    if (workStatuses.length > 0) {
      console.log('Sample processed results:');
      console.log('- First date:', workStatuses[0].date?.toISOString());
      if (workStatuses.length > 1) {
        console.log('- Last date:', workStatuses[workStatuses.length-1].date?.toISOString());
      }
    }
    
    console.log('===================================================');
    
    return {
      success: true,
      data: workStatuses,
    };
  } catch (error) {
    console.error('Error fetching work statuses:', error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับดึงสถานะการทำงาน (WFH) ตาม ID
 */
export async function getWorkStatusById(id) {
  try {
    // ตรวจสอบว่ามี workStatus model หรือไม่
    const hasWorkStatusesModel = typeof prisma.work_statuses !== 'undefined';
    
    if (!hasWorkStatusesModel) {
      return {
        success: false,
        message: 'โมเดลข้อมูลสถานะการทำงานยังไม่พร้อมใช้งาน กรุณาตรวจสอบการติดตั้งฐานข้อมูล',
        data: null
      };
    }
    
    // ใช้โมเดลที่มีอยู่ (work_statuses หรือ workStatus)
    const model = prisma.work_statuses
    
    let workStatus;
    
    if (hasWorkStatusesModel) {
      // ถ้าใช้โมเดล work_statuses
      workStatus = await model.findUnique({
        where: { id },
        include: {
          employees_work_statuses_employee_id_to_employees: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              position: true,
              department_id: true,
              image: true,
            },
          },
          employees_work_statuses_created_by_idToemployees: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });
      
      if (workStatus) {
        // แปลงชื่อ field ให้เป็นรูปแบบ camelCase
        workStatus = {
          id: workStatus.id,
          employee_id: workStatus.employee_id,
          date: workStatus.date,
          status: workStatus.status,
          note: workStatus.note,
          created_by_id: workStatus.created_by_id,
          created_at: workStatus.created_at,
          updated_at: workStatus.updated_at,
          employee: workStatus.employees_work_statuses_employee_id_to_employees ? {
            id: workStatus.employees_work_statuses_employee_id_to_employees.id,
            first_name: workStatus.employees_work_statuses_employee_id_to_employees.first_name,
            last_name: workStatus.employees_work_statuses_employee_id_to_employees.last_name,
            position: workStatus.employees_work_statuses_employee_id_to_employees.position,
            department_id: workStatus.employees_work_statuses_employee_id_to_employees.department_id,
            image: workStatus.employees_work_statuses_employee_id_to_employees.image,
          } : null,
          created_by: workStatus.employees_work_statuses_created_by_idToemployees ? {
            id: workStatus.employees_work_statuses_created_by_idToemployees.id,
            first_name: workStatus.employees_work_statuses_created_by_idToemployees.first_name,
            last_name: workStatus.employees_work_statuses_created_by_idToemployees.last_name,
          } : null,
        };
      }
    } else {
      // ถ้าใช้โมเดล workStatus
      workStatus = await model.findUnique({
        where: { id },
        include: {
          employees: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              position: true,
              department_id: true,
              image: true,
            },
          },
          employees: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });
    }
    
    if (!workStatus) {
      return { success: false, message: 'ไม่พบข้อมูลสถานะการทำงาน' };
    }
    
    return {
      success: true,
      data: workStatus,
    };
  } catch (error) {
    console.error('Error fetching work status by ID:', error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับลบสถานะการทำงาน (WFH)
 */
export async function deleteWorkStatus(id) {
  try {
    // ตรวจสอบว่ามี workStatus model หรือไม่
    const hasWorkStatusModel = typeof prisma.work_statuses !== 'undefined';
    const hasWorkStatusesModel = typeof prisma.work_statuses !== 'undefined';
    
    if (!hasWorkStatusModel && !hasWorkStatusesModel) {
      return {
        success: false,
        message: 'โมเดลข้อมูลสถานะการทำงานยังไม่พร้อมใช้งาน กรุณาตรวจสอบการติดตั้งฐานข้อมูล',
        data: null
      };
    }
    
    // ใช้โมเดลที่มีอยู่ (work_statuses หรือ workStatus)
    const model = hasWorkStatusesModel ? prisma.work_statuses: prisma.work_statuses
    
    // ตรวจสอบว่ามีข้อมูลนี้อยู่หรือไม่
    const existingWorkStatus = await model.findUnique({
      where: { id }
    });
    
    if (!existingWorkStatus) {
      return {
        success: false,
        message: 'ไม่พบข้อมูลสถานะการทำงานที่ต้องการลบ'
      };
    }
    
    await model.delete({
      where: { id }
    });
    
    return {
      success: true,
      message: 'ลบข้อมูลสำเร็จ'
    };
  } catch (error) {
    console.error('Error deleting work status:', error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับอนุมัติการทำงานล่วงเวลา (โครงสร้างใหม่)
 */
export async function approveOvertimeNew(id, data) {
  try {
    // ตรวจสอบว่ามีข้อมูลการทำงานล่วงเวลาหรือไม่
    const existingOvertime = await prisma.overtimes.findUnique({
      where: { id },
      include: {
        overtime_approvals: true,
        employees: true
      }
    });
    
    if (!existingOvertime) {
      return { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' };
    }
    
    // ตรวจสอบว่าสถานะปัจจุบันเป็น waiting_for_approve หรือไม่
    if (existingOvertime.status !== 'waiting_for_approve') {
      return { success: false, message: 'สามารถอนุมัติได้เฉพาะการทำงานล่วงเวลาที่มีสถานะรออนุมัติเท่านั้น' };
    }
    
    // อัปเดตสถานะการทำงานล่วงเวลาเป็น approved
    const updatedOvertime = await prisma.overtimes.update({
      where: { id },
      data: {
        status: 'approved',
        updated_at: new Date()
      }
    });
    
    // บันทึกการอนุมัติลงในตาราง OvertimeApproval
    const approval = await prisma.overtime_approvals.create({
      data: {
        overtime_id: id,
        employee_id: data.approverId,
        type: 'approve',
        status: 'completed',
        comment: data.comment || '',
      }
    });
    
    // ดึงข้อมูลการทำงานล่วงเวลาที่อัปเดตแล้วพร้อมข้อมูลเพิ่มเติม
    const fullOvertime = await getOvertimeById(id);
    
    return { 
      success: true, 
      data: fullOvertime.data,
      message: 'อนุมัติการทำงานล่วงเวลาเรียบร้อยแล้ว'
    };
  } catch (error) {
    console.error(`Error approving overtime with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับไม่อนุมัติการทำงานล่วงเวลา (โครงสร้างใหม่)
 */
export async function rejectOvertimeNew(id, data) {
  try {
    // ตรวจสอบว่ามีข้อมูลการทำงานล่วงเวลาหรือไม่
    const existingOvertime = await prisma.overtimes.findUnique({
      where: { id },
      include: {
        overtime_approvals: true,
        employees: true
      }
    });
    
    if (!existingOvertime) {
      return { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' };
    }
    
    // ตรวจสอบว่าสถานะปัจจุบันเป็น waiting_for_approve หรือไม่
    if (existingOvertime.status !== 'waiting_for_approve') {
      return { success: false, message: 'สามารถไม่อนุมัติได้เฉพาะการทำงานล่วงเวลาที่มีสถานะรออนุมัติเท่านั้น' };
    }
    
    // อัปเดตสถานะการทำงานล่วงเวลาเป็น rejected
    const updatedOvertime = await prisma.overtimes.update({
      where: { id },
      data: {
        status: 'rejected',
        updated_at: new Date()
      }
    });
    
    // บันทึกการไม่อนุมัติลงในตาราง OvertimeApproval
    const approval = await prisma.overtime_approvals.create({
      data: {
        overtime_id: id,
        employee_id: data.approverId,
        type: 'reject',
        status: 'completed',
        comment: data.comment || '',
      }
    });
    
    // ดึงข้อมูลการทำงานล่วงเวลาที่อัปเดตแล้วพร้อมข้อมูลเพิ่มเติม
    const fullOvertime = await getOvertimeById(id);
    
    return { 
      success: true, 
      data: fullOvertime.data,
      message: 'ไม่อนุมัติการทำงานล่วงเวลาเรียบร้อยแล้ว'
    };
  } catch (error) {
    console.error(`Error rejecting overtime with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับขอยกเลิกการทำงานล่วงเวลา (โครงสร้างใหม่)
 */
export async function requestCancelOvertimeNew(id, data) {
  try {
    // ตรวจสอบว่ามีข้อมูลการทำงานล่วงเวลาหรือไม่
    const existingOvertime = await prisma.overtimes.findUnique({
      where: { id },
      include: {
        overtime_approvals: {
          orderBy: { created_at: 'desc' }
        },
        employees: true
      }
    });
    
    if (!existingOvertime) {
      return { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' };
    }
    
    // ตรวจสอบว่าสถานะปัจจุบันเป็น approved หรือไม่
    if (existingOvertime.status !== 'approved') {
      return { success: false, message: 'สามารถขอยกเลิกได้เฉพาะการทำงานล่วงเวลาที่อนุมัติแล้วเท่านั้น' };
    }
    
    // ตรวจสอบว่ามีคำขอยกเลิกที่ยังรออนุมัติอยู่แล้วหรือไม่
    const pendingCancelRequest = existingOvertime.overtime_approvals?.some(a => 
      a.type === 'request_cancel' && 
      !existingOvertime.overtime_approvals.some(b => 
        (b.type === 'approve_cancel' || b.type === 'reject_cancel') && 
        b.created_at > a.created_at
      )
    );
    
    if (pendingCancelRequest) {
      return { success: false, message: 'มีคำขอยกเลิกการทำงานล่วงเวลานี้ที่ยังรออนุมัติอยู่แล้ว' };
    }

    // สร้างคำขอการยกเลิกใน OvertimeApproval
    const newApproval = await prisma.overtime_approvals.create({
      data: {
        overtime_id: id,
        employee_id: data.employee_id,
        type: 'request_cancel',
        status: 'waiting',
        comment: data.comment || '',
      }
    });
    
    // ดึงข้อมูลการลาที่อัปเดตแล้วพร้อมข้อมูลเพิ่มเติม
    const fullOvertime = await getOvertimeById(id);
    
    return { 
      success: true, 
      data: fullOvertime.data,
      message: 'ส่งคำขอยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว กรุณารอการอนุมัติ'
    };
  } catch (error) {
    console.error(`Error requesting cancel overtime with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับอนุมัติการยกเลิกการทำงานล่วงเวลา (โครงสร้างใหม่)
 */
export async function approveCancelOvertimeNew(id, data) {
  try {
    // ตรวจสอบว่ามีข้อมูลการทำงานล่วงเวลาหรือไม่
    const existingOvertime = await prisma.overtimes.findUnique({
      where: { id },
      include: {
        overtime_approvals: {
          orderBy: { created_at: 'desc' }
        },
        employees: true
      }
    });
    
    if (!existingOvertime) {
      return { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' };
    }
    
    // ตรวจสอบว่ามีคำขอยกเลิกหรือไม่
    const requestCancelAction = existingOvertime.overtime_approvals.find(a => a.type === 'request_cancel' && a.status === 'completed');
    if (!requestCancelAction) {
      return { success: false, message: 'ไม่พบคำขอยกเลิกการทำงานล่วงเวลา' };
    }
    
    // ตรวจสอบว่าเป็นการทำงานล่วงเวลาที่อนุมัติแล้วหรือไม่
    if (existingOvertime.status !== 'approved') {
      return { success: false, message: 'สามารถอนุมัติการยกเลิกได้เฉพาะการทำงานล่วงเวลาที่อนุมัติแล้วเท่านั้น' };
    }
    
    // อัปเดตสถานะการทำงานล่วงเวลาเป็น canceled
    const updatedOvertime = await prisma.overtimes.update({
      where: { id },
      data: {
        status: 'canceled',
        updated_at: new Date()
      }
    });
    
    // บันทึกการอนุมัติยกเลิกลงในตาราง OvertimeApproval
    const approval = await prisma.overtime_approvals.create({
      data: {
        overtime_id: id,
        employee_id: data.approverId,
        type: 'approve_cancel',
        status: 'completed',
        comment: data.comment || '',
      }
    });
    
    // ดึงข้อมูลการทำงานล่วงเวลาที่อัปเดตแล้วพร้อมข้อมูลเพิ่มเติม
    const fullOvertime = await getOvertimeById(id);
    
    return { 
      success: true, 
      data: fullOvertime.data,
      message: 'อนุมัติการยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว'
    };
  } catch (error) {
    console.error(`Error approving cancel overtime with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับไม่อนุมัติการยกเลิกการทำงานล่วงเวลา (โครงสร้างใหม่)
 */
export async function rejectCancelOvertimeNew(id, data) {
  try {
    // ตรวจสอบว่ามีข้อมูลการทำงานล่วงเวลาหรือไม่
    const existingOvertime = await prisma.overtimes.findUnique({
      where: { id },
      include: {
        overtime_approvals: {
          orderBy: { created_at: 'desc' }
        },
        employees: true
      }
    });
    
    if (!existingOvertime) {
      return { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' };
    }
    
    // ตรวจสอบว่ามีคำขอยกเลิกหรือไม่
    const requestCancelAction = existingOvertime.overtime_approvals.find(a => a.type === 'request_cancel' && a.status === 'completed');
    if (!requestCancelAction) {
      return { success: false, message: 'ไม่พบคำขอยกเลิกการทำงานล่วงเวลา' };
    }
    
    // ตรวจสอบว่าเป็นการทำงานล่วงเวลาที่อนุมัติแล้วหรือไม่
    if (existingOvertime.status !== 'approved') {
      return { success: false, message: 'สามารถไม่อนุมัติการยกเลิกได้เฉพาะการทำงานล่วงเวลาที่อนุมัติแล้วเท่านั้น' };
    }
    
    // บันทึกการไม่อนุมัติยกเลิกลงในตาราง OvertimeApproval (ไม่มีการเปลี่ยนสถานะ Overtime)
    const approval = await prisma.overtime_approvals.create({
      data: {
        overtime_id: id,
        employee_id: data.approverId,
        type: 'reject_cancel',
        status: 'completed',
        comment: data.comment || '',
      }
    });
    
    // ดึงข้อมูลการทำงานล่วงเวลาที่อัปเดตแล้วพร้อมข้อมูลเพิ่มเติม
    const fullOvertime = await getOvertimeById(id);
    
    return { 
      success: true, 
      data: fullOvertime.data,
      message: 'ไม่อนุมัติการยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว'
    };
  } catch (error) {
    console.error(`Error rejecting cancel overtime with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับลบข้อมูลการลา
 */
export async function deleteLeave(id) {
  try {
    // ตรวจสอบว่ามีข้อมูลการลาหรือไม่
    const existingLeave = await prisma.leaves.findUnique({
      where: { id }
    });
    
    if (!existingLeave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    // ลบข้อมูลการอนุมัติทั้งหมดที่เกี่ยวข้องก่อน
    await prisma.leave_approvals.deleteMany({
      where: { leave_id: id }
    });
    
    // ลบข้อมูลการลา
    const deletedLeave = await prisma.leaves.delete({
      where: { id }
    });
    
    return { success: true, data: deletedLeave, message: 'ลบข้อมูลการลาเรียบร้อยแล้ว' };
  } catch (error) {
    console.error(`Error deleting leave with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับสร้างหรืออัปเดตสถานะการทำงาน (WFH)
 */
export async function createOrUpdateWorkStatus(data) {
  try {
    const { employee_id, date, status, note, created_by_id } = data;
    
    // ตรวจสอบว่ามี workStatus model หรือไม่
    const hasWorkStatusModel = typeof prisma.work_statuses !== 'undefined';
    const hasWorkStatusesModel = typeof prisma.work_statuses !== 'undefined';
    
    if (!hasWorkStatusModel && !hasWorkStatusesModel) {
      return {
        success: false,
        message: 'โมเดลข้อมูลสถานะการทำงานยังไม่พร้อมใช้งาน กรุณาตรวจสอบการติดตั้งฐานข้อมูล',
        data: null
      };
    }
    
    // ใช้โมเดลที่มีอยู่ (work_statuses หรือ workStatus)
    const model = hasWorkStatusesModel ? prisma.work_statuses: prisma.work_statuses
    
    // ตรวจสอบข้อมูลวันที่ที่รับเข้ามา
    console.log('================ WORK STATUS SAVE DEBUG ================');
    console.log('Input date:', date);
    console.log(`Using model: ${hasWorkStatusesModel ? 'work_statuses' : 'workStatus'}`);
    
    // แปลงวันที่ให้เป็น Date object
    let dateObj;
    if (date instanceof Date) {
      dateObj = new Date(date);
    } else {
      dateObj = new Date(date);
    }
    
    // คัดลอกเฉพาะส่วนของวันที่ เดือน ปี โดยไม่สนใจเวลา
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = dateObj.getDate();
    
    // สร้าง Date object ใหม่ที่ไม่มีส่วนของเวลา ตั้งเวลาเป็น 12:00 น. เพื่อป้องกันปัญหา timezone
    const formattedDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
    
    console.log('Date object:', dateObj.toISOString());
    console.log('UTC Date:', formattedDate.toISOString());
    console.log('Local date (th-TH):', formattedDate.toLocaleDateString('th-TH'));
    console.log('Local date (en-US):', formattedDate.toLocaleDateString('en-US'));
    console.log('========================================================');
    
    let existingWorkStatus;
    let result;
    
    if (hasWorkStatusesModel) {
      // ถ้าใช้โมเดล work_statuses
      // ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
      existingWorkStatus = await model.findFirst({
        where: {
          employee_id: employee_id,
          date: formattedDate
        }
      });
      
      if (existingWorkStatus) {
        // ถ้ามีข้อมูลอยู่แล้ว ให้อัปเดตข้อมูลเดิม
        console.log(`Updating existing work status (ID: ${existingWorkStatus.id}) for date ${formattedDate.toISOString()}`);
        
        result = await model.update({
          where: { id: existingWorkStatus.id },
          data: {
            status,
            note,
            created_by_id: created_by_id, // อัปเดต created_by_id เป็นคนล่าสุดที่แก้ไขข้อมูล
          },
          include: {
            employees_work_statuses_employee_id_to_employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                department_id: true,
                image: true,
              },
            },
            employees_work_statuses_created_by_idToemployees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        });
        
        // แปลงชื่อ field ให้เป็นรูปแบบ camelCase
        result = {
          id: result.id,
          employee_id: result.employee_id,
          date: result.date,
          status: result.status,
          note: result.note,
          created_by_id: result.created_by_id,
          created_at: result.created_at,
          updated_at: result.updated_at,
          employee: result.employees_work_statuses_employee_id_to_employees ? {
            id: result.employees_work_statuses_employee_id_to_employees.id,
            first_name: result.employees_work_statuses_employee_id_to_employees.first_name,
            last_name: result.employees_work_statuses_employee_id_to_employees.last_name,
            position: result.employees_work_statuses_employee_id_to_employees.position,
            department_id: result.employees_work_statuses_employee_id_to_employees.department_id,
            image: result.employees_work_statuses_employee_id_to_employees.image,
          } : null,
          created_by: result.employees_work_statuses_created_by_idToemployees ? {
            id: result.employees_work_statuses_created_by_idToemployees.id,
            first_name: result.employees_work_statuses_created_by_idToemployees.first_name,
            last_name: result.employees_work_statuses_created_by_idToemployees.last_name,
          } : null,
        };
      } else {
        // ถ้าไม่มีข้อมูลอยู่ ให้สร้างข้อมูลใหม่
        console.log(`Creating new work status for ${employee_id} on date ${formattedDate.toISOString()}`);
        
        result = await model.create({
          data: {
            employee_id: employee_id,
            date: formattedDate,
            status,
            note,
            created_by_id: created_by_id
          },
          include: {
            employees_work_statuses_employee_id_to_employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                department_id: true,
                image: true,
              },
            },
            employees_work_statuses_created_by_idToemployees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        });
        
        // แปลงชื่อ field ให้เป็นรูปแบบ camelCase
        result = {
          id: result.id,
          employee_id: result.employee_id,
          date: result.date,
          status: result.status,
          note: result.note,
          created_by_id: result.created_by_id,
          created_at: result.created_at,
          updated_at: result.updated_at,
          employee: result.employees_work_statuses_employee_id_to_employees ? {
            id: result.employees_work_statuses_employee_id_to_employees.id,
            first_name: result.employees_work_statuses_employee_id_to_employees.first_name,
            last_name: result.employees_work_statuses_employee_id_to_employees.last_name,
            position: result.employees_work_statuses_employee_id_to_employees.position,
            department_id: result.employees_work_statuses_employee_id_to_employees.department_id,
            image: result.employees_work_statuses_employee_id_to_employees.image,
          } : null,
          created_by: result.employees_work_statuses_created_by_idToemployees ? {
            id: result.employees_work_statuses_created_by_idToemployees.id,
            first_name: result.employees_work_statuses_created_by_idToemployees.first_name,
            last_name: result.employees_work_statuses_created_by_idToemployees.last_name,
          } : null,
        };
      }
    } else {
      // ถ้าใช้โมเดล workStatus
      // ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
      existingWorkStatus = await model.findFirst({
        where: {
          employee_id,
          date: formattedDate
        }
      });
      
      if (existingWorkStatus) {
        // ถ้ามีข้อมูลอยู่แล้ว ให้อัปเดตข้อมูลเดิม
        console.log(`Updating existing work status (ID: ${existingWorkStatus.id}) for date ${formattedDate.toISOString()}`);
        
        result = await model.update({
          where: { id: existingWorkStatus.id },
          data: {
            status,
            note,
            created_by_id, // อัปเดต createdById เป็นคนล่าสุดที่แก้ไขข้อมูล
          },
          include: {
            employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                department_id: true,
                image: true,
              },
            },
            created_by: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        });
      } else {
        // ถ้าไม่มีข้อมูลอยู่ ให้สร้างข้อมูลใหม่
        console.log(`Creating new work status for date ${formattedDate.toISOString()}`);
        
        result = await model.create({
          data: {
            employee_id,
            date: formattedDate,
            status,
            note,
            created_by_id
          },
          include: {
            employees: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                department_id: true,
                image: true,
              },
            },
            created_by: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        });
      }
    }
    
    return {
      success: true,
      data: result,
      message: existingWorkStatus ? 'อัปเดตสถานะการทำงานเรียบร้อยแล้ว' : 'บันทึกสถานะการทำงานเรียบร้อยแล้ว'
    };
  } catch (error) {
    console.error('Error in createOrUpdateWorkStatus:', error);
    return { success: false, message: error.message };
  }
}