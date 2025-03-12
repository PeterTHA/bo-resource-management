# ระบบจัดการทรัพยากรบุคคล (Resource Management System)

ระบบจัดการข้อมูลพนักงาน การลา และการทำงานล่วงเวลา พัฒนาด้วย Next.js

## คุณสมบัติ

- ระบบ Login/Authentication ด้วย NextAuth.js
- การจัดการข้อมูลพนักงาน (เพิ่ม/แก้ไข/ลบ)
- ระบบการลา (ขอลา/อนุมัติ/ปฏิเสธ)
- ระบบการทำงานล่วงเวลา (ขอทำงานล่วงเวลา/อนุมัติ/ปฏิเสธ)
- ระบบสิทธิ์การเข้าถึงข้อมูล (Admin/Manager/Employee)

## เทคโนโลยีที่ใช้

- Next.js 15
- React 19
- MongoDB (Mongoose)
- NextAuth.js
- Tailwind CSS
- DaisyUI

## การติดตั้ง

1. Clone โปรเจค
```bash
git clone https://github.com/yourusername/bo-resource-management.git
cd bo-resource-management
```

2. ติดตั้ง Dependencies
```bash
npm install
```

3. สร้างไฟล์ .env.local และกำหนดค่าต่างๆ
```
MONGODB_URI=mongodb://localhost:27017/resource-management
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

4. รันโปรเจค
```bash
npm run dev
```

5. เปิดเบราว์เซอร์และเข้าไปที่ http://localhost:3000

## การใช้งาน Vercel Storage (Free Tier)

โปรเจคนี้สามารถใช้งานร่วมกับ Vercel Storage ในแพ็คเกจ Hobby (Free Tier) ได้ ซึ่งมีบริการดังนี้:

### Vercel Postgres

1. ติดตั้ง package:
```bash
npm install @vercel/postgres
```

2. สร้าง Postgres Database ใน Vercel Dashboard
3. เพิ่มการเชื่อมต่อใน code:
```javascript
import { sql } from '@vercel/postgres';

// ตัวอย่างการใช้งาน
async function getEmployees() {
  const { rows } = await sql`SELECT * FROM employees`;
  return rows;
}
```

### Vercel Blob Storage

1. ติดตั้ง package:
```bash
npm install @vercel/blob
```

2. สร้าง Blob Storage ใน Vercel Dashboard
3. เพิ่มการเชื่อมต่อใน code:
```javascript
import { put, del, list } from '@vercel/blob';

// ตัวอย่างการอัปโหลดไฟล์
async function uploadProfileImage(file) {
  const blob = await put(`profile-images/${filename}`, file, {
    access: 'public',
  });
  return blob.url;
}
```

### Vercel KV (Redis)

1. ติดตั้ง package:
```bash
npm install @vercel/kv
```

2. สร้าง KV Database ใน Vercel Dashboard
3. เพิ่มการเชื่อมต่อใน code:
```javascript
import { kv } from '@vercel/kv';

// ตัวอย่างการใช้งาน
async function cacheUserSession(userId, sessionData) {
  await kv.set(`user:${userId}`, JSON.stringify(sessionData));
  await kv.expire(`user:${userId}`, 60 * 60 * 24); // หมดอายุใน 24 ชั่วโมง
}
```

### ข้อจำกัดของ Free Tier

- **Postgres**: 256MB พื้นที่เก็บข้อมูล, 1 database
- **Blob Storage**: 1GB พื้นที่เก็บข้อมูล, 1,000 operations/วัน
- **KV (Redis)**: 256MB พื้นที่เก็บข้อมูล, 2,000,000 operations/เดือน

## โครงสร้างโปรเจค

```
src/
├── app/                # Next.js App Router
│   ├── api/            # API Routes
│   ├── dashboard/      # หน้าแดชบอร์ด
│   ├── employees/      # หน้าจัดการพนักงาน
│   ├── leaves/         # หน้าจัดการการลา
│   ├── overtime/       # หน้าจัดการการทำงานล่วงเวลา
│   └── login/          # หน้า Login
├── components/         # React Components
├── lib/                # Utility Functions
└── models/             # Mongoose Models
```

## บทบาทในระบบ

1. **Admin**
   - จัดการข้อมูลพนักงานทั้งหมด
   - อนุมัติ/ปฏิเสธการลาและการทำงานล่วงเวลา
   - ดูรายงานต่างๆ

2. **Manager**
   - อนุมัติ/ปฏิเสธการลาและการทำงานล่วงเวลา
   - ดูข้อมูลพนักงานในทีม

3. **Employee**
   - ขอลา
   - ขอทำงานล่วงเวลา
   - ดูข้อมูลส่วนตัว

## การใช้งานเบื้องต้น

1. สร้างบัญชีผู้ใช้ Admin ผ่าน MongoDB หรือใช้ API
2. เข้าสู่ระบบด้วยบัญชี Admin
3. เพิ่มข้อมูลพนักงาน
4. ทดลองใช้งานระบบการลาและการทำงานล่วงเวลา
