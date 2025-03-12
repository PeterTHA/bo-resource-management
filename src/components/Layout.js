'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    return pathname === path ? 'bg-blue-700' : '';
  };

  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`bg-blue-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition duration-200 ease-in-out z-10`}
      >
        <div className="flex items-center space-x-2 px-4">
          <span className="text-2xl font-extrabold">ระบบจัดการทรัพยากร</span>
        </div>

        <nav className="mt-10">
          <Link
            href="/dashboard"
            className={`block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 ${isActive(
              '/dashboard'
            )}`}
          >
            แดชบอร์ด
          </Link>
          <Link
            href="/employees"
            className={`block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 ${isActive(
              '/employees'
            )}`}
          >
            พนักงาน
          </Link>
          <Link
            href="/leaves"
            className={`block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 ${isActive(
              '/leaves'
            )}`}
          >
            การลา
          </Link>
          <Link
            href="/overtime"
            className={`block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 ${isActive(
              '/overtime'
            )}`}
          >
            ทำงานล่วงเวลา
          </Link>
          <Link
            href="/profile"
            className={`block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 ${isActive(
              '/profile'
            )}`}
          >
            โปรไฟล์
          </Link>
          <button
            onClick={handleSignOut}
            className="block w-full text-left py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700"
          >
            ออกจากระบบ
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-md h-16 flex items-center justify-between px-6">
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-500 focus:outline-none"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>

          <div className="flex items-center">
            <span className="text-gray-700 mr-2">{session.user.name}</span>
            <div className="relative">
              <button className="flex items-center focus:outline-none">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  {session.user.name.charAt(0)}
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
} 