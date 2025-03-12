'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiMenu, FiX, FiUser, FiLogOut, FiHome, FiUsers, FiCalendar, FiClock, FiBarChart2 } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const isActive = (path) => {
    return pathname === path;
  };

  if (!session) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600 dark:text-blue-400">
                BO Resource
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/dashboard"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/dashboard')
                    ? 'border-blue-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                }`}
              >
                <FiHome className="mr-1" /> หน้าหลัก
              </Link>
              <Link
                href="/employees"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/employees')
                    ? 'border-blue-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                }`}
              >
                <FiUsers className="mr-1" /> พนักงาน
              </Link>
              <Link
                href="/leaves"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/leaves')
                    ? 'border-blue-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                }`}
              >
                <FiCalendar className="mr-1" /> การลา
              </Link>
              <Link
                href="/overtime"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/overtime')
                    ? 'border-blue-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                }`}
              >
                <FiClock className="mr-1" /> ทำงานล่วงเวลา
              </Link>
              {(session.user.role === 'admin' || session.user.role === 'manager') && (
                <Link
                  href="/reports"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/reports')
                      ? 'border-blue-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FiBarChart2 className="mr-1" /> รายงาน
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            <ThemeToggle />
            <Link
              href="/profile"
              className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiUser className="h-6 w-6" />
            </Link>
            <button
              onClick={handleSignOut}
              className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiLogOut className="h-6 w-6" />
            </button>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <ThemeToggle />
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ml-2"
            >
              <span className="sr-only">เปิดเมนู</span>
              {isOpen ? <FiX className="block h-6 w-6" /> : <FiMenu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/dashboard"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/dashboard')
                  ? 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-gray-700'
                  : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              onClick={closeMenu}
            >
              <div className="flex items-center">
                <FiHome className="mr-2" /> หน้าหลัก
              </div>
            </Link>
            <Link
              href="/employees"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/employees')
                  ? 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-gray-700'
                  : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              onClick={closeMenu}
            >
              <div className="flex items-center">
                <FiUsers className="mr-2" /> พนักงาน
              </div>
            </Link>
            <Link
              href="/leaves"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/leaves')
                  ? 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-gray-700'
                  : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              onClick={closeMenu}
            >
              <div className="flex items-center">
                <FiCalendar className="mr-2" /> การลา
              </div>
            </Link>
            <Link
              href="/overtime"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/overtime')
                  ? 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-gray-700'
                  : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              onClick={closeMenu}
            >
              <div className="flex items-center">
                <FiClock className="mr-2" /> ทำงานล่วงเวลา
              </div>
            </Link>
            {(session.user.role === 'admin' || session.user.role === 'manager') && (
              <Link
                href="/reports"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive('/reports')
                    ? 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-gray-700'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                onClick={closeMenu}
              >
                <div className="flex items-center">
                  <FiBarChart2 className="mr-2" /> รายงาน
                </div>
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
                  {session.user.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800 dark:text-gray-200">{session.user.name}</div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{session.user.email}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                href="/profile"
                className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={closeMenu}
              >
                <div className="flex items-center">
                  <FiUser className="mr-2" /> โปรไฟล์
                </div>
              </Link>
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center">
                  <FiLogOut className="mr-2" /> ออกจากระบบ
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 