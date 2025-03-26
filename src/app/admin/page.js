'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiSettings, FiUsers, FiList, FiLayers, FiDatabase, FiArrowLeft, FiUserX, FiServer } from 'react-icons/fi';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ตรวจสอบสถานะการเข้าสู่ระบบและสิทธิ์
  if (status === 'loading') {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-lg text-gray-600 dark:text-gray-300">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (session?.user.role !== 'admin') {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
          <p>คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้</p>
          <Link href="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
            กลับไปยังหน้าแดชบอร์ด
          </Link>
        </div>
      </div>
    );
  }

  const adminMenus = [
    {
      title: 'จัดการผู้ใช้',
      description: 'เพิ่ม แก้ไข ลบ และจัดการผู้ใช้งานทั้งหมดในระบบ',
      icon: <FiUsers className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      link: '/employees',
    },
    {
      title: 'จัดการตำแหน่ง',
      description: 'จัดการและตั้งค่าข้อมูลตำแหน่งและระดับตำแหน่งของพนักงาน',
      icon: <FiLayers className="h-8 w-8 text-green-600 dark:text-green-400" />,
      link: '/admin/position-management',
    },
    {
      title: 'จัดการทีม',
      description: 'สร้างและจัดการทีมงานในองค์กร',
      icon: <FiList className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />,
      link: '/teams',
    },
    {
      title: 'ตั้งค่าระบบ',
      description: 'ตั้งค่าทั่วไปของระบบและการเชื่อมต่อต่างๆ',
      icon: <FiSettings className="h-8 w-8 text-purple-600 dark:text-purple-400" />,
      link: '/admin/settings',
    },
    {
      title: 'สำรองและกู้คืนข้อมูล',
      description: 'สำรองข้อมูลและกู้คืนข้อมูลระบบ',
      icon: <FiDatabase className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />,
      link: '/admin/backup',
    },
    {
      title: 'ล็อกและประวัติการใช้งาน',
      description: 'ตรวจสอบล็อกและประวัติการใช้งานระบบ',
      icon: <FiServer className="h-8 w-8 text-red-600 dark:text-red-400" />,
      link: '/admin/logs',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FiSettings className="mr-2 text-purple-600 dark:text-purple-400" /> การจัดการระบบ
        </h1>
        <Link
          href="/dashboard"
          className="btn btn-outline btn-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center justify-center"
        >
          <FiArrowLeft className="mr-1.5 h-4 w-4" />
          <span>กลับ</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminMenus.map((menu, index) => (
          <Link key={index} href={menu.link}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/30 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
              <div className="flex items-start mb-4">
                {menu.icon}
                <h2 className="ml-3 text-xl font-bold text-gray-900 dark:text-gray-100">{menu.title}</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{menu.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 