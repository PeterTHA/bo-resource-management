import { PrismaClient } from '@prisma/client';

// สร้าง Prisma Client instance
const prisma = global.prisma || new PrismaClient();

// ในสภาพแวดล้อมการพัฒนา (development) เก็บ instance ไว้ใน global
if (process.env.NODE_ENV === 'development') global.prisma = prisma;

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
 */
export async function getLeaves(employeeId = null) {
  try {
    const whereClause = employeeId ? { employeeId } : {};
    
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
          }
        },
        approvedBy: {
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
    if (data.approvedBy !== undefined) updateData.approvedById = data.approvedBy;
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
    
    return { success: true, message: 'ลบข้อมูลการลาสำเร็จ' };
  } catch (error) {
    console.error(`Error deleting leave with ID ${id}:`, error);
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
          }
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
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
    if (data.approvedBy !== undefined) updateData.approvedById = data.approvedBy;
    if (data.comment !== undefined) updateData.comment = data.comment;
    
    // ถ้ามีการอัปเดตสถานะเป็นอนุมัติหรือไม่อนุมัติ ให้บันทึกเวลาที่อนุมัติด้วย
    if (data.status === 'อนุมัติ' || data.status === 'ไม่อนุมัติ') {
      updateData.approvedAt = new Date();
    }
    
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
 * ฟังก์ชันสำหรับดึงข้อมูลสถิติ
 */
export async function getStatistics() {
  try {
    // จำนวนพนักงานทั้งหมด
    const totalEmployees = await prisma.employee.count({
      where: { isActive: true },
    });
    
    // จำนวนการลาที่รออนุมัติ
    const pendingLeaves = await prisma.leave.count({
      where: { status: 'รออนุมัติ' },
    });
    
    // จำนวนการทำงานล่วงเวลาที่รออนุมัติ
    const pendingOvertimes = await prisma.overtime.count({
      where: { status: 'รออนุมัติ' },
    });
    
    // จำนวนพนักงานแยกตามแผนก
    const departmentStats = await prisma.employee.groupBy({
      by: ['department'],
      _count: { id: true },
      where: { isActive: true },
    });
    
    // จำนวนการลาในเดือนปัจจุบัน
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const leavesThisMonth = await prisma.leave.count({
      where: {
        startDate: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });
    
    // จำนวนชั่วโมงการทำงานล่วงเวลาในเดือนปัจจุบัน
    const overtimesThisMonth = await prisma.overtime.findMany({
      where: {
        date: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
        status: 'อนุมัติ',
      },
      select: {
        totalHours: true,
      },
    });
    
    const totalOvertimeHours = overtimesThisMonth.reduce(
      (total, overtime) => total + overtime.totalHours,
      0
    );
    
    return {
      success: true,
      data: {
        totalEmployees,
        pendingLeaves,
        pendingOvertimes,
        departmentStats: departmentStats.map(dept => ({
          department: dept.department,
          count: dept._count.id,
        })),
        leavesThisMonth,
        totalOvertimeHours,
      },
    };
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return { success: false, message: error.message, connectionError: true };
  }
}

export default prisma; 