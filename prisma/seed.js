const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('เริ่มต้นการเพิ่มข้อมูลตัวอย่าง...');

  // เข้ารหัสรหัสผ่าน
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);

  // สร้างผู้ใช้ admin
  const admin = await prisma.employee.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      employeeId: 'ADMIN001',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: hashedPassword,
      position: 'Administrator',
      department: 'IT',
      hireDate: new Date('2023-01-01'),
      role: 'admin',
      isActive: true,
    },
  });

  // สร้างผู้ใช้ manager
  const manager = await prisma.employee.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      employeeId: 'MGR001',
      firstName: 'Manager',
      lastName: 'User',
      email: 'manager@example.com',
      password: hashedPassword,
      position: 'Manager',
      department: 'HR',
      hireDate: new Date('2023-01-15'),
      role: 'manager',
      isActive: true,
    },
  });

  // สร้างผู้ใช้ employee
  const employee = await prisma.employee.upsert({
    where: { email: 'employee@example.com' },
    update: {},
    create: {
      employeeId: 'EMP001',
      firstName: 'Employee',
      lastName: 'User',
      email: 'employee@example.com',
      password: hashedPassword,
      position: 'Staff',
      department: 'Marketing',
      hireDate: new Date('2023-02-01'),
      role: 'employee',
      isActive: true,
    },
  });

  // สร้างข้อมูลการลา
  const leave = await prisma.leave.create({
    data: {
      employeeId: employee.id,
      leaveType: 'ลาป่วย',
      startDate: new Date('2023-05-01'),
      endDate: new Date('2023-05-03'),
      reason: 'ไม่สบาย',
      status: 'รออนุมัติ',
    },
  });

  // สร้างข้อมูลการทำงานล่วงเวลา
  const overtime = await prisma.overtime.create({
    data: {
      employeeId: employee.id,
      date: new Date('2023-06-01'),
      startTime: '17:00',
      endTime: '20:00',
      totalHours: 3,
      reason: 'ทำงานไม่เสร็จ',
      status: 'รออนุมัติ',
    },
  });

  console.log('เพิ่มข้อมูลตัวอย่างสำเร็จ!');
  console.log(`สร้างผู้ใช้ admin: ${admin.email}`);
  console.log(`สร้างผู้ใช้ manager: ${manager.email}`);
  console.log(`สร้างผู้ใช้ employee: ${employee.email}`);
  console.log(`สร้างข้อมูลการลา ID: ${leave.id}`);
  console.log(`สร้างข้อมูลการทำงานล่วงเวลา ID: ${overtime.id}`);
}

main()
  .catch((e) => {
    console.error('เกิดข้อผิดพลาดในการเพิ่มข้อมูลตัวอย่าง:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 