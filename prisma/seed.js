const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('เริ่มต้นการเพิ่มข้อมูลมาสเตอร์...');

  // เพิ่มข้อมูลตำแหน่ง (positions)
  console.log('กำลังเพิ่มข้อมูลตำแหน่ง...');
  const positions = [
    { code: 'PM', name: 'Project Manager', category: 'management', description: 'ผู้จัดการโครงการ' },
    { code: 'BU', name: 'Business Analyst', category: 'management', description: 'นักวิเคราะห์ธุรกิจ' },
    { code: 'QA', name: 'Quality Assurance', category: 'testing', description: 'ผู้ทดสอบคุณภาพซอฟต์แวร์' },
    { code: 'SA', name: 'System Analyst', category: 'development', description: 'นักวิเคราะห์ระบบ' },
    { code: 'DEVOPS', name: 'DevOps Engineer', category: 'devops', description: 'วิศวกร DevOps' },
    { code: 'FE', name: 'Frontend Developer', category: 'development', description: 'นักพัฒนาฝั่งลูกข่าย' },
    { code: 'BE', name: 'Backend Developer', category: 'development', description: 'นักพัฒนาฝั่งแม่ข่าย' },
    { code: 'FS', name: 'Fullstack Developer', category: 'development', description: 'นักพัฒนาทั้งฝั่งลูกข่ายและแม่ข่าย' },
    { code: 'MOB', name: 'Mobile Developer', category: 'development', description: 'นักพัฒนาแอปพลิเคชันมือถือ' },
    { code: 'PS', name: 'Production Support', category: 'support', description: 'ผู้ดูแลระบบการผลิต' },
    { code: 'UX', name: 'UX/UI Designer', category: 'design', description: 'นักออกแบบประสบการณ์และส่วนติดต่อผู้ใช้' },
    { code: 'TL', name: 'Technical Lead', category: 'management', description: 'หัวหน้าทีมเทคนิค' },
  ];

  for (const position of positions) {
    await prisma.position.upsert({
      where: { code: position.code },
      update: position,
      create: position,
    });
  }

  // เพิ่มข้อมูลระดับตำแหน่ง (position levels)
  console.log('กำลังเพิ่มข้อมูลระดับตำแหน่ง...');
  const positionLevels = [
    { code: 'INTERN', name: 'Intern', level: 1, description: 'นักศึกษาฝึกงาน' },
    { code: 'JR', name: 'Junior', level: 2, description: 'ระดับเริ่มต้น' },
    { code: 'MID', name: 'Mid', level: 3, description: 'ระดับกลาง' }, 
    { code: 'SR', name: 'Senior', level: 4, description: 'ระดับอาวุโส' },
    { code: 'LEAD', name: 'Lead', level: 5, description: 'ระดับหัวหน้า' },
    { code: 'PRINCIPAL', name: 'Principal', level: 6, description: 'ระดับหลัก' },
    { code: 'DIRECTOR', name: 'Director', level: 7, description: 'ระดับผู้อำนวยการ' },
  ];

  for (const level of positionLevels) {
    await prisma.positionLevel.upsert({
      where: { code: level.code },
      update: level,
      create: level,
    });
  }

  // เพิ่มข้อมูลทีม
  const teams = [
    { code: 'BO', name: 'Banking Operation', description: 'ทีมปฏิบัติการธนาคาร' },
    { code: 'OB', name: 'Open Banking', description: 'ทีมโอเพ่นแบงค์กิ้ง' },
    { code: 'QA', name: 'Quality Assurance', description: 'ทีมประกันคุณภาพ' },
    { code: 'PM', name: 'Project Manager', description: 'ทีมผู้จัดการโครงการ' },
    { code: 'AD', name: 'Admin', description: 'ทีมผู้ดูแลระบบ' },
  ];

  console.log('กำลังเพิ่มข้อมูลทีม...');
  for (const team of teams) {
    await prisma.team.upsert({
      where: { code: team.code },
      update: team,
      create: team,
    });
  }

  // เพิ่มข้อมูลแผนก
  const departments = [
    { code: 'IT', name: 'IT', description: 'แผนกไอที' },
    { code: 'ITDG', name: 'IT - Digital', description: 'แผนกไอทีดิจิทัล' },
    { code: 'BUDG', name: 'BU - Digital', description: 'แผนกธุรกิจดิจิทัล' },
  ];

  console.log('กำลังเพิ่มข้อมูลแผนก...');
  for (const department of departments) {
    await prisma.department.upsert({
      where: { code: department.code },
      update: department,
      create: department,
    });
  }

  // สร้างผู้ใช้ admin (ถ้ายังไม่มี)
  const admin = await prisma.employee.findFirst({
    where: { role: 'admin' }
  });

  if (!admin) {
    console.log('กำลังสร้างผู้ใช้ admin...');
    
    // หาข้อมูล reference
    const adminTeam = await prisma.team.findUnique({ where: { code: 'AD' } });
    const itDepartment = await prisma.department.findUnique({ where: { code: 'IT' } });
    
    // สร้าง admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.employee.create({
      data: {
        employeeId: 'ADMIN001',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: hashedPassword,
        position: 'System Administrator',
        departmentId: itDepartment?.id,
        teamId: adminTeam?.id,
        hireDate: new Date(),
        role: 'admin',
        isActive: true
      }
    });
  }

  console.log('การเพิ่มข้อมูลมาสเตอร์เสร็จสมบูรณ์');
}

main()
  .catch((e) => {
    console.error('เกิดข้อผิดพลาดในการเพิ่มข้อมูล:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 