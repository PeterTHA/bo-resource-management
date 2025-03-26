# ระบบจัดการทรัพยากรบุคคล (Resource Management System)

ระบบจัดการข้อมูลพนักงาน การลา และการทำงานล่วงเวลา พัฒนาด้วย Next.js

## คุณสมบัติ

- ระบบ Login/Authentication ด้วย NextAuth.js
- การจัดการข้อมูลพนักงาน (เพิ่ม/แก้ไข/ลบ)
- ระบบการลา (ขอลา/อนุมัติ/ปฏิเสธ)
- ระบบการทำงานล่วงเวลา (ขอทำงานล่วงเวลา/อนุมัติ/ปฏิเสธ)
- ระบบสิทธิ์การเข้าถึงข้อมูล (Admin/Manager/Employee)

## เทคโนโลยีที่ใช้

- **Next.js 15** - React framework สำหรับการสร้างเว็บแอปพลิเคชัน
- **React 19** - JavaScript library สำหรับสร้าง UI
- **Prisma** - ORM สำหรับจัดการฐานข้อมูล
- **PostgreSQL** - ฐานข้อมูลเชิงสัมพันธ์
- **NextAuth.js** - ระบบการยืนยันตัวตนสำหรับ Next.js
- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - Component library สำหรับ Tailwind CSS
- **Vercel Storage** - บริการจัดเก็บข้อมูลบน Vercel (Postgres, Blob, KV)

## การติดตั้ง

1. Clone โปรเจค
```bash
git clone https://github.com/yourusername/bo-resource-management.git
cd bo-resource-management
```

2. ติดตั้ง dependencies
```bash
npm install
```

3. ตั้งค่า environment variables
```bash
cp .env.example .env
```
แก้ไขไฟล์ `.env` เพื่อกำหนดค่าต่างๆ ตามที่ต้องการ

4. สร้างฐานข้อมูลและ Prisma Client
```bash
npx prisma generate
```

5. รันโปรเจค
```bash
npm run dev
```

6. เข้าถึงเว็บไซต์ผ่านเบราว์เซอร์
```
http://localhost:3000
```

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

## การใช้งาน Vercel Postgres ในโปรเจคนี้

โปรเจคนี้มีการเตรียมการรองรับการใช้งาน Vercel Postgres แทน MongoDB ดังนี้:

### 1. การตั้งค่า Environment Variables

เพิ่มค่าต่อไปนี้ใน `.env.local` หรือใน Vercel Dashboard:

```
# Vercel Postgres
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
```

### 2. การตั้งค่าฐานข้อมูล

1. Deploy โปรเจคไปยัง Vercel และสร้าง Postgres Database ใน Vercel Dashboard
2. เข้าไปที่ `/setup-postgres` เพื่อทดสอบการเชื่อมต่อและตั้งค่าฐานข้อมูล
3. ระบบจะสร้างตารางที่จำเป็นและบัญชีผู้ดูแลระบบเริ่มต้น:
   - อีเมล: admin@example.com
   - รหัสผ่าน: admin123

### 3. การเปลี่ยนจาก MongoDB เป็น Vercel Postgres

เพื่อเปลี่ยนจาก MongoDB เป็น Vercel Postgres ให้แก้ไขไฟล์ `src/app/api/auth/[...nextauth]/route.js`:

```javascript
import NextAuth from 'next-auth';
// เปลี่ยนจาก
// import { authOptions } from '../../../../lib/auth';
// เป็น
import { authOptionsPostgres } from '../../../../lib/auth-postgres';

// เปลี่ยนจาก
// const handler = NextAuth(authOptions);
// เป็น
const handler = NextAuth(authOptionsPostgres);

export { handler as GET, handler as POST };
```

จากนั้นแก้ไข API routes ต่างๆ ให้ใช้ฟังก์ชันจาก `src/lib/db-postgres.js` แทน `src/lib/db.js`

## โครงสร้างโปรเจค

```
bo-resource-management/
├── prisma/                  # Prisma schema และ migrations
├── public/                  # ไฟล์สาธารณะ
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API Routes
│   │   ├── dashboard/       # หน้า Dashboard
│   │   ├── employees/       # หน้าจัดการพนักงาน
│   │   ├── leaves/          # หน้าจัดการการลา
│   │   ├── login/           # หน้าเข้าสู่ระบบ
│   │   ├── overtime/        # หน้าจัดการการทำงานล่วงเวลา
│   │   ├── profile/         # หน้าโปรไฟล์ผู้ใช้
│   │   ├── reports/         # หน้ารายงาน
│   │   ├── layout.js        # Layout หลัก
│   │   └── page.js          # หน้าแรก
│   ├── components/          # React Components
│   │   ├── ui/              # UI Components
│   │   └── Layout.js        # Layout Component
│   └── lib/                 # Utility functions
│       ├── auth.js          # NextAuth configuration
│       └── db-prisma.js     # Prisma database functions
├── .env                     # Environment variables
├── .env.example             # ตัวอย่าง Environment variables
├── .gitignore               # Git ignore file
├── next.config.js           # Next.js configuration
├── package.json             # Project dependencies
├── postcss.config.js        # PostCSS configuration
└── tailwind.config.js       # Tailwind CSS configuration
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

## การใช้งาน Prisma

โปรเจคนี้ใช้ Prisma เป็น ORM สำหรับจัดการฐานข้อมูล PostgreSQL โดยมีคำสั่งที่ใช้บ่อยดังนี้:

1. สร้าง Prisma Client
```bash
npx prisma generate
```

2. ดึงโครงสร้างฐานข้อมูลจากฐานข้อมูลที่มีอยู่แล้ว
```bash
npx prisma db pull
```

3. อัปเดตฐานข้อมูลตาม schema
```bash
npx prisma db push
```

4. สร้าง migration
```bash
npx prisma migrate dev --name init
```

5. เปิด Prisma Studio เพื่อดูและแก้ไขข้อมูล
```bash
npx prisma studio
```

## การตั้งค่าระบบส่งอีเมล

ระบบนี้รองรับการส่งอีเมลผ่านบริการต่างๆ ดังนี้:

### การใช้งาน SendGrid API (แนะนำ)

1. สมัครบัญชี [SendGrid](https://sendgrid.com/) (มีแผนฟรีที่ส่งได้ 100 อีเมล/วัน)
2. สร้าง API Key จาก SendGrid Dashboard
3. ตั้งค่าในไฟล์ `.env.development.local` หรือ `.env.production.local`:

```env
SENDGRID_API_KEY=SG.YOUR_SENDGRID_API_KEY
EMAIL_FROM=your-verified-sender@example.com
```

**หมายเหตุ:** คุณต้องยืนยันโดเมนหรืออีเมลผู้ส่งกับ SendGrid ก่อนใช้งานจริง

### การใช้งาน SMTP (สำรอง)

หากต้องการใช้ SMTP โดยตรง สามารถตั้งค่าดังนี้:

```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-username
EMAIL_PASS=your-password
EMAIL_FROM=your-email@example.com
```

### แนะนำบริการส่งอีเมลฟรีสำหรับการทดสอบ

1. **Ethereal Email** - ใช้งานอัตโนมัติเมื่อไม่มีการตั้งค่าอื่น (จำลองการส่ง)
2. **Mailersend** - ส่งได้ 3,000 อีเมล/เดือน (ฟรี) [mailersend.com](https://www.mailersend.com/)
3. **Resend** - ส่งได้ 100 อีเมล/วัน (ฟรี) [resend.com](https://resend.com/)
4. **Mailgun** - ส่งได้ 5,000 อีเมล/เดือน แต่ใช้ได้ 3 เดือน [mailgun.com](https://www.mailgun.com/)

### การทดสอบระบบส่งอีเมลโดยไม่ต้องใช้บริการจริง

หากไม่ได้ตั้งค่า API key ใดๆ ระบบจะใช้ Ethereal Email ซึ่งเป็นบริการจำลองการส่งอีเมล โดยจะแสดง URL สำหรับดูเนื้อหาอีเมลในคอนโซล เมื่อมีการเรียกใช้งานฟังก์ชันส่งอีเมล
