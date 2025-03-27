'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiUsers, FiCalendar, FiClock, FiPlusCircle, FiUser, FiFileText, FiSettings } from 'react-icons/fi';
import { LoadingPage } from '../../components/ui/LoadingSpinner';

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

  // ตรวจสอบ hash fragment และตรวจสอบสถานะการล็อกอิน
  useEffect(() => {
    // ล้าง hash fragment ถ้ามี
    if (window.location.hash) {
      console.log('พบ hash fragment, มาจากการล็อกอินโดยตรง');
      window.history.replaceState(null, document.title, window.location.pathname);
    }

    console.log('Dashboard Page - Session status:', status);
    
    // ตรวจสอบสถานะการล็อกอิน
    if (status === 'loading') {
      return; // รอจนกว่าสถานะจะพร้อม
    }
    
    // ถ้าไม่ได้ล็อกอิน ให้เปลี่ยนเส้นทางไปยังหน้าล็อกอิน
    if (status === 'unauthenticated') {
      console.log('Dashboard Page - Not authenticated, redirecting to login...');
      router.replace('/login');
      return;
    }

    // มีการล็อกอินแล้ว ดึงข้อมูลสถิติ
    if (status === 'authenticated') {
      console.log('Dashboard Page - Authenticated, fetching data...');
      fetchDashboardStats();
    }
  }, [status, router]);

  // ฟังก์ชันดึงข้อมูลสถิติสำหรับ dashboard
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      console.log('Dashboard Page - Fetching stats data...');
      
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      
      if (data.success) {
        setStats(data.data);
        console.log('Dashboard Page - Stats data loaded successfully');
        setError('');
      } else {
        console.error('Dashboard Page - Error loading stats:', data.message);
        setError(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ');
        
        // ถ้าไม่ได้ล็อกอิน ให้ไปหน้าล็อกอิน
        if (data.notAuthenticated) {
          router.replace('/login');
        }
      }
    } catch (error) {
      console.error('Dashboard Page - Error connecting to server:', error);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  // กำลังตรวจสอบสถานะ session หรือกำลังโหลดข้อมูล
  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingPage message="กำลังโหลดข้อมูลแดชบอร์ด..." />
      </div>
    );
  }

  // ถ้าไม่ได้ล็อกอิน แต่ยังไม่ได้เปลี่ยนเส้นทาง
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 shadow-sm">
          <p>กรุณาเข้าสู่ระบบเพื่อเข้าถึงหน้านี้</p>
          <Link href="/login" className="text-blue-600 hover:underline mt-2 inline-block">
            ไปที่หน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = session?.user?.role === 'admin';

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">แดชบอร์ด</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 shadow-sm dark:bg-red-900/30 dark:text-red-300 dark:border-red-500">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="p-6 flex items-center">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mr-4 transition-colors duration-300">
              <FiUsers className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">พนักงานทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="p-6 flex items-center">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full mr-4 transition-colors duration-300">
              <FiCalendar className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">การลารออนุมัติ</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{stats.pendingLeaves}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="p-6 flex items-center">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mr-4 transition-colors duration-300">
              <FiClock className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">OT รออนุมัติ</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{stats.pendingOvertimes}</p>
            </div>
          </div>
        </div>
      </div>
      
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 transition-colors duration-300">ทางลัด</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {(isAdmin || session?.user?.role === 'supervisor') && (
          <Link href="/employees/add" className="block">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
              <div className="p-6 flex items-center">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-4 transition-colors duration-300">
                  <FiPlusCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white transition-colors duration-300">เพิ่มพนักงาน</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">เพิ่มข้อมูลพนักงานใหม่</p>
                </div>
              </div>
            </div>
          </Link>
        )}
        
        <Link href="/leaves/add" className="block">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
            <div className="p-6 flex items-center">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full mr-4 transition-colors duration-300">
                <FiCalendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white transition-colors duration-300">ขอลางาน</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">ส่งคำขอลางาน</p>
              </div>
            </div>
          </div>
        </Link>
        
        <Link href="/overtime/add" className="block">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
            <div className="p-6 flex items-center">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full mr-4 transition-colors duration-300">
                <FiClock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white transition-colors duration-300">ขอทำงานล่วงเวลา</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">ส่งคำขอทำงานล่วงเวลา</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/profile" className="block">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
            <div className="p-6 flex items-center">
              <div className="bg-pink-100 dark:bg-pink-900/30 p-3 rounded-full mr-4 transition-colors duration-300">
                <FiUser className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white transition-colors duration-300">โปรไฟล์</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">จัดการข้อมูลส่วนตัว</p>
              </div>
            </div>
          </div>
        </Link>
        
        <Link href="/reports" className="block">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
            <div className="p-6 flex items-center">
              <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-full mr-4 transition-colors duration-300">
                <FiFileText className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white transition-colors duration-300">รายงาน</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">ดูรายงานสรุป</p>
              </div>
            </div>
          </div>
        </Link>
        
        {isAdmin && (
          <Link href="/admin" className="block">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
              <div className="p-6 flex items-center">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mr-4 transition-colors duration-300">
                  <FiSettings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white transition-colors duration-300">จัดการระบบ</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">สำหรับผู้ดูแลระบบ</p>
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
