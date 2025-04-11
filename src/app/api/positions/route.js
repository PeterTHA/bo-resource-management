import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db-prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET: ดึงข้อมูลตำแหน่งทั้งหมด
export async function GET(req) {
  try {
    // ตรวจสอบสิทธิ์
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // เงื่อนไขพื้นฐานคือตำแหน่งที่ยังใช้งานอยู่
    const where = { is_active: true };

    // ตรวจสอบสิทธิ์ admin (ปรับปรุงให้ตรวจสอบหลายรูปแบบ)
    const isAdmin = 
      session.user.role?.toLowerCase() === 'admin' || 
      session.user.isAdmin === true || 
      session.user.permissions?.includes('admin');
    
    console.log('User role from session:', session.user.role);
    console.log('Checking if user is admin:', isAdmin);

    // ดึงข้อมูลตำแหน่ง
    let positions = await prisma.positions.findMany({
      where,
      orderBy: { name: 'asc' }
    });
    
    // ถ้าเป็น admin เพิ่มตำแหน่ง Web Master ที่มีไว้สำหรับ admin เท่านั้น
    if (isAdmin) {
      console.log('User is admin, checking for WEBMASTER position');
      // ตรวจสอบว่ามีตำแหน่ง Web Master อยู่แล้วหรือไม่
      const webMasterExists = await prisma.positions.findUnique({
        where: { code: 'WEBMASTER' }
      });
      
      console.log('WEBMASTER position exists:', !!webMasterExists);
      
      // ถ้ายังไม่มี ให้สร้างตำแหน่ง Web Master
      if (!webMasterExists) {
        console.log('Creating WEBMASTER position');
        await prisma.positions.create({
          data: {
            id: uuidv4(),
            code: 'WEBMASTER',
            name: 'Web Master',
            category: 'admin',
            description: 'ผู้ดูแลระบบเว็บไซต์ (สำหรับ Admin เท่านั้น)',
            is_active: true,
            updated_at: new Date()
          }
        });
      }
      
      // ดึงข้อมูลตำแหน่งทั้งหมดอีกครั้งเพื่อให้ได้ข้อมูลล่าสุด
      positions = await prisma.positions.findMany({
        where,
        orderBy: { name: 'asc' }
      });
    } else {
      // ถ้าไม่ใช่ admin กรองตำแหน่งที่มีไว้เฉพาะ admin ออก
      console.log('User is not admin, filtering out admin-only positions');
      positions = positions.filter(pos => pos.category !== 'admin');
    }
    
    console.log('Returning positions count:', positions.length);
    console.log('Position codes included:', positions.map(p => p.code).join(', '));
    
    return NextResponse.json({
      success: true,
      data: positions
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    
    // ตรวจสอบข้อผิดพลาดเกี่ยวกับตารางไม่มีในฐานข้อมูล
    if (error.message.includes('does not exist in the current database')) {
      return NextResponse.json({
        success: false,
        message: 'ตารางข้อมูลตำแหน่งไม่มีในฐานข้อมูล โปรดตรวจสอบ migration หรือ schema',
        error: error.message,
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่ง',
      error: error.message,
    }, { status: 500 });
  }
} 