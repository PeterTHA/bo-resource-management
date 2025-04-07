import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export { prisma };
export default prisma;

/**
 * ฟังก์ชันสำหรับดึงข้อมูลพนักงานทั้งหมด
 */
export async function getEmployees() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        teamData: true
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
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        teamData: true
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
    const employee = await prisma.employee.findUnique({
      where: { email },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        position: true,
        department: true,
        hireDate: true,
        role: true,
        isActive: true,
        image: true,
        createdAt: true,
        updatedAt: true,
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
    const teams = await prisma.team.findMany({
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
    const existingEmployee = await prisma.employee.findUnique({
      where: { email: data.email },
    });
    
    if (existingEmployee) {
      return { success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' };
    }
    
    // ตรวจสอบว่ามีรหัสพนักงานซ้ำหรือไม่
    const existingEmployeeId = await prisma.employee.findUnique({
      where: { employeeId: data.employeeId },
    });
    
    if (existingEmployeeId) {
      return { success: false, message: 'รหัสพนักงานนี้ถูกใช้งานแล้ว' };
    }
    
    // สร้างพนักงานใหม่
    const newEmployee = await prisma.employee.create({
      data: {
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        position: data.position,
        department: data.department,
        teamId: data.teamId || null,
        team: data.team || null,
        hireDate: new Date(data.hireDate),
        role: data.role || 'employee',
        isActive: data.isActive !== undefined ? data.isActive : true,
        image: data.image || null,
      },
    });
    
    // ไม่ส่งรหัสผ่านกลับไป
    const { password, ...employeeWithoutPassword } = newEmployee;
    
    return { success: true, data: employeeWithoutPassword };
  } catch (error) {
    console.error('Error creating employee:', error);
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
      const existingEmployee = await prisma.employee.findFirst({
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
    if (data.employeeId) {
      const existingEmployeeId = await prisma.employee.findFirst({
        where: {
          employeeId: data.employeeId,
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
    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.teamId !== undefined) updateData.teamId = data.teamId;
    if (data.team !== undefined) updateData.team = data.team;
    if (data.hireDate !== undefined) updateData.hireDate = new Date(data.hireDate);
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.image !== undefined) updateData.image = data.image;
    
    // อัปเดตพนักงาน
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        position: true,
        department: true,
        hireDate: true,
        role: true,
        isActive: true,
        image: true,
        createdAt: true,
        updatedAt: true,
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
    const leaves = await prisma.leave.findMany({
      where: { employeeId: id },
    });
    
    const overtimes = await prisma.overtime.findMany({
      where: { employeeId: id },
    });
    
    // ถ้ามีข้อมูลที่เกี่ยวข้อง ให้ทำการอัปเดตสถานะเป็นไม่ใช้งานแทนการลบ
    if (leaves.length > 0 || overtimes.length > 0) {
      const updatedEmployee = await prisma.employee.update({
        where: { id },
        data: { isActive: false },
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          email: true,
          position: true,
          department: true,
          hireDate: true,
          role: true,
          isActive: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      
      return {
        success: true,
        data: updatedEmployee,
        message: 'พนักงานถูกปรับสถานะเป็นไม่ใช้งานแล้ว เนื่องจากมีข้อมูลที่เกี่ยวข้อง',
      };
    }
    
    // ถ้าไม่มีข้อมูลที่เกี่ยวข้อง ให้ลบได้เลย
    await prisma.employee.delete({
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
    await prisma.employee.update({
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
 * @param {string} employeeId - รหัสพนักงานที่ต้องการดึงข้อมูล (ถ้าไม่ระบุจะดึงทั้งหมด)
 * @param {string} teamId - รหัสทีมที่ต้องการดึงข้อมูล (ใช้กรณีหัวหน้าทีมต้องการดูข้อมูลพนักงานในทีม)
 */
export async function getLeaves(employeeId = null, teamId = null) {
  try {
    let whereClause = {};
    
    // ถ้ามีการระบุ employeeId จะดึงเฉพาะข้อมูลของพนักงานคนนั้น
    if (employeeId) {
      whereClause.employeeId = employeeId;
    } 
    // ถ้ามีการระบุ teamId จะดึงข้อมูลของพนักงานในทีมนั้น
    else if (teamId) {
      whereClause = {
        employee: {
          teamId: teamId
        }
      };
    }
    
    const leaves = await prisma.leave.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            department: true,
            image: true,
            teamId: true,
            teamData: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        approvals: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                role: true
              }
            }
          }
        }
      }
    });
    
    // แปลงข้อมูลเพื่อความเข้ากันได้กับโค้ดเดิม
    const transformedLeaves = leaves.map(leave => {
      // เรียงลำดับ approvals ตาม createdAt ใหม่ ให้ล่าสุดอยู่ก่อน
      leave.approvals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // ค้นหา approval ล่าสุดตามประเภท
      const lastApproval = leave.approvals[0] || null;
      const approveAction = leave.approvals.find(a => a.type === 'approve' && a.status === 'completed');
      const rejectAction = leave.approvals.find(a => a.type === 'reject' && a.status === 'completed');
      const requestCancelAction = leave.approvals.find(a => a.type === 'request_cancel' && a.status === 'completed');
      const approveCancelAction = leave.approvals.find(a => a.type === 'approve_cancel' && a.status === 'completed');
      const rejectCancelAction = leave.approvals.find(a => a.type === 'reject_cancel' && a.status === 'completed');
      
      // ตรวจสอบสถานะล่าสุดจาก transaction log
      // หากมีการขอยกเลิกล่าสุด แต่ไม่พบ approveCancelAction หรือ rejectCancelAction ที่เกิดหลังจากการขอยกเลิกล่าสุด
      // แสดงว่ายังอยู่ในสถานะรออนุมัติ
      const isLatestRequestCancel = lastApproval && lastApproval.type === 'request_cancel';
      
      // สถานะยกเลิก
      let cancelStatusValue = null;
      if (approveCancelAction) {
        cancelStatusValue = 'อนุมัติ';
      } else if (isLatestRequestCancel && !approveCancelAction && !rejectCancelAction) {
        cancelStatusValue = 'รออนุมัติ';
      } else if (rejectCancelAction) {
        cancelStatusValue = 'ไม่อนุมัติ';
      }
      
      // สร้างเวอร์ชันของข้อมูลที่เข้ากันได้กับโค้ดเดิม
      const transformed = {
        ...leave,
        // สำหรับการอนุมัติ/ไม่อนุมัติปกติ
        approvedById: approveAction?.employeeId || rejectAction?.employeeId || null,
        approvedAt: approveAction?.createdAt || rejectAction?.createdAt || null,
        comment: approveAction?.comment || rejectAction?.comment || null,
        approvedBy: approveAction?.employee || rejectAction?.employee || null,
        
        // สำหรับการยกเลิก
        cancelRequestedAt: requestCancelAction?.createdAt || null,
        cancelReason: requestCancelAction?.reason || null,
        cancelStatus: cancelStatusValue,
        cancelApprovedById: approveCancelAction?.employeeId || rejectCancelAction?.employeeId || null,
        cancelApprovedAt: approveCancelAction?.createdAt || rejectCancelAction?.createdAt || null,
        cancelComment: approveCancelAction?.comment || rejectCancelAction?.comment || null,
        cancelApprovedBy: approveCancelAction?.employee || rejectCancelAction?.employee || null,
        isCancelled: !!approveCancelAction,
        
        // เพิ่มข้อมูล transaction logs สำหรับหน้ารายละเอียด
        transactionLogs: leave.approvals.map(approval => ({
          id: approval.id,
          type: approval.type,
          status: approval.status,
          reason: approval.reason || null,
          comment: approval.comment || null,
          createdAt: approval.createdAt,
          updatedAt: approval.updatedAt,
          employee: approval.employee
        })),
      };
      
      // แปลงสถานะใหม่ให้เป็นสถานะเดิมเพื่อความเข้ากันได้
      if (transformed.status === 'waiting_for_approve') {
        transformed.status = 'รออนุมัติ';
      } else if (transformed.status === 'approved') {
        transformed.status = 'อนุมัติ';
      } else if (transformed.status === 'rejected') {
        transformed.status = 'ไม่อนุมัติ';
      } else if (transformed.status === 'canceled') {
        transformed.status = 'ยกเลิกแล้ว';
      }
      
      // แปลงสถานะการยกเลิกตามที่ต้องการบนหน้าจอ
      if (transformed.cancelStatus === 'อนุมัติ') {
        transformed.cancelStatus = 'ยกเลิกแล้ว';
      } else if (transformed.cancelStatus === 'ไม่อนุมัติ') {
        // ถ้าเป็นการปฏิเสธการยกเลิก ให้กำหนดเป็น null เพื่อซ่อนปุ่มอนุมัติ/ปฏิเสธการยกเลิก
        transformed.cancelStatus = null;
      } else if (transformed.cancelStatus === 'รอยกเลิก') {
        transformed.cancelStatus = 'รออนุมัติ';
      }
      
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
    const leave = await prisma.leave.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            department: true,
            role: true,
            image: true,
            teamId: true
          }
        },
        approvals: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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
    
    // เรียงลำดับ approvals ตาม createdAt ใหม่ ให้ล่าสุดอยู่ก่อน
    leave.approvals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const lastApproval = leave.approvals[0] || null;
    const approveAction = leave.approvals.find(a => a.type === 'approve' && a.status === 'completed');
    const rejectAction = leave.approvals.find(a => a.type === 'reject' && a.status === 'completed');
    const requestCancelAction = leave.approvals.find(a => a.type === 'request_cancel' && a.status === 'completed');
    const approveCancelAction = leave.approvals.find(a => a.type === 'approve_cancel' && a.status === 'completed');
    const rejectCancelAction = leave.approvals.find(a => a.type === 'reject_cancel' && a.status === 'completed');
    
    // แปลงสถานะเพื่อให้เข้ากับ UI
    let statusText = leave.status;
    if (leave.status === 'waiting_for_approve') statusText = 'รออนุมัติ';
    else if (leave.status === 'approved') statusText = 'อนุมัติ';
    else if (leave.status === 'rejected') statusText = 'ไม่อนุมัติ';
    else if (leave.status === 'canceled') statusText = 'ยกเลิกแล้ว';
    
    // สร้างข้อมูลเพิ่มเติมเพื่อความเข้ากันได้กับ UI เดิม
    const transformedLeave = {
      ...leave,
      status: statusText,
      // ข้อมูลการอนุมัติ
      approvedBy: approveAction ? approveAction.employee : null,
      approvedAt: approveAction ? approveAction.createdAt : null,
      comment: approveAction ? approveAction.comment : (rejectAction ? rejectAction.comment : null),
      // ข้อมูลการยกเลิก
      cancelStatus: requestCancelAction && !approveCancelAction && !rejectCancelAction ? 'รออนุมัติ' :
                    approveCancelAction ? 'อนุมัติ' :
                    rejectCancelAction ? 'ไม่อนุมัติ' : null,
      cancelReason: requestCancelAction ? requestCancelAction.reason : null,
      cancelRequestBy: requestCancelAction ? requestCancelAction.employee : null,
      cancelRequestAt: requestCancelAction ? requestCancelAction.createdAt : null,
      cancelResponseBy: approveCancelAction ? approveCancelAction.employee : 
                        (rejectCancelAction ? rejectCancelAction.employee : null),
      cancelResponseAt: approveCancelAction ? approveCancelAction.createdAt :
                        (rejectCancelAction ? rejectCancelAction.createdAt : null),
      cancelResponseComment: approveCancelAction ? approveCancelAction.comment :
                            (rejectCancelAction ? rejectCancelAction.comment : null),
      isCancelled: approveCancelAction ? true : false,
      // เพิ่ม transactionLogs สำหรับหน้ารายละเอียด
      transactionLogs: leave.approvals.map(approval => ({
        id: approval.id,
        type: approval.type,
        status: approval.status,
        reason: approval.reason || null,
        comment: approval.comment || null,
        createdAt: approval.createdAt,
        updatedAt: approval.updatedAt,
        employee: approval.employee
      })),
    };
    
    return { success: true, data: transformedLeave };
  } catch (error) {
    console.error(`Error fetching leave with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับเพิ่มข้อมูลการลา
 */
export async function createLeave(data) {
  try {
    // ตรวจสอบว่าพนักงานมีอยู่จริงหรือไม่
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
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
    
    // สร้างข้อมูลการลาใหม่
    const newLeave = await prisma.leave.create({
      data: {
        employeeId: data.employeeId,
        leaveType: data.leaveType,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
        status: newStatus,
        leaveFormat: data.leaveFormat || 'เต็มวัน',
        totalDays: data.totalDays || 0,
        attachments: data.attachments || [],
      },
    });
    
    // ถ้ามีข้อมูลการอนุมัติ สร้าง approval record
    if (data.approvedById && data.approvedAt) {
      await prisma.leaveApproval.create({
        data: {
          leaveId: newLeave.id,
          employeeId: data.approvedById,
          type: data.status === 'อนุมัติ' ? 'approve' : 'reject',
          status: 'completed',
          comment: data.comment || null,
          createdAt: new Date(data.approvedAt),
        },
      });
    }
    
    // ดึงข้อมูลการลาพร้อมข้อมูลเพิ่มเติม
    const fullLeave = await getLeaveById(newLeave.id);
    
    return { success: true, data: fullLeave.data };
  } catch (error) {
    console.error('Error creating leave:', error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับอัปเดตข้อมูลการลา
 */
export async function updateLeave(id, data) {
  try {
    // ตรวจสอบว่ามีข้อมูลการลาหรือไม่
    const existingLeave = await prisma.leave.findUnique({
      where: { id },
      include: {
        approvals: true
      }
    });
    
    if (!existingLeave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    const updateData = {};
    const transactions = [];
    
    // ข้อมูลพื้นฐานที่อัปเดตได้เสมอ
    if (data.leaveType !== undefined) updateData.leaveType = data.leaveType;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.leaveFormat !== undefined) updateData.leaveFormat = data.leaveFormat;
    if (data.totalDays !== undefined) updateData.totalDays = data.totalDays;
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
      
      // ถ้าสถานะเป็นอนุมัติหรือไม่อนุมัติ สร้าง approval record
      if ((data.status === 'อนุมัติ' || data.status === 'ไม่อนุมัติ') && data.approvedById) {
        transactions.push(
          prisma.leaveApproval.create({
            data: {
              leaveId: id,
              employeeId: data.approvedById,
              type: data.status === 'อนุมัติ' ? 'approve' : 'reject',
              status: 'completed',
              comment: data.comment || null,
            },
          })
        );
      }
    }
    
    // อัปเดตข้อมูลการลาและสร้าง approval records ถ้ามี
    const [updatedLeave] = await prisma.$transaction([
      prisma.leave.update({
        where: { id },
        data: updateData,
      }),
      ...transactions
    ]);
    
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
    const existingLeave = await prisma.leave.findUnique({
      where: { id },
      include: {
        employee: true,
        approvals: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!existingLeave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    console.log('Existing Leave:', {
      id: existingLeave.id,
      status: existingLeave.status,
      numApprovals: existingLeave.approvals?.length || 0
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
    const pendingCancelRequest = existingLeave.approvals?.some(a => 
      a.type === 'request_cancel' && 
      a.status === 'completed' && 
      !existingLeave.approvals.some(b => 
        (b.type === 'approve_cancel' || b.type === 'reject_cancel') && 
        b.status === 'completed' && 
        b.createdAt > a.createdAt
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
        leaveId: id,
        employeeId: data.requestedById,
        type: 'request_cancel',
        status: 'completed',
        reason: data.cancelReason
      };
      
      console.log('Creating approval with data:', approvalData);
      
      const approval = await prisma.leaveApproval.create({
        data: approvalData
      });
      
      console.log('Created approval:', {
        id: approval.id,
        type: approval.type,
        employeeId: approval.employeeId
      });
      
      // ดึงข้อมูลการลาที่อัปเดตแล้วพร้อมข้อมูลเพิ่มเติม
      const fullLeave = await prisma.leave.findUnique({
        where: { id },
        include: {
          employee: true,
          approvals: {
            orderBy: { createdAt: 'desc' }
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
    const existingLeave = await prisma.leave.findUnique({
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
      prisma.leave.update({
        where: { id },
        data: {
          status: 'approved',
        },
      }),
      prisma.leaveApproval.create({
        data: {
          leaveId: id,
          employeeId: approverId,
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
    const existingLeave = await prisma.leave.findUnique({
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
      prisma.leave.update({
        where: { id },
        data: {
          status: 'rejected',
        },
      }),
      prisma.leaveApproval.create({
        data: {
          leaveId: id,
          employeeId: approverId,
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
    const existingLeave = await prisma.leave.findUnique({
      where: { id },
      include: {
        employee: true,
        approvals: {
          where: { 
            type: 'request_cancel',
            status: 'completed'
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!existingLeave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    // ตรวจสอบว่ามีคำขอยกเลิกหรือไม่
    if (!existingLeave.approvals || existingLeave.approvals.length === 0) {
      return { success: false, message: 'ไม่พบคำขอยกเลิกการลานี้' };
    }
    
    // ตรวจสอบว่าสถานะการลาเป็น "อนุมัติ" หรือไม่
    if (existingLeave.status !== 'อนุมัติ' && existingLeave.status !== 'approved') {
      return { success: false, message: 'สามารถอนุมัติการยกเลิกได้เฉพาะการลาที่อนุมัติแล้วเท่านั้น' };
    }
    
    // อัปเดตสถานะการลาและสร้าง approval record
    const [updatedLeave, newApproval] = await prisma.$transaction([
      prisma.leave.update({
        where: { id },
        data: {
          status: 'canceled',
        },
      }),
      prisma.leaveApproval.create({
        data: {
          leaveId: id,
          employeeId: approverId,
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
    console.error(`Error approving cancel leave with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับไม่อนุมัติการยกเลิกการลา (โครงสร้างใหม่ใช้ LeaveApproval)
 */
export async function rejectCancelLeave(id, approverId, comment = null) {
  try {
    // ตรวจสอบว่ามีข้อมูลการลาหรือไม่
    const existingLeave = await prisma.leave.findUnique({
      where: { id },
      include: {
        employee: true,
        approvals: {
          where: { 
            type: 'request_cancel',
            status: 'completed'
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!existingLeave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    // ตรวจสอบว่ามีคำขอยกเลิกหรือไม่
    if (!existingLeave.approvals || existingLeave.approvals.length === 0) {
      return { success: false, message: 'ไม่พบคำขอยกเลิกการลานี้' };
    }
    
    // ตรวจสอบว่าสถานะการลาเป็น "อนุมัติ" หรือไม่
    if (existingLeave.status !== 'อนุมัติ' && existingLeave.status !== 'approved') {
      return { success: false, message: 'สามารถปฏิเสธการยกเลิกได้เฉพาะการลาที่อนุมัติแล้วเท่านั้น' };
    }
    
    // สร้าง approval record สำหรับการไม่อนุมัติการยกเลิก
    const newApproval = await prisma.leaveApproval.create({
      data: {
        leaveId: id,
        employeeId: approverId,
        type: 'reject_cancel',
        status: 'completed',
        comment: comment,
      },
    });
    
    // ดึงข้อมูลการลาที่อัปเดตแล้วพร้อมข้อมูลเพิ่มเติม
    const fullLeave = await getLeaveById(id);
    
    return { success: true, data: fullLeave.data, message: 'ปฏิเสธการยกเลิกการลาเรียบร้อยแล้ว' };
  } catch (error) {
    console.error(`Error rejecting cancel leave with ID ${id}:`, error);
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
      where.employeeId = employeeId;
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
        WHERE employee_id = ${employeeId}
        GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
        ORDER BY year DESC, month DESC
      `;
      
      return { success: true, data: result };
    }
    
    // ดึงข้อมูลการทำงานล่วงเวลาทั้งหมด
    const overtimes = await prisma.overtime.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            position: true,
            department: true,
            departmentId: true,
            email: true,
            role: true,
            image: true,
            teamId: true,
          },
        },
        approvals: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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
      overtime.approvals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
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
        approvedBy: approveAction ? approveAction.employee : null,
        approvedAt: approveAction ? approveAction.createdAt : null,
        comment: approveAction ? approveAction.comment : (rejectAction ? rejectAction.comment : null),
        // ข้อมูลการยกเลิก
        cancelStatus: cancelStatus,
        cancelReason: requestCancelAction ? requestCancelAction.reason : null,
        cancelRequestBy: requestCancelAction ? requestCancelAction.employee : null,
        cancelRequestAt: requestCancelAction ? requestCancelAction.createdAt : null,
        cancelResponseBy: approveCancelAction ? approveCancelAction.employee : 
                         (rejectCancelAction ? rejectCancelAction.employee : null),
        cancelResponseAt: approveCancelAction ? approveCancelAction.createdAt :
                         (rejectCancelAction ? rejectCancelAction.createdAt : null),
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
    const overtime = await prisma.overtime.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            department: true,
            role: true,
            image: true,
            teamId: true
          }
        },
        approvals: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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
    overtime.approvals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
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
      approvedBy: approveAction ? approveAction.employee : null,
      approvedAt: approveAction ? approveAction.createdAt : null,
      comment: approveAction ? approveAction.comment : (rejectAction ? rejectAction.comment : null),
      // ข้อมูลการยกเลิก
      cancelStatus: cancelStatus,
      cancelReason: requestCancelAction ? requestCancelAction.reason : null,
      cancelRequestBy: requestCancelAction ? requestCancelAction.employee : null,
      cancelRequestAt: requestCancelAction ? requestCancelAction.createdAt : null,
      cancelResponseBy: approveCancelAction ? approveCancelAction.employee : 
                        (rejectCancelAction ? rejectCancelAction.employee : null),
      cancelResponseAt: approveCancelAction ? approveCancelAction.createdAt :
                        (rejectCancelAction ? rejectCancelAction.createdAt : null),
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
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
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
    const newOvertime = await prisma.overtime.create({
      data: {
        employeeId: data.employeeId,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        totalHours: parseFloat(data.totalHours),
        reason: data.reason,
        status: status,
      },
    });
    
    // ถ้ามีข้อมูลการอนุมัติ สร้าง approval record
    if (data.approvedById) {
      await prisma.overtimeApproval.create({
        data: {
          overtimeId: newOvertime.id,
          employeeId: data.approvedById,
          type: status === 'approved' ? 'approve' : 'reject',
          status: 'completed',
          comment: data.comment || null,
          createdAt: data.approvedAt ? new Date(data.approvedAt) : new Date(),
        },
      });
    }
    
    // ดึงข้อมูลการทำงานล่วงเวลาพร้อมข้อมูลเพิ่มเติม
    const fullOvertime = await getOvertimeById(newOvertime.id);
    
    return { success: true, data: fullOvertime.data };
  } catch (error) {
    console.error('Error creating overtime:', error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับอัปเดตข้อมูลการทำงานล่วงเวลา (โครงสร้างใหม่)
 */
export async function updateOvertimeNew(id, data) {
  try {
    // ตรวจสอบว่ามีข้อมูลการทำงานล่วงเวลาหรือไม่
    const existingOvertime = await prisma.overtime.findUnique({
      where: { id },
      include: {
        approvals: true
      }
    });
    
    if (!existingOvertime) {
      return { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' };
    }
    
    const updateData = {};
    const transactions = [];
    
    // ข้อมูลพื้นฐานที่อัปเดตได้เสมอ
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.totalHours !== undefined) updateData.totalHours = parseFloat(data.totalHours);
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
          prisma.overtimeApproval.create({
            data: {
              overtimeId: id,
              employeeId: data.approvedById,
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
      prisma.overtime.update({
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
    const existingOvertime = await prisma.overtime.findUnique({
      where: { id },
      include: {
        approvals: true
      }
    });
    
    if (!existingOvertime) {
      return { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' };
    }
    
    // ลบทั้ง OvertimeApproval และ Overtime ในชุดคำสั่งเดียว
    await prisma.$transaction([
      prisma.overtimeApproval.deleteMany({
        where: { overtimeId: id }
      }),
      prisma.overtime.delete({
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
    const totalEmployees = await prisma.employee.count({
      where: {
        isActive: true
      }
    });
    
    // ดึงจำนวนคำขอลาที่รออนุมัติ
    const pendingLeaves = await prisma.leave.count({
      where: {
        status: 'รออนุมัติ'
      }
    });
    
    // ดึงจำนวนคำขอทำงานล่วงเวลาที่รออนุมัติ
    const pendingOvertimes = await prisma.overtime.count({
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
    
    // ตรวจสอบว่ามี prisma.workStatus หรือไม่
    const hasWorkStatus = typeof prisma.workStatus !== 'undefined';
    
    // สร้าง Promise ทั้งหมดเพื่อดึงข้อมูลพร้อมกัน
    let employees = [], leaves = [], overtimes = [], workStatuses = [];
    
    if (hasWorkStatus) {
      // ถ้ามี workStatus model ให้ดึงข้อมูลทั้งหมดพร้อมกัน
      [employees, leaves, overtimes, workStatuses] = await Promise.all([
        // ดึงข้อมูลพนักงานเฉพาะที่ active และเฉพาะฟิลด์ที่จำเป็น
        prisma.employee.findMany({
          where: {
            isActive: true,
          },
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            department: true,
            role: true,
            image: true,
            teamId: true,
            teamData: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          },
          orderBy: {
            firstName: 'asc',
          },
        }),
        
        // ดึงข้อมูลการลาในช่วงเวลาที่กำหนด (เฉพาะที่ได้รับอนุมัติหรือรออนุมัติ)
        prisma.leave.findMany({
          where: {
            startDate: {
              lte: end,
            },
            endDate: {
              gte: start,
            },
            // เฉพาะที่ได้รับอนุมัติหรือรออนุมัติ
            status: {
              in: ['approved', 'waiting_for_approve']
            }
          },
          select: {
            id: true,
            employeeId: true,
            startDate: true,
            endDate: true,
            leaveType: true,
            totalDays: true,
            status: true,
            reason: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                teamId: true,
              },
            },
          },
        }),
        
        // ดึงข้อมูลการทำงานล่วงเวลาในช่วงเวลาที่กำหนด
        prisma.overtime.findMany({
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
            employeeId: true,
            date: true,
            startTime: true,
            endTime: true,
            totalHours: true,
            status: true,
            reason: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                teamId: true,
              },
            },
          },
        }),
        
        // ดึงข้อมูลสถานะการทำงาน
        prisma.workStatus.findMany({
          where: {
            date: {
              gte: start,
              lte: end,
            },
          },
          select: {
            id: true,
            employeeId: true,
            date: true,
            status: true,
            note: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                teamId: true,
                teamData: {
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
        prisma.employee.findMany({
          where: {
            isActive: true,
          },
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            department: true,
            role: true,
            image: true,
            teamId: true,
            teamData: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          },
          orderBy: {
            firstName: 'asc',
          },
        }),
        
        // ดึงข้อมูลการลาในช่วงเวลาที่กำหนด (เฉพาะที่ได้รับอนุมัติหรือรออนุมัติ)
        prisma.leave.findMany({
          where: {
            startDate: {
              lte: end,
            },
            endDate: {
              gte: start,
            },
            // เฉพาะที่ได้รับอนุมัติหรือรออนุมัติ
            status: {
              in: ['approved', 'waiting_for_approve']
            }
          },
          select: {
            id: true,
            employeeId: true,
            startDate: true,
            endDate: true,
            leaveType: true,
            totalDays: true,
            status: true,
            reason: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                teamId: true,
              },
            },
          },
        }),
        
        // ดึงข้อมูลการทำงานล่วงเวลาในช่วงเวลาที่กำหนด
        prisma.overtime.findMany({
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
            employeeId: true,
            date: true,
            startTime: true,
            endTime: true,
            totalHours: true,
            status: true,
            reason: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                teamId: true,
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
 * ฟังก์ชันสำหรับดึงข้อมูลสถานะการทำงาน (WFH)
 */
export async function getWorkStatuses(employeeId = null, date = null, startDate = null, endDate = null) {
  try {
    // ตรวจสอบว่ามี workStatus model หรือไม่
    if (typeof prisma.workStatus === 'undefined') {
      return {
        success: false,
        message: 'โมเดล workStatus ยังไม่พร้อมใช้งาน กรุณาตรวจสอบการติดตั้งฐานข้อมูล',
        data: []
      };
    }
    
    console.log('================ WORK STATUS FETCH DEBUG ================');
    
    const whereClause = {};
    
    if (employeeId) {
      whereClause.employeeId = employeeId;
      console.log('Filtering by employeeId:', employeeId);
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
    
    const workStatuses = await prisma.workStatus.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            teamId: true,
            teamData: true,
            department: true,
            image: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
    
    console.log(`Found ${workStatuses.length} work status records`);
    
    // แปลงวันที่ในผลลัพธ์ให้เป็น UTC เพื่อให้มีรูปแบบที่แน่นอน
    const processedResults = workStatuses.map(item => {
      if (item.date) {
        const dateObj = new Date(item.date);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();
        const day = dateObj.getDate();
        // ตั้งเวลาให้เป็น 12:00 น. UTC เพื่อป้องกันปัญหา timezone
        item.date = new Date(Date.UTC(year, month, day, 12, 0, 0));
      }
      return item;
    });
    
    if (processedResults.length > 0) {
      console.log('Sample processed results:');
      console.log('- First date:', processedResults[0].date?.toISOString());
      if (processedResults.length > 1) {
        console.log('- Last date:', processedResults[processedResults.length-1].date?.toISOString());
      }
    }
    
    console.log('===================================================');
    
    return {
      success: true,
      data: processedResults,
    };
  } catch (error) {
    console.error('Error fetching work statuses:', error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลสถานะการทำงาน (WFH) ตาม ID
 */
export async function getWorkStatusById(id) {
  try {
    const workStatus = await prisma.workStatus.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            department: true,
            image: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
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
 * ฟังก์ชันสำหรับสร้างหรืออัปเดตสถานะการทำงาน (WFH)
 */
export async function createOrUpdateWorkStatus(data) {
  try {
    const { employeeId, date, status, note, createdById } = data;
    
    // ตรวจสอบข้อมูลวันที่ที่รับเข้ามา
    console.log('================ WORK STATUS SAVE DEBUG ================');
    console.log('Input date:', date);
    
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
    
    // ตรวจสอบว่าพนักงานคนนี้มีสถานะการทำงานในวันนี้อยู่แล้วหรือไม่
    const existingWorkStatus = await prisma.workStatus.findFirst({
      where: {
        employeeId,
        date: formattedDate,
      },
    });
    
    if (existingWorkStatus) {
      // ถ้ามีข้อมูลอยู่แล้ว ให้อัปเดต
      console.log(`Updating existing work status (ID: ${existingWorkStatus.id}) for date ${formattedDate.toISOString()}`);
      
      return {
        success: true,
        data: await prisma.workStatus.update({
          where: { id: existingWorkStatus.id },
          data: {
            status,
            note,
            updatedById: createdById,
            updatedAt: new Date(),
          },
          include: {
            employee: true,
          },
        }),
        message: 'อัปเดตสถานะการทำงานเรียบร้อยแล้ว',
      };
    } else {
      // ถ้ายังไม่มีข้อมูล ให้สร้างใหม่
      console.log(`Creating new work status for date ${formattedDate.toISOString()}`);
      
      return {
        success: true,
        data: await prisma.workStatus.create({
          data: {
            employeeId,
            date: formattedDate,
            status,
            note,
            createdById,
          },
          include: {
            employee: true,
          },
        }),
        message: 'บันทึกสถานะการทำงานเรียบร้อยแล้ว',
      };
    }
  } catch (error) {
    console.error('Error in createOrUpdateWorkStatus:', error);
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message}`,
    };
  }
}

/**
 * ฟังก์ชันสำหรับลบสถานะการทำงาน (WFH)
 */
export async function deleteWorkStatus(id) {
  try {
    await prisma.workStatus.delete({
      where: { id },
    });
    
    return {
      success: true,
      message: 'ลบสถานะการทำงานสำเร็จ',
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
    const existingOvertime = await prisma.overtime.findUnique({
      where: { id },
      include: {
        approvals: true,
        employee: true
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
    const updatedOvertime = await prisma.overtime.update({
      where: { id },
      data: {
        status: 'approved',
        updatedAt: new Date()
      }
    });
    
    // บันทึกการอนุมัติลงในตาราง OvertimeApproval
    const approval = await prisma.overtimeApproval.create({
      data: {
        overtimeId: id,
        employeeId: data.approverId,
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
    const existingOvertime = await prisma.overtime.findUnique({
      where: { id },
      include: {
        approvals: true,
        employee: true
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
    const updatedOvertime = await prisma.overtime.update({
      where: { id },
      data: {
        status: 'rejected',
        updatedAt: new Date()
      }
    });
    
    // บันทึกการไม่อนุมัติลงในตาราง OvertimeApproval
    const approval = await prisma.overtimeApproval.create({
      data: {
        overtimeId: id,
        employeeId: data.approverId,
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
    const existingOvertime = await prisma.overtime.findUnique({
      where: { id },
      include: {
        approvals: {
          orderBy: { createdAt: 'desc' }
        },
        employee: true
      }
    });
    
    if (!existingOvertime) {
      return { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' };
    }
    
    // ตรวจสอบว่าเป็นการทำงานล่วงเวลาที่อนุมัติแล้วหรือไม่
    if (existingOvertime.status !== 'approved') {
      return { success: false, message: 'สามารถยกเลิกได้เฉพาะการทำงานล่วงเวลาที่อนุมัติแล้วเท่านั้น' };
    }
    
    // บันทึกคำขอยกเลิกการทำงานล่วงเวลาในตาราง OvertimeApproval
    const newApproval = await prisma.overtimeApproval.create({
      data: {
        overtimeId: id,
        employeeId: data.employeeId,
        type: 'request_cancel',
        status: 'completed',
        reason: data.reason,
      },
    });
    
    // ดึงข้อมูลการทำงานล่วงเวลาที่อัปเดตแล้วพร้อมข้อมูลเพิ่มเติม
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
    const existingOvertime = await prisma.overtime.findUnique({
      where: { id },
      include: {
        approvals: {
          orderBy: { createdAt: 'desc' }
        },
        employee: true
      }
    });
    
    if (!existingOvertime) {
      return { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' };
    }
    
    // ตรวจสอบว่ามีคำขอยกเลิกหรือไม่
    const requestCancelAction = existingOvertime.approvals.find(a => a.type === 'request_cancel' && a.status === 'completed');
    if (!requestCancelAction) {
      return { success: false, message: 'ไม่พบคำขอยกเลิกการทำงานล่วงเวลา' };
    }
    
    // ตรวจสอบว่าเป็นการทำงานล่วงเวลาที่อนุมัติแล้วหรือไม่
    if (existingOvertime.status !== 'approved') {
      return { success: false, message: 'สามารถอนุมัติการยกเลิกได้เฉพาะการทำงานล่วงเวลาที่อนุมัติแล้วเท่านั้น' };
    }
    
    // อัปเดตสถานะการทำงานล่วงเวลาเป็น canceled
    const updatedOvertime = await prisma.overtime.update({
      where: { id },
      data: {
        status: 'canceled',
        updatedAt: new Date()
      }
    });
    
    // บันทึกการอนุมัติยกเลิกลงในตาราง OvertimeApproval
    const approval = await prisma.overtimeApproval.create({
      data: {
        overtimeId: id,
        employeeId: data.approverId,
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
    const existingOvertime = await prisma.overtime.findUnique({
      where: { id },
      include: {
        approvals: {
          orderBy: { createdAt: 'desc' }
        },
        employee: true
      }
    });
    
    if (!existingOvertime) {
      return { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' };
    }
    
    // ตรวจสอบว่ามีคำขอยกเลิกหรือไม่
    const requestCancelAction = existingOvertime.approvals.find(a => a.type === 'request_cancel' && a.status === 'completed');
    if (!requestCancelAction) {
      return { success: false, message: 'ไม่พบคำขอยกเลิกการทำงานล่วงเวลา' };
    }
    
    // ตรวจสอบว่าเป็นการทำงานล่วงเวลาที่อนุมัติแล้วหรือไม่
    if (existingOvertime.status !== 'approved') {
      return { success: false, message: 'สามารถไม่อนุมัติการยกเลิกได้เฉพาะการทำงานล่วงเวลาที่อนุมัติแล้วเท่านั้น' };
    }
    
    // บันทึกการไม่อนุมัติยกเลิกลงในตาราง OvertimeApproval (ไม่มีการเปลี่ยนสถานะ Overtime)
    const approval = await prisma.overtimeApproval.create({
      data: {
        overtimeId: id,
        employeeId: data.approverId,
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
    const existingLeave = await prisma.leave.findUnique({
      where: { id }
    });
    
    if (!existingLeave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    // ลบข้อมูลการอนุมัติทั้งหมดที่เกี่ยวข้องก่อน
    await prisma.leaveApproval.deleteMany({
      where: { leaveId: id }
    });
    
    // ลบข้อมูลการลา
    const deletedLeave = await prisma.leave.delete({
      where: { id }
    });
    
    return { success: true, data: deletedLeave, message: 'ลบข้อมูลการลาเรียบร้อยแล้ว' };
  } catch (error) {
    console.error(`Error deleting leave with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
} 