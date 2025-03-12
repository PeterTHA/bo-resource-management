import { NextResponse } from 'next/server';
import { createTables, testConnection } from '../../../lib/db-postgres';
import bcrypt from 'bcryptjs';
import { sql } from '@vercel/postgres';

// POST - ตั้งค่าฐานข้อมูล Vercel Postgres
export async function POST(request) {
  try {
    // ทดสอบการเชื่อมต่อกับ Vercel Postgres
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถเชื่อมต่อกับ Vercel Postgres ได้', error: connectionTest.error },
        { status: 500 }
      );
    }

    // สร้างตารางในฐานข้อมูล
    const createTablesResult = await createTables();
    if (!createTablesResult.success) {
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถสร้างตารางในฐานข้อมูลได้', error: createTablesResult.error },
        { status: 500 }
      );
    }

    // ตรวจสอบว่ามีผู้ใช้ admin อยู่แล้วหรือไม่
    const adminCheck = await sql`SELECT * FROM employees WHERE role = 'admin' LIMIT 1`;
    
    // ถ้ายังไม่มีผู้ใช้ admin ให้สร้างผู้ใช้ admin เริ่มต้น
    if (adminCheck.rows.length === 0) {
      // เข้ารหัสรหัสผ่าน
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // สร้างผู้ใช้ admin
      await sql`
        INSERT INTO employees (
          employee_id, first_name, last_name, email, password, position, department, hire_date, role, is_active
        ) VALUES (
          'ADMIN001', 'Admin', 'User', 'admin@example.com', ${hashedPassword}, 'Administrator', 'IT', NOW(), 'admin', true
        )
      `;
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'ตั้งค่าฐานข้อมูล Vercel Postgres เรียบร้อยแล้ว',
        adminCreated: adminCheck.rows.length === 0
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error setting up Postgres:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการตั้งค่าฐานข้อมูล', error: error.message },
      { status: 500 }
    );
  }
}

// GET - ทดสอบการเชื่อมต่อกับ Vercel Postgres
export async function GET() {
  try {
    const connectionTest = await testConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถเชื่อมต่อกับ Vercel Postgres ได้', error: connectionTest.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: 'เชื่อมต่อกับ Vercel Postgres สำเร็จ', data: connectionTest.data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error testing Postgres connection:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการทดสอบการเชื่อมต่อ', error: error.message },
      { status: 500 }
    );
  }
} 