/**
 * ฟังก์ชันสำหรับสร้าง UUID แบบ v4
 * ใช้สำหรับสร้าง ID ที่ไม่ซ้ำกันในระบบ
 * @returns {string} UUID แบบ v4
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * สร้าง UUID เวอร์ชัน 4 (random)
 * @returns {string} UUID string
 */
export function generateUuid() {
  return uuidv4();
}

/**
 * สร้าง UUID แบบย่อ (ไม่มีเครื่องหมาย -)
 * @returns {string} UUID string แบบไม่มีเครื่องหมาย -
 */
export function generateShortUuid() {
  return uuidv4().replace(/-/g, '');
}

/**
 * สร้าง UUID แล้วเพิ่ม prefix
 * @param {string} prefix - คำนำหน้า UUID
 * @returns {string} UUID ที่มี prefix
 */
export function generatePrefixedUuid(prefix) {
  return `${prefix}-${uuidv4()}`;
}

export default generateUuid; 