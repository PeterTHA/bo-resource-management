// ไฟล์ทดสอบการค้นหาผู้ใช้จากฐานข้อมูล
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUser() {
  try {
    const user = await prisma.employees.findUnique({
      where: { email: 'bo@example.com' }
    });
    
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (user) {
      console.log('Email:', user.email);
      // แสดงผลเพิ่มเติมโดยไม่แสดงข้อมูลที่เป็นความลับ
      console.log('First Name:', user.first_name);
      console.log('Last Name:', user.last_name);
      console.log('Role:', user.role);
      console.log('Is Active:', user.is_active);
      console.log('Has Password:', user.password ? 'Yes' : 'No');
    } else {
      console.log('User not found!');
    }
    
    return { success: true, userFound: !!user };
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// ทดสอบการค้นหาผู้ใช้
testUser()
  .then(result => {
    console.log('ผลการทดสอบ:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(e => {
    console.error('เกิดข้อผิดพลาดที่ไม่คาดคิด:', e);
    process.exit(1);
  }); 