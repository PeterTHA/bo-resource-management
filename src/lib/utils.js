import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * สร้าง UUID สำหรับใช้เป็น primary key
 * @returns {string} UUID v4 string
 */
export function generateUuid() {
  return uuidv4();
}
