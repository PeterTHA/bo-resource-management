import { put, del, list } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

/**
 * อัปโหลดรูปภาพโปรไฟล์ไปยัง Vercel Blob
 * @param {File} file - ไฟล์รูปภาพที่จะอัปโหลด
 * @param {string} employeeId - รหัสพนักงาน
 * @returns {Promise<Object>} - ข้อมูลการอัปโหลด
 */
export async function uploadProfileImage(file, employeeId) {
  try {
    // ตรวจสอบว่าเป็นสภาพแวดล้อมการพัฒนาหรือไม่
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // สร้าง UUID เพื่อป้องกันการซ้ำกันของชื่อไฟล์
    const uuid = randomUUID();
    
    if (isDevelopment) {
      // ถ้าอยู่ในสภาพแวดล้อมการพัฒนา ให้จำลองการอัปโหลดไฟล์
      return simulateUpload(file, uuid, 'profile');
    }
    
    // ถ้าเป็น production ให้ใช้ Vercel Blob
    const filename = `profile-images/${employee_id}/${uuid}-${Date.now()}-${file.name}`;
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });
    
    return {
      success: true,
      url: blob.url,
      size: blob.size,
    };
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * อัปโหลดไฟล์แนบสำหรับการลาไปยัง Vercel Blob
 * @param {File} file - ไฟล์ที่จะอัปโหลด
 * @param {string} employeeId - รหัสพนักงาน
 * @returns {Promise<Object>} - ข้อมูลการอัปโหลด
 */
export async function uploadLeaveAttachment(file, employeeId) {
  try {
    // ตรวจสอบว่าเป็นสภาพแวดล้อมการพัฒนาหรือไม่
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // สร้าง UUID เพื่อป้องกันการซ้ำกันของชื่อไฟล์
    const uuid = randomUUID();
    
    if (isDevelopment) {
      // ถ้าอยู่ในสภาพแวดล้อมการพัฒนา ให้จำลองการอัปโหลดไฟล์
      return simulateUpload(file, uuid, 'leave');
    }
    
    // ถ้าเป็น production ให้ใช้ Vercel Blob
    const filename = `leave-attachments/${employee_id}/${uuid}-${Date.now()}-${file.name}`;
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });
    
    return {
      success: true,
      url: blob.url,
      size: blob.size,
      name: file.name,
      type: file.type
    };
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * จำลองการอัปโหลดไฟล์ในสภาพแวดล้อมการพัฒนา
 * @param {File} file - ไฟล์รูปภาพที่จะอัปโหลด
 * @param {string} uuid - UUID สำหรับไฟล์
 * @param {string} type - ประเภทของไฟล์ (profile หรือ leave)
 * @returns {Promise<Object>} - ข้อมูลการอัปโหลด
 */
async function simulateUpload(file, uuid, type = 'profile') {
  try {
    // กำหนดโฟลเดอร์ตามประเภทไฟล์
    const folder = type === 'profile' ? 'mock-images' : 'mock-attachments';
    
    // สร้างชื่อไฟล์
    const filename = `${uuid}-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    // ต้องใส่ / นำหน้าเพื่อให้เป็น URL จาก root ของเว็บไซต์
    const fileUrl = `/${folder}/${filename}`;
    // กำหนดเส้นทางที่จะบันทึกไฟล์ในระบบไฟล์
    const filePath = path.join(process.cwd(), `public/${folder}`, filename);

    console.log(`Development mode: Simulating ${type} file upload`, {
      filename,
      type: file.type,
      size: file.size,
      url: fileUrl,
      filePath
    });

    // บันทึกไฟล์ลงในโฟลเดอร์ public/mock-images หรือ public/mock-attachments
    try {
      // ตรวจสอบว่ามีโฟลเดอร์หรือไม่ ถ้าไม่มีให้สร้าง
      const dirPath = path.join(process.cwd(), `public/${folder}`);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // อ่านข้อมูลจาก File object
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // เขียนไฟล์
      fs.writeFileSync(filePath, buffer);
      console.log(`File saved to ${filePath}`);
      console.log(`File URL: ${fileUrl}`);
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }

    // ในโหมดพัฒนา เราจะบันทึกไฟล์และส่งคืน URL ที่ถูกต้อง
    return {
      success: true,
      url: fileUrl, // URL ที่ชี้ไปยังไฟล์ใน public/mock-images หรือ public/mock-attachments
      size: file.size,
      name: file.name,
      type: file.type
    };
  } catch (error) {
    console.error('Error in simulated upload:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function deleteProfileImage(employeeId) {
  try {
    await del(`profile-images/${employeeId}.jpg`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error: error.message };
  }
}

export { list }; 