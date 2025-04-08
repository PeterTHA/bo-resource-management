// ไฟล์ทดสอบการเชื่อมต่อฐานข้อมูล
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    // ทดสอบการเชื่อมต่อด้วยการดึงข้อมูลจำนวนพนักงานทั้งหมด
    const employeeCount = await prisma.employees.count();
    console.log(`การเชื่อมต่อสำเร็จ! มีพนักงานทั้งหมด ${employeeCount} คน`);
    
    // ทดสอบการเชื่อมต่อด้วยการดึงข้อมูลจำนวนโปรเจคทั้งหมด
    const projectCount = await prisma.projects.count();
    console.log(`การเชื่อมต่อสำเร็จ! มีโปรเจคทั้งหมด ${projectCount} โปรเจค`);
    
    return { success: true, employeeCount, projectCount };
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// ทดสอบการเชื่อมต่อ
testConnection()
  .then(result => {
    console.log('ผลการทดสอบ:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(e => {
    console.error('เกิดข้อผิดพลาดที่ไม่คาดคิด:', e);
    process.exit(1);
  }); 