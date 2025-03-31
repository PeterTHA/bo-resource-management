import { PrismaClient } from '@prisma/client';

// สร้าง Prisma Client instance
const prisma = global.prisma || new PrismaClient();

// ในสภาพแวดล้อมการพัฒนา (development) เก็บ instance ไว้ใน global
if (process.env.NODE_ENV === 'development') global.prisma = prisma;

// ส่งออก prisma instance เพื่อให้ไฟล์อื่นนำไปใช้ได้
export { prisma };

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
      // ค้นหา approval ล่าสุดตามประเภท
      const lastApproval = leave.approvals[0] || null;
      const approveAction = leave.approvals.find(a => a.type === 'approve' && a.status === 'completed');
      const rejectAction = leave.approvals.find(a => a.type === 'reject' && a.status === 'completed');
      const requestCancelAction = leave.approvals.find(a => a.type === 'request_cancel' && a.status === 'completed');
      const approveCancelAction = leave.approvals.find(a => a.type === 'approve_cancel' && a.status === 'completed');
      const rejectCancelAction = leave.approvals.find(a => a.type === 'reject_cancel' && a.status === 'completed');
      
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
        cancelStatus: approveCancelAction ? 'อนุมัติ' : (rejectCancelAction ? 'ไม่อนุมัติ' : (requestCancelAction ? 'รออนุมัติ' : null)),
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
    
    // แปลงข้อมูลเพื่อความเข้ากันได้กับโค้ดเดิม
    // ค้นหา approval ล่าสุดตามประเภท
    const approveAction = leave.approvals.find(a => a.type === 'approve' && a.status === 'completed');
    const rejectAction = leave.approvals.find(a => a.type === 'reject' && a.status === 'completed');
    const requestCancelAction = leave.approvals.find(a => a.type === 'request_cancel' && a.status === 'completed');
    const approveCancelAction = leave.approvals.find(a => a.type === 'approve_cancel' && a.status === 'completed');
    const rejectCancelAction = leave.approvals.find(a => a.type === 'reject_cancel' && a.status === 'completed');
    
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
      cancelStatus: approveCancelAction ? 'อนุมัติ' : (rejectCancelAction ? 'ไม่อนุมัติ' : (requestCancelAction ? 'รออนุมัติ' : null)),
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
    
    return { success: true, data: transformed };
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
    // ตรวจสอบว่ามีข้อมูลการลาหรือไม่
    const existingLeave = await prisma.leave.findUnique({
      where: { id },
      include: {
        approvals: {
          orderBy: { createdAt: 'desc' }
        },
        employee: true
      }
    });
    
    if (!existingLeave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    // ตรวจสอบว่าเป็นการลาที่อนุมัติแล้วหรือไม่
    if (existingLeave.status !== 'approved') {
      return { success: false, message: 'สามารถยกเลิกได้เฉพาะการลาที่อนุมัติแล้วเท่านั้น' };
    }
    
    // บันทึกคำขอยกเลิกการลาในตาราง LeaveApproval โดยไม่เปลี่ยนสถานะหลักของการลาและไม่ลบรายการเดิม
    const newApproval = await prisma.leaveApproval.create({
      data: {
        leaveId: id,
        employeeId: data.employeeId,
        type: 'request_cancel',
        status: 'completed',
        reason: data.reason,
      },
    });
    
    // ดึงข้อมูลการลาที่อัปเดตแล้วพร้อมข้อมูลเพิ่มเติม
    const fullLeave = await getLeaveById(id);
    
    return { 
      success: true, 
      data: fullLeave.data,
      message: 'ส่งคำขอยกเลิกการลาเรียบร้อยแล้ว กรุณารอการอนุมัติ'
    };
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
 * ฟังก์ชันสำหรับอนุมัติการยกเลิกการลา
 */
export async function approveCancelLeave(id, approverId, comment = null) {
  try {
    // ตรวจสอบว่ามีข้อมูลการลาหรือไม่
    const existingLeave = await prisma.leave.findUnique({
      where: { id },
      include: {
        approvals: {
          where: { type: 'request_cancel', status: 'completed' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!existingLeave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    // ตรวจสอบว่ามีการขอยกเลิกหรือไม่
    if (existingLeave.approvals.length === 0) {
      return { success: false, message: 'ไม่พบคำขอยกเลิกการลานี้' };
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
 * ฟังก์ชันสำหรับไม่อนุมัติการยกเลิกการลา
 */
export async function rejectCancelLeave(id, approverId, comment = null) {
  try {
    // ตรวจสอบว่ามีข้อมูลการลาหรือไม่
    const existingLeave = await prisma.leave.findUnique({
      where: { id },
      include: {
        approvals: {
          where: { type: 'request_cancel', status: 'completed' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!existingLeave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    // ตรวจสอบว่ามีการขอยกเลิกหรือไม่
    if (existingLeave.approvals.length === 0) {
      return { success: false, message: 'ไม่พบคำขอยกเลิกการลานี้' };
    }
    
    // สร้าง approval record สำหรับการปฏิเสธการยกเลิก (คงสถานะ approved ไว้เหมือนเดิม)
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
export async function getOvertimes(employeeId = null) {
  try {
    const whereClause = employeeId ? { employeeId } : {};
    
    const overtimes = await prisma.overtime.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc'
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
          }
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            image: true,
          }
        },
        cancelRequestBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            image: true,
          }
        },
        cancelledBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            image: true,
          }
        }
      }
    });
    
    return { success: true, data: overtimes };
  } catch (error) {
    console.error('Error fetching overtimes:', error);
    return { success: false, message: error.message, connectionError: true };
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
            department: true,
            departmentId: true,
            position: true,
            email: true,
            image: true,
            role: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
        cancelRequestBy: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
        cancelledBy: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
        cancelResponseBy: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
      },
    });
    
    if (!overtime) {
      return { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' };
    }
    
    return { success: true, data: overtime };
  } catch (error) {
    console.error(`Error fetching overtime with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับเพิ่มข้อมูลการทำงานล่วงเวลา
 */
export async function createOvertime(data) {
  try {
    // ตรวจสอบว่าพนักงานมีอยู่จริงหรือไม่
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
    });
    
    if (!employee) {
      return { success: false, message: 'ไม่พบข้อมูลพนักงาน' };
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
        status: data.status || 'รออนุมัติ',
        approvedById: data.approvedById || null,
        approvedAt: data.approvedAt ? new Date(data.approvedAt) : null,
        comment: data.comment || null,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    return { success: true, data: newOvertime };
  } catch (error) {
    console.error('Error creating overtime:', error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับอัปเดตข้อมูลการทำงานล่วงเวลา
 */
export async function updateOvertime(id, data) {
  try {
    // เตรียมข้อมูลสำหรับอัปเดต
    const updateData = {};
    
    // เพิ่มเฉพาะฟิลด์ที่ส่งมา
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.totalHours !== undefined) updateData.totalHours = parseFloat(data.totalHours);
    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.comment !== undefined) updateData.comment = data.comment;
    
    // ข้อมูลการอนุมัติ
    if (data.approvedById !== undefined) updateData.approvedById = data.approvedById;
    if (data.approvedAt !== undefined) updateData.approvedAt = data.approvedAt ? new Date(data.approvedAt) : null;
    
    // ข้อมูลการขอยกเลิก
    if (data.cancelStatus !== undefined) updateData.cancelStatus = data.cancelStatus;
    if (data.cancelRequestById !== undefined) updateData.cancelRequestById = data.cancelRequestById;
    if (data.cancelRequestAt !== undefined) updateData.cancelRequestAt = data.cancelRequestAt ? new Date(data.cancelRequestAt) : null;
    if (data.cancelReason !== undefined) updateData.cancelReason = data.cancelReason;
    
    // ข้อมูลการอนุมัติการยกเลิก
    if (data.isCancelled !== undefined) updateData.isCancelled = data.isCancelled;
    if (data.cancelledById !== undefined) updateData.cancelledById = data.cancelledById;
    if (data.cancelledAt !== undefined) updateData.cancelledAt = data.cancelledAt ? new Date(data.cancelledAt) : null;
    
    // ข้อมูลการตอบกลับคำขอยกเลิก
    if (data.cancelResponseById !== undefined) updateData.cancelResponseById = data.cancelResponseById;
    if (data.cancelResponseAt !== undefined) updateData.cancelResponseAt = data.cancelResponseAt ? new Date(data.cancelResponseAt) : null;
    if (data.cancelResponseComment !== undefined) updateData.cancelResponseComment = data.cancelResponseComment;
    
    // อัปเดตข้อมูลการทำงานล่วงเวลา
    const updatedOvertime = await prisma.overtime.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            department: true,
            departmentId: true,
            position: true,
            email: true,
            role: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        cancelRequestBy: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        cancelledBy: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        cancelResponseBy: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    return { success: true, data: updatedOvertime };
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
    await prisma.overtime.delete({
      where: { id },
    });
    
    return { success: true, message: 'ลบข้อมูลการทำงานล่วงเวลาสำเร็จ' };
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
 * ฟังก์ชันสำหรับดึงข้อมูลปฏิทินพนักงาน
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
    
    // ดึงข้อมูลพนักงานทั้งหมด
    const employees = await prisma.employee.findMany({
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
      },
      orderBy: {
        firstName: 'asc',
      },
    });
    
    // ดึงข้อมูลการลาในช่วงเวลาที่กำหนด
    const leaves = await prisma.leave.findMany({
      where: {
        startDate: {
          lte: end,
        },
        endDate: {
          gte: start,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            department: true,
            image: true,
            teamId: true,
          },
        },
      },
    });
    
    // ดึงข้อมูลการทำงานล่วงเวลาในช่วงเวลาที่กำหนด
    const overtimes = await prisma.overtime.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            department: true,
            image: true,
            teamId: true,
          },
        },
      },
    });
    
    // ดึงข้อมูลสถานะการทำงาน (WFH)
    const workStatuses = await prisma.workStatus.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
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
export async function getWorkStatuses(employeeId = null, date = null) {
  try {
    const whereClause = {};
    
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }
    
    if (date) {
      whereClause.date = new Date(date);
    }
    
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
    
    // แปลงวันที่จากสตริงเป็น Date object ถ้าจำเป็น
    const dateObj = new Date(date);
    
    // แก้ไขการเตรียมวันที่ให้ถูกต้องตาม timezone
    // เปลี่ยนจากการใช้ UTC เป็นการใช้วันที่เหมือนกับที่เลือกจริงๆ โดยการตัดเวลาออก
    // สร้างวันที่ใหม่ โดยใช้เฉพาะส่วนของวันที่ เดือน ปี แบบ local time เพื่อป้องกันการคลาดเคลื่อนจาก timezone
    const localDateStr = dateObj.toLocaleDateString('en-CA'); // ใช้ format YYYY-MM-DD เช่น 2023-09-15
    const formattedDate = new Date(localDateStr + 'T00:00:00.000Z');
    
    console.log('Saving work status for date:', date);
    console.log('Input date as string:', date);
    console.log('Input date as object:', dateObj.toISOString());
    console.log('Local date string:', localDateStr);
    console.log('Formatted date to save:', formattedDate.toISOString());
    
    // ค้นหาว่ามีข้อมูลอยู่แล้วหรือไม่
    const existingWorkStatus = await prisma.workStatus.findFirst({
      where: {
        employeeId,
        date: formattedDate,
      },
    });
    
    // ถ้ามีข้อมูลอยู่แล้ว ให้อัปเดต
    if (existingWorkStatus) {
      const updatedWorkStatus = await prisma.workStatus.update({
        where: { id: existingWorkStatus.id },
        data: {
          status,
          note,
          createdById,
        },
      });
      
      return {
        success: true,
        data: updatedWorkStatus,
        message: 'อัปเดตสถานะการทำงานสำเร็จ',
      };
    }
    
    // ถ้ายังไม่มีข้อมูล ให้สร้างใหม่
    const newWorkStatus = await prisma.workStatus.create({
      data: {
        employeeId,
        date: formattedDate,
        status,
        note,
        createdById,
      },
    });
    
    return {
      success: true,
      data: newWorkStatus,
      message: 'สร้างสถานะการทำงานสำเร็จ',
    };
  } catch (error) {
    console.error('Error creating/updating work status:', error);
    return { success: false, message: error.message };
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