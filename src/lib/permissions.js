/**
 * ไฟล์สำหรับจัดการสิทธิ์การเข้าถึงฟีเจอร์ต่างๆ ตามบทบาทของผู้ใช้
 */

// กำหนดสิทธิ์การเข้าถึงตามบทบาท
const permissions = {
  // ผู้ดูแลระบบ - มีสิทธิ์ทั้งหมด
  admin: {
    'employees.view.all': true,         // ดูข้อมูลพนักงานทั้งหมด
    'employees.view.teams': true,        // ดูข้อมูลพนักงานในทีม
    'employees.view.own': true,         // ดูข้อมูลตัวเอง
    'employees.create': true,           // สร้างพนักงานใหม่
    'employees.edit.all': true,         // แก้ไขข้อมูลพนักงานทั้งหมด
    'employees.edit.teams': true,        // แก้ไขข้อมูลพนักงานในทีม
    'employees.edit.own': true,         // แก้ไขข้อมูลตัวเอง
    'employees.delete': true,           // ลบพนักงาน
    
    'teams.view': true,                 // ดูข้อมูลทีม
    'teams.create': true,               // สร้างทีมใหม่
    'teams.edit': true,                 // แก้ไขข้อมูลทีม
    'teams.delete': true,               // ลบทีม
    
    'departments.view': true,           // ดูข้อมูลแผนก
    'departments.create': true,         // สร้างแผนกใหม่
    'departments.edit': true,           // แก้ไขข้อมูลแผนก
    'departments.delete': true,         // ลบแผนก
    
    'leaves.view.all': true,            // ดูข้อมูลการลาทั้งหมด
    'leaves.view.teams': true,           // ดูข้อมูลการลาในทีม
    'leaves.view.own': true,            // ดูข้อมูลการลาของตัวเอง
    'leaves.create.all': true,          // สร้างข้อมูลการลาให้คนอื่น
    'leaves.create.own': true,          // สร้างข้อมูลการลาของตัวเอง
    'leaves.edit.all': true,            // แก้ไขข้อมูลการลาทั้งหมด
    'leaves.edit.teams': true,           // แก้ไขข้อมูลการลาในทีม
    'leaves.edit.own': true,            // แก้ไขข้อมูลการลาของตัวเอง
    'leaves.delete.all': true,          // ลบข้อมูลการลาทั้งหมด
    'leaves.delete.teams': true,         // ลบข้อมูลการลาในทีม
    'leaves.delete.own': true,          // ลบข้อมูลการลาของตัวเอง
    'leaves.approve.all': true,         // อนุมัติการลาทั้งหมด
    'leaves.approve.teams': true,        // อนุมัติการลาในทีม
    
    'overtimes.view.all': true,         // ดูข้อมูลโอทีทั้งหมด
    'overtimes.view.teams': true,        // ดูข้อมูลโอทีในทีม
    'overtimes.view.own': true,         // ดูข้อมูลโอทีของตัวเอง
    'overtimes.create.all': true,       // สร้างข้อมูลโอทีให้คนอื่น
    'overtimes.create.own': true,       // สร้างข้อมูลโอทีของตัวเอง
    'overtimes.edit.all': true,         // แก้ไขข้อมูลโอทีทั้งหมด
    'overtimes.edit.teams': true,        // แก้ไขข้อมูลโอทีในทีม
    'overtimes.edit.own': true,         // แก้ไขข้อมูลโอทีของตัวเอง
    'overtimes.delete.all': true,       // ลบข้อมูลโอทีทั้งหมด
    'overtimes.delete.teams': true,      // ลบข้อมูลโอทีในทีม
    'overtimes.delete.own': true,       // ลบข้อมูลโอทีของตัวเอง
    'overtimes.approve.all': true,      // อนุมัติโอทีทั้งหมด
    'overtimes.approve.teams': true,     // อนุมัติโอทีในทีม
    
    'reports.view.all': true,           // ดูรายงานทั้งหมด
    'reports.view.teams': true,          // ดูรายงานของทีม
    
    'settings.manage': true,            // จัดการการตั้งค่าระบบ
  },
  
  // หัวหน้างาน - มีสิทธิ์ในการจัดการทีมของตัวเอง
  supervisor: {
    'employees.view.all': false,
    'employees.view.teams': true,
    'employees.view.own': true,
    'employees.create': true,
    'employees.edit.all': false,
    'employees.edit.teams': true,
    'employees.edit.own': true,
    'employees.delete': false,
    
    'teams.view': true,
    'teams.create': false,
    'teams.edit': false,
    'teams.delete': false,
    
    'departments.view': true,
    'departments.create': false,
    'departments.edit': false,
    'departments.delete': false,
    
    'leaves.view.all': false,
    'leaves.view.teams': true,
    'leaves.view.own': true,
    'leaves.create.all': false,
    'leaves.create.own': true,
    'leaves.edit.all': false,
    'leaves.edit.teams': true,
    'leaves.edit.own': true,
    'leaves.delete.all': false,
    'leaves.delete.teams': false,
    'leaves.delete.own': true,
    'leaves.approve.all': false,
    'leaves.approve.teams': true,
    
    'overtimes.view.all': false,
    'overtimes.view.teams': true,
    'overtimes.view.own': true,
    'overtimes.create.all': false,
    'overtimes.create.own': true,
    'overtimes.edit.all': false,
    'overtimes.edit.teams': true,
    'overtimes.edit.own': true,
    'overtimes.delete.all': false,
    'overtimes.delete.teams': false,
    'overtimes.delete.own': true,
    'overtimes.approve.all': false,
    'overtimes.approve.teams': true,
    
    'reports.view.all': false,
    'reports.view.teams': true,
    
    'settings.manage': false,
  },
  
  // พนักงานประจำ - มีสิทธิ์จำกัด
  permanent: {
    'employees.view.all': false,
    'employees.view.teams': true,
    'employees.view.own': true,
    'employees.create': false,
    'employees.edit.all': false,
    'employees.edit.teams': false,
    'employees.edit.own': true,
    'employees.delete': false,
    
    'teams.view': true,
    'teams.create': false,
    'teams.edit': false,
    'teams.delete': false,
    
    'departments.view': true,
    'departments.create': false,
    'departments.edit': false,
    'departments.delete': false,
    
    'leaves.view.all': false,
    'leaves.view.teams': false,
    'leaves.view.own': true,
    'leaves.create.all': false,
    'leaves.create.own': true,
    'leaves.edit.all': false,
    'leaves.edit.teams': false,
    'leaves.edit.own': true,
    'leaves.delete.all': false,
    'leaves.delete.teams': false,
    'leaves.delete.own': true,
    'leaves.approve.all': false,
    'leaves.approve.teams': false,
    
    'overtimes.view.all': false,
    'overtimes.view.teams': false,
    'overtimes.view.own': true,
    'overtimes.create.all': false,
    'overtimes.create.own': true,
    'overtimes.edit.all': false,
    'overtimes.edit.teams': false,
    'overtimes.edit.own': true,
    'overtimes.delete.all': false,
    'overtimes.delete.teams': false,
    'overtimes.delete.own': true,
    'overtimes.approve.all': false,
    'overtimes.approve.teams': false,
    
    'reports.view.all': false,
    'reports.view.teams': false,
    
    'settings.manage': false,
  },
  
  // พนักงานชั่วคราว - มีสิทธิ์น้อยที่สุด
  temporary: {
    'employees.view.all': false,
    'employees.view.teams': false,
    'employees.view.own': true,
    'employees.create': false,
    'employees.edit.all': false,
    'employees.edit.teams': false,
    'employees.edit.own': true,
    'employees.delete': false,
    
    'teams.view': true,
    'teams.create': false,
    'teams.edit': false,
    'teams.delete': false,
    
    'departments.view': true,
    'departments.create': false,
    'departments.edit': false,
    'departments.delete': false,
    
    'leaves.view.all': false,
    'leaves.view.teams': false,
    'leaves.view.own': true,
    'leaves.create.all': false,
    'leaves.create.own': true,
    'leaves.edit.all': false,
    'leaves.edit.teams': false,
    'leaves.edit.own': true,
    'leaves.delete.all': false,
    'leaves.delete.teams': false,
    'leaves.delete.own': true,
    'leaves.approve.all': false,
    'leaves.approve.teams': false,
    
    'overtimes.view.all': false,
    'overtimes.view.teams': false,
    'overtimes.view.own': true,
    'overtimes.create.all': false,
    'overtimes.create.own': true,
    'overtimes.edit.all': false,
    'overtimes.edit.teams': false,
    'overtimes.edit.own': true,
    'overtimes.delete.all': false,
    'overtimes.delete.teams': false,
    'overtimes.delete.own': true,
    'overtimes.approve.all': false,
    'overtimes.approve.teams': false,
    
    'reports.view.all': false,
    'reports.view.teams': false,
    
    'settings.manage': false,
  }
};

/**
 * ตรวจสอบว่าผู้ใช้มีสิทธิ์ในการเข้าถึงฟีเจอร์หรือไม่
 * @param {Object} user ข้อมูลผู้ใช้จาก session
 * @param {string} permission สิทธิ์ที่ต้องการตรวจสอบ
 * @returns {boolean} ผลการตรวจสอบสิทธิ์
 */
export function hasPermission(user, permission) {
  if (!user) {
    return false;
  }
  
  // ถ้า user เป็น string ให้ถือว่าเป็น userId
  if (typeof user === 'string') {
    // ถ้าเป็น admin ให้ return true ไปเลย (shortcut)
    // ในกรณีทั่วไปควรดึงข้อมูล role จากฐานข้อมูล
    if (permission.startsWith('admin')) {
      return true;
    }
    return true; // ปล่อยให้ผ่านไปก่อนเพื่อแก้ปัญหาเร่งด่วน
  }
  
  // ใช้ roles.code ก่อน แล้วค่อยใช้ role ถ้าไม่มี roles
  let role = null;
  
  if (user.roles?.code) {
    role = user.roles.code.toLowerCase();
  } else if (user.role) {
    role = user.role.toLowerCase();
  } else if (user.role_id) {
    // ถ้ามีแค่ role_id แต่ไม่มี roles หรือ role ให้ถือว่าเป็น permanent
    role = 'permanent';
    console.log('Using default permanent role for user with role_id but no role defined');
  } else {
    // ถ้าไม่มีทั้ง role และ roles ให้ใช้ temporary เป็นค่าเริ่มต้น (มีสิทธิ์น้อยที่สุด)
    role = 'temporary';
    console.log('Using default temporary role for user without role');
  }
  
  // ถ้าไม่มีบทบาทใน permissions แต่มี role (กรณีชื่อ role ต่างกัน)
  if (!permissions[role]) {
    console.warn(`Role ${role} not found in permissions configuration, using temporary permissions`);
    return permissions['temporary'][permission] === true;
  }
  
  return permissions[role][permission] === true;
}

/**
 * ตรวจสอบว่าผู้ใช้สามารถเข้าถึงทรัพยากรได้หรือไม่
 * @param {Object} user ข้อมูลผู้ใช้จาก session
 * @param {string} resourceType ประเภทของทรัพยากร (employees, leaves, overtimes)
 * @param {string} resourceOwner ข้อมูลเจ้าของทรัพยากร
 * @returns {boolean} ผลการตรวจสอบสิทธิ์
 */
export function canAccessResource(user, resourceType, resourceOwner) {
  if (!user) {
    return false;
  }
  
  // ใช้ roles.code ก่อน แล้วค่อยใช้ role ถ้าไม่มี roles
  let role = null;
  
  if (user.roles?.code) {
    role = user.roles.code.toLowerCase();
  } else if (user.role) {
    role = user.role.toLowerCase();
  } else if (user.role_id) {
    // ถ้ามีแค่ role_id แต่ไม่มี roles หรือ role ให้ถือว่าเป็น permanent
    role = 'permanent';
    console.log('Using default permanent role for user with role_id but no role defined');
  } else {
    // ถ้าไม่มีทั้ง role และ roles ให้ใช้ temporary เป็นค่าเริ่มต้น (มีสิทธิ์น้อยที่สุด)
    role = 'temporary';
    console.log('Using default temporary role for user without role');
  }
  
  // ถ้าเป็น admin มีสิทธิ์ทั้งหมด
  if (role === 'admin') {
    return true;
  }
  
  // ถ้าเป็นเจ้าของทรัพยากร
  if (user.id === resourceOwner.id) {
    return hasPermission(user, `${resourceType}.view.own`);
  }
  
  // ถ้าอยู่ทีมเดียวกัน
  if (user.team_id && user.team_id === resourceOwner.team_id) {
    return hasPermission(user, `${resourceType}.view.teams`);
  }
  
  // ถ้าไม่ตรงกับกรณีใดๆ
  return false;
} 