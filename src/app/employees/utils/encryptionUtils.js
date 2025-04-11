/**
 * Utility functions for encryption/decryption using Web Crypto API
 */

// คีย์เข้ารหัสสำหรับระบบ (ควรเก็บในตัวแปรสภาพแวดล้อม)
const ENCRYPTION_KEY = "bo-resource-management-secure-password-key-2023";

/**
 * เข้ารหัสข้อมูลด้วย AES-GCM algorithm
 * @param {string} plainText - ข้อความที่ต้องการเข้ารหัส
 * @returns {Promise<string>} - ข้อความที่เข้ารหัสแล้วในรูปแบบ base64
 */
export async function encryptData(plainText) {
  try {
    // สร้าง initialization vector
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // สร้างคีย์จากข้อความ
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(ENCRYPTION_KEY),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    
    // สร้างคีย์สำหรับเข้ารหัส
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: new TextEncoder().encode("bo-resource-salt"),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );
    
    // เข้ารหัสข้อมูล
    const encodedText = new TextEncoder().encode(plainText);
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encodedText
    );
    
    // แปลงข้อมูลเข้ารหัสและ IV เป็น base64
    const encryptedArray = new Uint8Array(encryptedData);
    const resultBuffer = new Uint8Array(iv.length + encryptedArray.length);
    resultBuffer.set(iv, 0);
    resultBuffer.set(encryptedArray, iv.length);
    
    return btoa(String.fromCharCode.apply(null, resultBuffer));
  } catch (error) {
    console.error("Error encrypting data:", error);
    throw new Error("ไม่สามารถเข้ารหัสข้อมูลได้");
  }
}

/**
 * ถอดรหัสข้อมูลที่เข้ารหัสด้วย AES-GCM algorithm
 * @param {string} encryptedText - ข้อความที่เข้ารหัสในรูปแบบ base64
 * @returns {Promise<string>} - ข้อความที่ถอดรหัสแล้ว
 */
export async function decryptData(encryptedText) {
  try {
    // แปลง base64 เป็น array buffer
    const encryptedBuffer = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    
    // แยก IV และข้อมูลที่เข้ารหัส
    const iv = encryptedBuffer.slice(0, 12);
    const encryptedData = encryptedBuffer.slice(12);
    
    // สร้างคีย์จากข้อความ
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(ENCRYPTION_KEY),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    
    // สร้างคีย์สำหรับถอดรหัส
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: new TextEncoder().encode("bo-resource-salt"),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    
    // ถอดรหัสข้อมูล
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encryptedData
    );
    
    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error("Error decrypting data:", error);
    throw new Error("ไม่สามารถถอดรหัสข้อมูลได้");
  }
} 