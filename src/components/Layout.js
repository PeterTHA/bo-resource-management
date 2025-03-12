'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiUsers, FiCalendar, FiClock, FiFileText, FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';

export default function Layout({ children }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const isActive = (path) => {
    return pathname === path ? 'bg-blue-800 text-white font-bold' : 'text-white hover:bg-blue-700 hover:text-white';
  };

  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`bg-blue-600 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition duration-200 ease-in-out z-20 shadow-lg`}
      >
        <div className="flex items-center justify-between px-4">
          <span className="text-xl font-bold text-white">ระบบจัดการทรัพยากร</span>
          <button 
            onClick={toggleSidebar} 
            className="md:hidden text-white focus:outline-none"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-10 px-4">
          <div className="space-y-2">
            <Link
              href="/dashboard"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${isActive('/dashboard')} font-bold`}
            >
              <FiHome className="h-5 w-5" />
              <span>แดชบอร์ด</span>
            </Link>
            <Link
              href="/employees"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${isActive('/employees')} font-bold`}
            >
              <FiUsers className="h-5 w-5" />
              <span>พนักงาน</span>
            </Link>
            <Link
              href="/leaves"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${isActive('/leaves')} font-bold`}
            >
              <FiCalendar className="h-5 w-5" />
              <span>การลา</span>
            </Link>
            <Link
              href="/overtime"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${isActive('/overtime')} font-bold`}
            >
              <FiClock className="h-5 w-5" />
              <span>ทำงานล่วงเวลา</span>
            </Link>
            {(session.user.role === 'admin' || session.user.role === 'manager') && (
              <Link
                href="/reports"
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${isActive('/reports')} font-bold`}
              >
                <FiFileText className="h-5 w-5" />
                <span>รายงาน</span>
              </Link>
            )}
            <Link
              href="/profile"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${isActive('/profile')} font-bold`}
            >
              <FiUser className="h-5 w-5" />
              <span>โปรไฟล์</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 w-full text-left text-white hover:bg-blue-800 font-bold"
            >
              <FiLogOut className="h-5 w-5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-md h-16 flex items-center justify-between px-6">
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-700 focus:outline-none"
          >
            <FiMenu className="h-6 w-6" />
          </button>

          <div className="flex items-center">
            <span className="text-gray-900 font-bold mr-2">{session.user.name}</span>
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {session.user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
          {children}
        </main>
      </div>
    </div>
  );
} 