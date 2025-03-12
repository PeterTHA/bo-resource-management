import { createClient } from '@vercel/kv';

// ตรวจสอบว่า REDIS_URL ถูกต้องหรือไม่
const isValidRedisUrl = process.env.REDIS_URL && 
                        process.env.REDIS_URL.startsWith('https://') && 
                        process.env.REDIS_URL !== 'database_provisioning_in_progress';

// สร้าง client เฉพาะเมื่อ URL ถูกต้อง
export const redis = isValidRedisUrl 
  ? createClient({ url: process.env.REDIS_URL })
  : null;

export async function cacheData(key, data, expireInSeconds = 3600) {
  try {
    // ตรวจสอบว่า redis พร้อมใช้งานหรือไม่
    if (!redis) {
      return { success: false, error: 'Redis client not available' };
    }
    
    await redis.set(key, JSON.stringify(data));
    await redis.expire(key, expireInSeconds);
    return { success: true };
  } catch (error) {
    console.error('Redis cache error:', error);
    return { success: false, error: error.message };
  }
}

export async function getCachedData(key) {
  try {
    // ตรวจสอบว่า redis พร้อมใช้งานหรือไม่
    if (!redis) {
      return { success: false, error: 'Redis client not available' };
    }
    
    const data = await redis.get(key);
    return data ? { success: true, data: JSON.parse(data) } : { success: false };
  } catch (error) {
    console.error('Redis get error:', error);
    return { success: false, error: error.message };
  }
}

export async function invalidateCache(key) {
  try {
    // ตรวจสอบว่า redis พร้อมใช้งานหรือไม่
    if (!redis) {
      return { success: false, error: 'Redis client not available' };
    }
    
    await redis.del(key);
    return { success: true };
  } catch (error) {
    console.error('Redis delete error:', error);
    return { success: false, error: error.message };
  }
} 