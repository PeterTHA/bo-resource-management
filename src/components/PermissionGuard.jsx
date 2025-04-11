'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { hasPermission } from '@/lib/permissions';

/**
 * คอมโพเนนต์สำหรับตรวจสอบสิทธิ์การเข้าถึงเนื้อหา
 * @param {Object} props - Props ของคอมโพเนนต์
 * @param {string} props.permission - รหัสสิทธิ์ที่ต้องการตรวจสอบ
 * @param {React.ReactNode} props.children - เนื้อหาที่จะแสดงเมื่อมีสิทธิ์
 * @param {React.ReactNode} props.fallback - เนื้อหาที่จะแสดงเมื่อไม่มีสิทธิ์ (optional)
 * @returns {React.ReactNode} - เนื้อหาตามสิทธิ์การเข้าถึง
 */
export default function PermissionGuard({ permission, children, fallback = null }) {
  const { data: session } = useSession();
  
  // ถ้ายังไม่มี session หรือไม่มีข้อมูลผู้ใช้ ให้แสดง fallback
  if (!session || !session.user) {
    return fallback;
  }
  
  // ตรวจสอบสิทธิ์จากบทบาทของผู้ใช้
  const userHasPermission = hasPermission(session.user, permission);
  
  // แสดงเนื้อหาตามผลการตรวจสอบสิทธิ์
  return userHasPermission ? children : fallback;
} 