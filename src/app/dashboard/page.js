'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    pendingOvertimes: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // ดึงข้อมูลพนักงาน
        const employeesRes = await fetch('/api/employees');
        const employeesData = await employeesRes.json();
        
        // ดึงข้อมูลการลาที่รออนุมัติ
        const leavesRes = await fetch('/api/leaves');
        const leavesData = await leavesRes.json();
        const pendingLeaves = leavesData.data.filter(leave => leave.status === 'รออนุมัติ');
        
        // ดึงข้อมูลการทำงานล่วงเวลาที่รออนุมัติ
        const overtimesRes = await fetch('/api/overtime');
        const overtimesData = await overtimesRes.json();
        const pendingOvertimes = overtimesData.data.filter(overtime => overtime.status === 'รออนุมัติ');
        
        setStats({
          totalEmployees: employeesData.data.length,
          pendingLeaves: pendingLeaves.length,
          pendingOvertimes: pendingOvertimes.length,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    
    if (session) {
      fetchStats();
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <p className="mt-2">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">แดชบอร์ด</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2">พนักงานทั้งหมด</h2>
          <p className="text-4xl font-bold text-blue-600">{stats.totalEmployees}</p>
          <Link href="/employees" className="text-blue-500 hover:underline mt-4 inline-block">
            ดูรายละเอียด
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2">การลารออนุมัติ</h2>
          <p className="text-4xl font-bold text-yellow-600">{stats.pendingLeaves}</p>
          <Link href="/leaves" className="text-blue-500 hover:underline mt-4 inline-block">
            ดูรายละเอียด
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2">OT รออนุมัติ</h2>
          <p className="text-4xl font-bold text-green-600">{stats.pendingOvertimes}</p>
          <Link href="/overtime" className="text-blue-500 hover:underline mt-4 inline-block">
            ดูรายละเอียด
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">เมนูด่วน</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/employees/add" className="bg-blue-100 hover:bg-blue-200 p-4 rounded-lg text-center">
              <div className="text-blue-600 font-semibold">เพิ่มพนักงาน</div>
            </Link>
            <Link href="/leaves/add" className="bg-yellow-100 hover:bg-yellow-200 p-4 rounded-lg text-center">
              <div className="text-yellow-600 font-semibold">ขอลางาน</div>
            </Link>
            <Link href="/overtime/add" className="bg-green-100 hover:bg-green-200 p-4 rounded-lg text-center">
              <div className="text-green-600 font-semibold">ขอทำงานล่วงเวลา</div>
            </Link>
            <Link href="/profile" className="bg-purple-100 hover:bg-purple-200 p-4 rounded-lg text-center">
              <div className="text-purple-600 font-semibold">โปรไฟล์ของฉัน</div>
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">ข้อมูลผู้ใช้</h2>
          <div className="mb-4">
            <p className="text-gray-600">ชื่อ:</p>
            <p className="font-semibold">{session.user.name}</p>
          </div>
          <div className="mb-4">
            <p className="text-gray-600">อีเมล:</p>
            <p className="font-semibold">{session.user.email}</p>
          </div>
          <div className="mb-4">
            <p className="text-gray-600">รหัสพนักงาน:</p>
            <p className="font-semibold">{session.user.employeeId}</p>
          </div>
          <div>
            <p className="text-gray-600">บทบาท:</p>
            <p className="font-semibold capitalize">{session.user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 