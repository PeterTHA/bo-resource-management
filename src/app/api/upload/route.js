import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { uploadProfileImage } from '../../../lib/blob';

// ฟังก์ชันสำหรับตรวจสอบว่าไฟล์เป็นรูปภาพหรือไม่
function isImageFile(file) {
  const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validImageTypes.includes(file.type);
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    // ทุกคนมีสิทธิ์ในการอัปโหลดรูปโปรไฟล์ของตัวเอง
    
    // แปลงข้อมูล request เป็น FormData
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบไฟล์ที่อัปโหลด' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่าเป็นไฟล์รูปภาพหรือไม่
    if (!isImageFile(file)) {
      return NextResponse.json(
        { success: false, message: 'กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (JPEG, PNG, GIF, WEBP)' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบขนาดไฟล์ (6MB = 6 * 1024 * 1024 bytes)
    const maxSize = 6 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'ขนาดไฟล์ต้องไม่เกิน 6 MB' },
        { status: 400 }
      );
    }
    
    // ใช้ userId เป็นส่วนหนึ่งของชื่อไฟล์
    const userId = session.user.id;
    
    // อัปโหลดรูปภาพไปยัง Vercel Blob
    const result = await uploadProfileImage(file, userId);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'อัปโหลดรูปภาพไม่สำเร็จ', error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, url: result.url },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 