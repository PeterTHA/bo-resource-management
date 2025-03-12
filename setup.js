const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('เริ่มต้นการตั้งค่าฐานข้อมูล Prisma...');

// ตรวจสอบว่ามีไฟล์ .env หรือไม่
if (!fs.existsSync('.env')) {
  console.log('ไม่พบไฟล์ .env กำลังสร้างจาก .env.example...');
  try {
    fs.copyFileSync('.env.example', '.env');
    console.log('สร้างไฟล์ .env สำเร็จ');
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างไฟล์ .env:', error);
    process.exit(1);
  }
}

// สร้างโฟลเดอร์ prisma ถ้ายังไม่มี
const prismaDir = path.join(__dirname, 'prisma');
if (!fs.existsSync(prismaDir)) {
  console.log('กำลังสร้างโฟลเดอร์ prisma...');
  fs.mkdirSync(prismaDir);
}

// รันคำสั่ง Prisma
try {
  console.log('กำลังสร้าง Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('กำลังอัปเดตฐานข้อมูลตาม schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('การตั้งค่าฐานข้อมูล Prisma สำเร็จ!');
  console.log('\nคุณสามารถเปิด Prisma Studio เพื่อดูและแก้ไขข้อมูลได้โดยใช้คำสั่ง:');
  console.log('npx prisma studio');
  
  console.log('\nคุณสามารถรันโปรเจคได้โดยใช้คำสั่ง:');
  console.log('npm run dev');
} catch (error) {
  console.error('เกิดข้อผิดพลาดในการตั้งค่า Prisma:', error);
  process.exit(1);
} 