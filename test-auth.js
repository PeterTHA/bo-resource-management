// ไฟล์ทดสอบการตรวจสอบรหัสผ่าน
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    // ค้นหาผู้ใช้จากอีเมล
    const user = await prisma.employees.findUnique({
      where: { email: 'bo@example.com' }
    });
    
    if (!user) {
      console.log('User not found!');
      return { success: false, error: 'User not found' };
    }
    
    console.log('User found:', user.email);
    
    // ทดสอบรหัสผ่าน
    const testPassword = '123456';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    
    console.log('Password match:', isMatch ? 'Yes' : 'No');
    
    if (isMatch) {
      console.log('Authentication successful!');
    } else {
      console.log('Password is incorrect!');
    }
    
    return { success: true, authSuccessful: isMatch };
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// ทดสอบการตรวจสอบรหัสผ่าน
testAuth()
  .then(result => {
    console.log('ผลการทดสอบ:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(e => {
    console.error('เกิดข้อผิดพลาดที่ไม่คาดคิด:', e);
    process.exit(1);
  }); 