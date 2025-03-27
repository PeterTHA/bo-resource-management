import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { uploadProfileImage, uploadLeaveAttachment } from '../../../lib/blob';

// ฟังก์ชันสำหรับตรวจสอบว่าไฟล์เป็นรูปภาพหรือไม่
function isImageFile(file) {
  const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validImageTypes.includes(file.type);
}

// ฟังก์ชันสำหรับตรวจสอบว่าไฟล์เป็นเอกสารหรือไม่
function isDocumentFile(file) {
  const validDocTypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp'
  ];
  return validDocTypes.includes(file.type);
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
    
    // แปลงข้อมูล request เป็น FormData
    const formData = await request.formData();
    const fileType = formData.get('type') || 'profile'; // profile หรือ leave
    
    if (fileType === 'profile') {
      // อัพโหลดรูปโปรไฟล์ (เหมือนเดิม)
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
    } else if (fileType === 'leave') {
      // อัพโหลดไฟล์แนบสำหรับการลา (หลายไฟล์)
      const files = formData.getAll('files');
      
      if (!files || files.length === 0) {
        return NextResponse.json(
          { success: false, message: 'ไม่พบไฟล์ที่อัปโหลด' },
          { status: 400 }
        );
      }
      
      // ตรวจสอบแต่ละไฟล์
      const maxSize = 10 * 1024 * 1024; // 10MB ต่อไฟล์
      const uploadResults = [];
      
      for (const file of files) {
        // ตรวจสอบว่าเป็นไฟล์เอกสารหรือรูปภาพที่อนุญาตหรือไม่
        if (!isDocumentFile(file)) {
          return NextResponse.json(
            { success: false, message: `ไฟล์ "${file.name}" ไม่ใช่ประเภทไฟล์ที่อนุญาต` },
            { status: 400 }
          );
        }
        
        // ตรวจสอบขนาดไฟล์
        if (file.size > maxSize) {
          return NextResponse.json(
            { success: false, message: `ไฟล์ "${file.name}" มีขนาดเกิน 10 MB` },
            { status: 400 }
          );
        }
        
        // อัปโหลดไฟล์
        const result = await uploadLeaveAttachment(file, session.user.id);
        
        if (!result.success) {
          return NextResponse.json(
            { success: false, message: `อัปโหลดไฟล์ "${file.name}" ไม่สำเร็จ`, error: result.error },
            { status: 500 }
          );
        }
        
        uploadResults.push({
          name: file.name,
          url: result.url,
          size: result.size,
          type: file.type
        });
      }
      
      return NextResponse.json(
        { success: true, files: uploadResults },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: 'ประเภทการอัปโหลดไม่ถูกต้อง' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 