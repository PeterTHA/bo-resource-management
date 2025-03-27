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
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          }
        },
        cancelApprovedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          }
        }
      }
    });
    
    return { success: true, data: leaves };
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
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            role: true
          }
        },
        cancelApprovedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            role: true
          }
        }
      }
    });
    
    if (!leave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    return { success: true, data: leave };
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
    
    // สร้างข้อมูลการลาใหม่
    const newLeave = await prisma.leave.create({
      data: {
        employeeId: data.employeeId,
        leaveType: data.leaveType,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
        status: data.status || 'รออนุมัติ',
        leaveFormat: data.leaveFormat || 'เต็มวัน',
        totalDays: data.totalDays || 0,
        attachments: data.attachments || [],
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
            image: true,
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
    
    return { success: true, data: newLeave };
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
    // เตรียมข้อมูลสำหรับอัปเดต
    const updateData = {};
    
    // เพิ่มเฉพาะฟิลด์ที่ส่งมา
    if (data.leaveType !== undefined) updateData.leaveType = data.leaveType;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.leaveFormat !== undefined) updateData.leaveFormat = data.leaveFormat;
    if (data.totalDays !== undefined) updateData.totalDays = data.totalDays;
    if (data.attachments !== undefined) updateData.attachments = data.attachments;
    if (data.approvedById !== undefined) updateData.approvedById = data.approvedById;
    if (data.comment !== undefined) updateData.comment = data.comment;
    
    // ถ้ามีการอัปเดตสถานะเป็นอนุมัติหรือไม่อนุมัติ ให้บันทึกเวลาที่อนุมัติด้วย
    if (data.status === 'อนุมัติ' || data.status === 'ไม่อนุมัติ') {
      updateData.approvedAt = new Date();
    }
    
    // อัปเดตข้อมูลการลา
    const updatedLeave = await prisma.leave.update({
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
            position: true,
            image: true,
            role: true
          },
        },
        approvedBy: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            position: true,
            role: true
          },
        },
      },
    });
    
    return { success: true, data: updatedLeave };
  } catch (error) {
    console.error(`Error updating leave with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับลบข้อมูลการลา
 */
export async function deleteLeave(id) {
  try {
    await prisma.leave.delete({
      where: { id },
    });
    
    return { success: true, message: 'ลบข้อมูลการลาเรียบร้อยแล้ว' };
  } catch (error) {
    console.error(`Error deleting leave with ID ${id}:`, error);
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
    });
    
    if (!existingLeave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    // ตรวจสอบว่าเป็นการลาที่อนุมัติแล้วหรือไม่
    if (existingLeave.status !== 'อนุมัติ') {
      return { success: false, message: 'สามารถยกเลิกได้เฉพาะการลาที่อนุมัติแล้วเท่านั้น' };
    }
    
    // ตรวจสอบวันที่ลาเทียบกับวันปัจจุบัน
    const today = new Date();
    today.setHours(0, 0, 0, 0); // กำหนดเวลาเป็น 00:00:00
    const startDate = new Date(existingLeave.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    // ถ้าวันที่เริ่มลายังไม่ถึง สามารถยกเลิกได้ทันที (ไม่ต้องรออนุมัติ)
    const isAutoCancel = startDate > today;
    
    // อัปเดตข้อมูลการลา
    const updatedLeave = await prisma.leave.update({
      where: { id },
      data: {
        isCancelled: isAutoCancel,
        cancelReason: data.reason,
        cancelRequestedAt: new Date(),
        cancelStatus: isAutoCancel ? 'อนุมัติ' : 'รออนุมัติ',
        cancelApprovedById: isAutoCancel ? data.employeeId : null,
        cancelApprovedAt: isAutoCancel ? new Date() : null,
      },
    });
    
    return { 
      success: true, 
      data: updatedLeave,
      message: isAutoCancel 
        ? 'ยกเลิกการลาเรียบร้อยแล้ว' 
        : 'ส่งคำขอยกเลิกการลาเรียบร้อยแล้ว กรุณารอการอนุมัติ'
    };
  } catch (error) {
    console.error(`Error requesting cancel leave with ID ${id}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับอนุมัติการยกเลิกการลา
 */
export async function approveCancelLeave(id, approverId) {
  try {
    // ตรวจสอบว่ามีข้อมูลการลาหรือไม่
    const existingLeave = await prisma.leave.findUnique({
      where: { id },
    });
    
    if (!existingLeave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    // ตรวจสอบว่าเป็นการขอยกเลิกที่รออนุมัติหรือไม่
    if (existingLeave.cancelStatus !== 'รออนุมัติ') {
      return { success: false, message: 'ไม่สามารถอนุมัติการยกเลิกนี้ได้ เนื่องจากไม่ได้อยู่ในสถานะรออนุมัติ' };
    }
    
    // อัปเดตข้อมูลการลา
    const updatedLeave = await prisma.leave.update({
      where: { id },
      data: {
        isCancelled: true,
        cancelStatus: 'อนุมัติ',
        cancelApprovedById: approverId,
        cancelApprovedAt: new Date(),
      },
    });
    
    return { success: true, data: updatedLeave, message: 'อนุมัติการยกเลิกการลาเรียบร้อยแล้ว' };
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
    });
    
    if (!existingLeave) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    // ตรวจสอบว่าเป็นการขอยกเลิกที่รออนุมัติหรือไม่
    if (existingLeave.cancelStatus !== 'รออนุมัติ') {
      return { success: false, message: 'ไม่สามารถปฏิเสธการยกเลิกนี้ได้ เนื่องจากไม่ได้อยู่ในสถานะรออนุมัติ' };
    }
    
    // อัปเดตข้อมูลการลา
    const updatedLeave = await prisma.leave.update({
      where: { id },
      data: {
        cancelStatus: 'ไม่อนุมัติ',
        cancelApprovedById: approverId,
        cancelApprovedAt: new Date(),
        cancelComment: comment,
      },
    });
    
    return { success: true, data: updatedLeave, message: 'ปฏิเสธการยกเลิกการลาเรียบร้อยแล้ว' };
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
      },
      orderBy: {
        firstName: 'asc',
      },
    });
    
    // ดึงข้อมูลการลาในช่วงเวลาที่กำหนด
    const leaves = await prisma.leave.findMany({
      where: {
        startDate: {
          lte: new Date(endDate),
        },
        endDate: {
          gte: new Date(startDate),
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
          },
        },
      },
    });
    
    // ดึงข้อมูลการทำงานล่วงเวลาในช่วงเวลาที่กำหนด
    const overtimes = await prisma.overtime.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
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
          },
        },
      },
    });
    
    return {
      success: true,
      data: {
        employees,
        leaves,
        overtimes,
      },
    };
  } catch (error) {
    console.error('Error fetching employee calendar data:', error);
    return { success: false, message: error.message };
  }
} 