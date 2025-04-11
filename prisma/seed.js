const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('เริ่มต้นการเพิ่มข้อมูลมาสเตอร์...');

  // เพิ่มข้อมูลตำแหน่ง (positions)
  console.log('กำลังเพิ่มข้อมูลตำแหน่ง...');
  const positions = [
    { id: uuidv4(), code: 'PM', name: 'Project Manager', category: 'management', description: 'ผู้จัดการโครงการ', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'BU', name: 'Business Analyst', category: 'management', description: 'นักวิเคราะห์ธุรกิจ', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'QA', name: 'Quality Assurance', category: 'testing', description: 'ผู้ทดสอบคุณภาพซอฟต์แวร์', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'SA', name: 'System Analyst', category: 'development', description: 'นักวิเคราะห์ระบบ', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'DEVOPS', name: 'DevOps Engineer', category: 'devops', description: 'วิศวกร DevOps', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'FE', name: 'Frontend Developer', category: 'development', description: 'นักพัฒนาฝั่งลูกข่าย', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'BE', name: 'Backend Developer', category: 'development', description: 'นักพัฒนาฝั่งแม่ข่าย', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'FS', name: 'Fullstack Developer', category: 'development', description: 'นักพัฒนาทั้งฝั่งลูกข่ายและแม่ข่าย', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'MOB', name: 'Mobile Developer', category: 'development', description: 'นักพัฒนาแอปพลิเคชันมือถือ', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'PS', name: 'Production Support', category: 'support', description: 'ผู้ดูแลระบบการผลิต', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'UX', name: 'UX/UI Designer', category: 'design', description: 'นักออกแบบประสบการณ์และส่วนติดต่อผู้ใช้', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'TL', name: 'Technical Lead', category: 'management', description: 'หัวหน้าทีมเทคนิค', is_active: true, created_at: new Date(), updated_at: new Date() },
  ];

  for (const position of positions) {
    await prisma.positions.upsert({
      where: { code: position.code },
      update: position,
      create: position,
    });
  }

  // เพิ่มข้อมูลระดับตำแหน่ง (position levels)
  console.log('กำลังเพิ่มข้อมูลระดับตำแหน่ง...');
  const positionLevels = [
    { id: uuidv4(), code: 'INTERN', name: 'Intern', level: 1, description: 'นักศึกษาฝึกงาน', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'JR', name: 'Junior', level: 2, description: 'ระดับเริ่มต้น', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'MID', name: 'Mid', level: 3, description: 'ระดับกลาง', is_active: true, created_at: new Date(), updated_at: new Date() }, 
    { id: uuidv4(), code: 'SR', name: 'Senior', level: 4, description: 'ระดับอาวุโส', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'LEAD', name: 'Lead', level: 5, description: 'ระดับหัวหน้า', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'PRINCIPAL', name: 'Principal', level: 6, description: 'ระดับหลัก', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'DIRECTOR', name: 'Director', level: 7, description: 'ระดับผู้อำนวยการ', is_active: true, created_at: new Date(), updated_at: new Date() },
  ];

  for (const level of positionLevels) {
    await prisma.position_levels.upsert({
      where: { code: level.code },
      update: level,
      create: level,
    });
  }

  // เพิ่มข้อมูลทีม
  const teams = [
    { id: uuidv4(), code: 'BO', name: 'Banking Operation', description: 'ทีมปฏิบัติการธนาคาร', created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'OB', name: 'Open Banking', description: 'ทีมโอเพ่นแบงค์กิ้ง', created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'QA', name: 'Quality Assurance', description: 'ทีมประกันคุณภาพ', created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'PM', name: 'Project Manager', description: 'ทีมผู้จัดการโครงการ', created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'AD', name: 'Admin', description: 'ทีมผู้ดูแลระบบ', created_at: new Date(), updated_at: new Date() },
  ];

  console.log('กำลังเพิ่มข้อมูลทีม...');
  for (const team of teams) {
    await prisma.teams.upsert({
      where: { code: team.code },
      update: team,
      create: team,
    });
  }

  // เพิ่มข้อมูลแผนก
  const departments = [
    { id: uuidv4(), code: 'IT', name: 'IT', description: 'แผนกไอที', created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'ITDG', name: 'IT - Digital', description: 'แผนกไอทีดิจิทัล', created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'BUDG', name: 'BU - Digital', description: 'แผนกธุรกิจดิจิทัล', created_at: new Date(), updated_at: new Date() },
  ];

  console.log('กำลังเพิ่มข้อมูลแผนก...');
  for (const department of departments) {
    await prisma.departments.upsert({
      where: { code: department.code },
      update: department,
      create: department,
    });
  }

  // เพิ่มข้อมูล roles 
  console.log('กำลังเพิ่มข้อมูลบทบาท...');
  const roles = [
    { id: uuidv4(), code: 'ADMIN', name: 'admin', name_th: 'ผู้ดูแลระบบ', description: 'ผู้ดูแลระบบหลัก', permissions: ['*'], is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'HR', name: 'hr', name_th: 'ฝ่ายบุคคล', description: 'ฝ่ายทรัพยากรบุคคล', permissions: ['approve_leave', 'approve_overtime', 'manage_employees', 'view_reports'], is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'TEAM_LEAD', name: 'team_lead', name_th: 'หัวหน้าทีม', description: 'หัวหน้าทีม', permissions: ['approve_leave', 'approve_overtime', 'view_reports', 'manage_team'], is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'SUPERVISOR', name: 'supervisor', name_th: 'หัวหน้างาน', description: 'หัวหน้างาน', permissions: ['approve_leave', 'approve_overtime', 'view_reports'], is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'PERMANENT', name: 'permanent', name_th: 'พนักงานประจำ', description: 'พนักงานประจำ', permissions: ['request_leave', 'request_overtime'], is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'TEMPORARY', name: 'temporary', name_th: 'พนักงานชั่วคราว', description: 'พนักงานชั่วคราว', permissions: ['request_leave', 'request_overtime'], is_active: true, created_at: new Date(), updated_at: new Date() },
  ];

  for (const role of roles) {
    await prisma.roles.upsert({
      where: { code: role.code },
      update: role,
      create: role,
    });
  }

  // สร้างผู้ใช้ admin (ถ้ายังไม่มี)
  const admin = await prisma.employees.findFirst({
    where: { role: 'admin' }
  });

  if (!admin) {
    console.log('กำลังสร้างผู้ใช้ admin...');
    
    // หาข้อมูล reference
    const adminTeam = await prisma.teams.findUnique({ where: { code: 'AD' } });
    const itDepartment = await prisma.departments.findUnique({ where: { code: 'IT' } });
    const adminRole = await prisma.roles.findUnique({ where: { name: 'admin' } });
    
    // สร้าง admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.employees.create({
      data: {
        id: uuidv4(),
        employee_id: 'ADMIN001',
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@example.com',
        password: hashedPassword,
        position: 'System Administrator',
        department_id: itDepartment?.id,
        team_id: adminTeam?.id,
        role_id: adminRole?.id,
        hire_date: new Date(),
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  }

  // เพิ่มข้อมูล permissions
  console.log('กำลังเพิ่มข้อมูลสิทธิ์การใช้งาน...');
  const permissions = [
    // สิทธิ์จัดการพนักงาน
    { id: uuidv4(), code: 'VIEW_EMPLOYEES', name: 'view_employees', name_th: 'ดูข้อมูลพนักงาน', description: 'สิทธิ์ในการดูรายชื่อและข้อมูลพนักงาน', category: 'employee', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'CREATE_EMPLOYEE', name: 'create_employee', name_th: 'เพิ่มพนักงาน', description: 'สิทธิ์ในการเพิ่มข้อมูลพนักงานใหม่', category: 'employee', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'EDIT_EMPLOYEE', name: 'edit_employee', name_th: 'แก้ไขข้อมูลพนักงาน', description: 'สิทธิ์ในการแก้ไขข้อมูลพนักงาน', category: 'employee', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'DELETE_EMPLOYEE', name: 'delete_employee', name_th: 'ลบพนักงาน', description: 'สิทธิ์ในการลบข้อมูลพนักงาน', category: 'employee', is_active: true, created_at: new Date(), updated_at: new Date() },
    
    // สิทธิ์จัดการการลา
    { id: uuidv4(), code: 'VIEW_LEAVES', name: 'view_leaves', name_th: 'ดูข้อมูลการลา', description: 'สิทธิ์ในการดูรายการลาทั้งหมด', category: 'leave', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'VIEW_OWN_LEAVES', name: 'view_own_leaves', name_th: 'ดูข้อมูลการลาของตนเอง', description: 'สิทธิ์ในการดูรายการลาของตนเอง', category: 'leave', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'REQUEST_LEAVE', name: 'request_leave', name_th: 'ขอลา', description: 'สิทธิ์ในการสร้างคำขอลา', category: 'leave', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'APPROVE_LEAVE', name: 'approve_leave', name_th: 'อนุมัติการลา', description: 'สิทธิ์ในการอนุมัติคำขอลา', category: 'leave', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'REJECT_LEAVE', name: 'reject_leave', name_th: 'ปฏิเสธการลา', description: 'สิทธิ์ในการปฏิเสธคำขอลา', category: 'leave', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'CANCEL_LEAVE', name: 'cancel_leave', name_th: 'ยกเลิกการลา', description: 'สิทธิ์ในการยกเลิกคำขอลา', category: 'leave', is_active: true, created_at: new Date(), updated_at: new Date() },
    
    // สิทธิ์จัดการโอที
    { id: uuidv4(), code: 'VIEW_OVERTIMES', name: 'view_overtimes', name_th: 'ดูข้อมูลโอที', description: 'สิทธิ์ในการดูรายการโอทีทั้งหมด', category: 'overtime', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'VIEW_OWN_OVERTIMES', name: 'view_own_overtimes', name_th: 'ดูข้อมูลโอทีของตนเอง', description: 'สิทธิ์ในการดูรายการโอทีของตนเอง', category: 'overtime', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'REQUEST_OVERTIME', name: 'request_overtime', name_th: 'ขอโอที', description: 'สิทธิ์ในการสร้างคำขอโอที', category: 'overtime', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'APPROVE_OVERTIME', name: 'approve_overtime', name_th: 'อนุมัติโอที', description: 'สิทธิ์ในการอนุมัติคำขอโอที', category: 'overtime', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'REJECT_OVERTIME', name: 'reject_overtime', name_th: 'ปฏิเสธโอที', description: 'สิทธิ์ในการปฏิเสธคำขอโอที', category: 'overtime', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'CANCEL_OVERTIME', name: 'cancel_overtime', name_th: 'ยกเลิกโอที', description: 'สิทธิ์ในการยกเลิกคำขอโอที', category: 'overtime', is_active: true, created_at: new Date(), updated_at: new Date() },
    
    // สิทธิ์จัดการโครงการ
    { id: uuidv4(), code: 'VIEW_PROJECTS', name: 'view_projects', name_th: 'ดูข้อมูลโครงการ', description: 'สิทธิ์ในการดูรายการโครงการทั้งหมด', category: 'project', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'CREATE_PROJECT', name: 'create_project', name_th: 'สร้างโครงการ', description: 'สิทธิ์ในการสร้างโครงการใหม่', category: 'project', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'EDIT_PROJECT', name: 'edit_project', name_th: 'แก้ไขโครงการ', description: 'สิทธิ์ในการแก้ไขข้อมูลโครงการ', category: 'project', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'DELETE_PROJECT', name: 'delete_project', name_th: 'ลบโครงการ', description: 'สิทธิ์ในการลบโครงการ', category: 'project', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'MANAGE_PROJECT_MEMBERS', name: 'manage_project_members', name_th: 'จัดการสมาชิกโครงการ', description: 'สิทธิ์ในการเพิ่ม/ลบสมาชิกในโครงการ', category: 'project', is_active: true, created_at: new Date(), updated_at: new Date() },
    
    // สิทธิ์จัดการรายงาน
    { id: uuidv4(), code: 'VIEW_REPORTS', name: 'view_reports', name_th: 'ดูรายงาน', description: 'สิทธิ์ในการดูรายงานต่างๆ', category: 'report', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'EXPORT_REPORTS', name: 'export_reports', name_th: 'ส่งออกรายงาน', description: 'สิทธิ์ในการส่งออกรายงาน', category: 'report', is_active: true, created_at: new Date(), updated_at: new Date() },
    
    // สิทธิ์จัดการระบบ
    { id: uuidv4(), code: 'MANAGE_ROLES', name: 'manage_roles', name_th: 'จัดการบทบาท', description: 'สิทธิ์ในการจัดการบทบาทผู้ใช้', category: 'system', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'MANAGE_PERMISSIONS', name: 'manage_permissions', name_th: 'จัดการสิทธิ์', description: 'สิทธิ์ในการจัดการและกำหนดสิทธิ์', category: 'system', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'VIEW_SYSTEM_LOGS', name: 'view_system_logs', name_th: 'ดูบันทึกระบบ', description: 'สิทธิ์ในการดูบันทึกการทำงานของระบบ', category: 'system', is_active: true, created_at: new Date(), updated_at: new Date() },
    
    // สิทธิ์จัดการสถานะการทำงาน
    { id: uuidv4(), code: 'VIEW_WORK_STATUSES', name: 'view_work_statuses', name_th: 'ดูสถานะการทำงาน', description: 'สิทธิ์ในการดูสถานะการทำงานของพนักงาน', category: 'work_status', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'UPDATE_WORK_STATUS', name: 'update_work_status', name_th: 'อัปเดตสถานะการทำงาน', description: 'สิทธิ์ในการอัปเดตสถานะการทำงานของตนเอง', category: 'work_status', is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), code: 'MANAGE_WORK_STATUSES', name: 'manage_work_statuses', name_th: 'จัดการสถานะการทำงาน', description: 'สิทธิ์ในการจัดการสถานะการทำงานของพนักงานอื่น', category: 'work_status', is_active: true, created_at: new Date(), updated_at: new Date() },
  ];

  for (const permission of permissions) {
    await prisma.permissions.upsert({
      where: { code: permission.code },
      update: permission,
      create: permission,
    });
  }

  // เชื่อมโยงสิทธิ์กับบทบาท
  console.log('กำลังเพิ่มความสัมพันธ์ระหว่างบทบาทและสิทธิ์...');
  
  // ดึงข้อมูลบทบาทและสิทธิ์
  const allRoles = await prisma.roles.findMany();
  const allPermissions = await prisma.permissions.findMany();
  
  // กำหนดสิทธิ์ให้กับแต่ละบทบาท
  const rolePermissionsMap = {
    'admin': allPermissions.map(p => p.code), // admin มีสิทธิ์ทั้งหมด
    'hr': [
      'VIEW_EMPLOYEES', 'CREATE_EMPLOYEE', 'EDIT_EMPLOYEE', 'DELETE_EMPLOYEE',
      'VIEW_LEAVES', 'APPROVE_LEAVE', 'REJECT_LEAVE',
      'VIEW_OVERTIMES', 'APPROVE_OVERTIME', 'REJECT_OVERTIME',
      'VIEW_REPORTS', 'EXPORT_REPORTS',
      'VIEW_WORK_STATUSES', 'MANAGE_WORK_STATUSES'
    ],
    'team_lead': [
      'VIEW_EMPLOYEES',
      'VIEW_LEAVES', 'APPROVE_LEAVE', 'REJECT_LEAVE',
      'VIEW_OVERTIMES', 'APPROVE_OVERTIME', 'REJECT_OVERTIME',
      'VIEW_PROJECTS', 'CREATE_PROJECT', 'EDIT_PROJECT', 'MANAGE_PROJECT_MEMBERS',
      'VIEW_REPORTS',
      'VIEW_WORK_STATUSES', 'MANAGE_WORK_STATUSES'
    ],
    'supervisor': [
      'VIEW_EMPLOYEES',
      'VIEW_LEAVES', 'APPROVE_LEAVE', 'REJECT_LEAVE',
      'VIEW_OVERTIMES', 'APPROVE_OVERTIME', 'REJECT_OVERTIME',
      'VIEW_REPORTS',
      'VIEW_WORK_STATUSES'
    ],
    'permanent': [
      'VIEW_OWN_LEAVES', 'REQUEST_LEAVE', 'CANCEL_LEAVE',
      'VIEW_OWN_OVERTIMES', 'REQUEST_OVERTIME', 'CANCEL_OVERTIME',
      'VIEW_PROJECTS',
      'UPDATE_WORK_STATUS'
    ],
    'temporary': [
      'VIEW_OWN_LEAVES', 'REQUEST_LEAVE', 'CANCEL_LEAVE',
      'VIEW_OWN_OVERTIMES', 'REQUEST_OVERTIME', 'CANCEL_OVERTIME',
      'UPDATE_WORK_STATUS'
    ]
  };
  
  // สร้าง role_permissions
  for (const role of allRoles) {
    const permissionCodes = rolePermissionsMap[role.name] || [];
    
    for (const code of permissionCodes) {
      const permission = allPermissions.find(p => p.code === code);
      
      if (permission) {
        await prisma.role_permissions.upsert({
          where: {
            role_id_permission_id: {
              role_id: role.id,
              permission_id: permission.id
            }
          },
          update: {
            is_active: true,
            updated_at: new Date()
          },
          create: {
            id: uuidv4(),
            role_id: role.id,
            permission_id: permission.id,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
      }
    }
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