import { useSession } from 'next-auth/react';

/**
 * Custom hook สำหรับดึงข้อมูลผู้ใช้ปัจจุบัน
 * @returns {Object|null} ข้อมูลผู้ใช้หรือ null ถ้ายังไม่ล็อกอิน
 */
export function useUser() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return null;
  }
  
  if (status === 'unauthenticated' || !session) {
    return null;
  }
  
  return session.user;
} 