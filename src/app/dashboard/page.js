'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiUsers, FiCalendar, FiClock, FiPlusCircle, FiUser, FiFileText } from 'react-icons/fi';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    pendingOvertimes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        
        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ');
        }
      } catch (error) {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchStats();
    }
  }, [session]);

  if (status === 'loading' || loading) {
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
      <h1 className="text-2xl md:text-3xl font-bold mb-8">แดชบอร์ด</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 shadow-sm dark:bg-red-900/30 dark:text-red-300 dark:border-red-500">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-6 flex items-center">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mr-4">
              <FiUsers className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">พนักงานทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-6 flex items-center">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full mr-4">
              <FiCalendar className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">การลารออนุมัติ</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingLeaves}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-6 flex items-center">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mr-4">
              <FiClock className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">OT รออนุมัติ</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingOvertimes}</p>
            </div>
          </div>
        </div>
      </div>
      
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">ทางลัด</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/employees/add" className="block">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="p-6 flex items-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-4">
                <FiPlusCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">เพิ่มพนักงาน</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">เพิ่มข้อมูลพนักงานใหม่</p>
              </div>
            </div>
          </div>
        </Link>
        
        <Link href="/leaves/add" className="block">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="p-6 flex items-center">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full mr-4">
                <FiCalendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">ขอลางาน</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">ส่งคำขอลางาน</p>
              </div>
            </div>
          </div>
        </Link>
        
        <Link href="/overtime/add" className="block">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="p-6 flex items-center">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full mr-4">
                <FiClock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">ขอทำงานล่วงเวลา</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">ส่งคำขอทำงานล่วงเวลา</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/profile" className="block">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="p-6 flex items-center">
              <div className="bg-pink-100 dark:bg-pink-900/30 p-3 rounded-full mr-4">
                <FiUser className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">โปรไฟล์</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">จัดการข้อมูลส่วนตัว</p>
              </div>
            </div>
          </div>
        </Link>
        
        <Link href="/reports" className="block">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="p-6 flex items-center">
              <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-full mr-4">
                <FiFileText className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">รายงาน</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">ดูรายงานสรุป</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
