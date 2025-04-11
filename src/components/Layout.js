'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiUsers, FiCalendar, FiClock, FiFileText, FiUser, FiLogOut, FiMenu, FiX, FiShield } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle';
import Image from 'next/image';
import { useTheme } from 'next-themes';

export default function Layout({ children }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  // เมื่อ component mount แล้วค่อยเปิด mounted state
  // เพื่อป้องกัน hydration error
  useEffect(() => {
    setMounted(true);
  }, []);

  // ดึงข้อมูลผู้ใช้รวมถึงรูปโปรไฟล์จาก API
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        const res = await fetch(`/api/employees/${session.user.id}`);
        const result = await res.json();
        
        // รองรับทั้งรูปแบบเก่าและรูปแบบใหม่
        if (result.data) {
          setUserData(result.data);
        } else if (!result.error) {
          setUserData(result);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchUserData();
    }
  }, [session]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const isActive = (path) => {
    return pathname === path 
      ? 'text-primary-500 font-bold border-b-2 border-primary' 
      : 'text-base-content hover:text-primary-400 transition-all duration-200';
  };

  // ดึงชื่อและชื่อย่อของผู้ใช้
  const userName = session?.user?.name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  if (!session) {
    return <>{children}</>;
  }

  // สีตัวอักษรและขอบของ avatar ขึ้นอยู่กับโหมด
  const getAvatarStyles = () => {
    if (!mounted) return "bg-primary text-black border-2 border-white";
    
    return theme === 'dark' 
      ? "bg-primary text-white border-[3px] border-black outline outline-1 outline-white" 
      : "bg-primary text-black border-2 border-white";
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header/Navbar */}
      <header className="bg-base-100 shadow-md border-b border-base-300 sticky top-0 z-30">
        <div className="navbar container mx-auto px-4">
          {/* Logo และชื่อระบบ (ด้านซ้าย) */}
          <div className="navbar-start">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-primary">ระบบจัดการทรัพยากร</span>
            </Link>
          </div>
          
          {/* เมนูสำหรับหน้าจอขนาดใหญ่ (ตรงกลาง) */}
          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal p-0 gap-2">
              <li className="relative">
                <Link href="/dashboard" className={`rounded-md px-4 py-3 flex items-center ${isActive('/dashboard')}`}>
                  <div className="flex items-center">
                    <FiHome className={`h-5 w-5 mr-2 ${pathname === '/dashboard' ? 'text-primary' : ''}`} />
                    <span>แดชบอร์ด</span>
                  </div>
                </Link>
              </li>
              <li className="relative">
                <Link href="/employees" className={`rounded-md px-4 py-3 flex items-center ${isActive('/employees')}`}>
                  <div className="flex items-center">
                    <FiUsers className={`h-5 w-5 mr-2 ${pathname === '/employees' ? 'text-primary' : ''}`} />
                    <span>พนักงาน</span>
                  </div>
                </Link>
              </li>
              <li className="relative">
                <Link href="/leaves" className={`rounded-md px-4 py-3 flex items-center ${isActive('/leaves')}`}>
                  <div className="flex items-center">
                    <FiCalendar className={`h-5 w-5 mr-2 ${pathname === '/leaves' ? 'text-primary' : ''}`} />
                    <span>การลา</span>
                  </div>
                </Link>
              </li>
              <li className="relative">
                <Link href="/overtime" className={`rounded-md px-4 py-3 flex items-center ${isActive('/overtime')}`}>
                  <div className="flex items-center">
                    <FiClock className={`h-5 w-5 mr-2 ${pathname === '/overtime' ? 'text-primary' : ''}`} />
                    <span>ทำงานล่วงเวลา</span>
                  </div>
                </Link>
              </li>
              <li className="relative">
                <Link href="/employee-calendar" className={`rounded-md px-4 py-3 flex items-center ${isActive('/employee-calendar')}`}>
                  <div className="flex items-center">
                    <FiCalendar className={`h-5 w-5 mr-2 ${pathname === '/employee-calendar' ? 'text-primary' : ''}`} />
                    <span>ปฏิทินพนักงาน</span>
                  </div>
                </Link>
              </li>
              <li className="relative">
                <Link href="/projects" className={`rounded-md px-4 py-3 flex items-center ${isActive('/projects')}`}>
                  <div className="flex items-center">
                    <FiFileText className={`h-5 w-5 mr-2 ${pathname === '/projects' ? 'text-primary' : ''}`} />
                    <span>โปรเจค</span>
                  </div>
                </Link>
              </li>
              <li className="relative">
                <Link href="/reports" className={`rounded-md px-4 py-3 flex items-center ${isActive('/reports')}`}>
                  <div className="flex items-center">
                    <FiFileText className={`h-5 w-5 mr-2 ${pathname === '/reports' ? 'text-primary' : ''}`} />
                    <span>รายงาน</span>
                  </div>
                </Link>
              </li>
              {(session?.user?.role === 'ADMIN' || session?.user?.role?.toUpperCase() === 'ADMIN') && (
                <li className="relative">
                  <Link href="/user-access" className={`rounded-md px-4 py-3 flex items-center ${isActive('/user-access')}`}>
                    <div className="flex items-center">
                      <FiShield className={`h-5 w-5 mr-2 ${pathname === '/user-access' ? 'text-primary' : ''}`} />
                      <span>จัดการสิทธิ์</span>
                    </div>
                  </Link>
                </li>
              )}
            </ul>
          </div>
          
          {/* User menu และ Theme toggle (ด้านขวา) */}
          <div className="navbar-end">
            <ThemeToggle />
            
            <div className="dropdown dropdown-end ml-4">
              <label tabIndex={0} className="btn btn-lg btn-ghost btn-circle avatar ring-2 ring-primary/80 hover:ring-primary transition-all">
                <div className="avatar">
                  {userData && userData.image ? (
                    <div className="rounded-full w-10 h-10 relative overflow-hidden border-2 border-primary">
                      <Image 
                        src={userData.image} 
                        alt={userData.first_name || 'User'} 
                        fill
                        sizes="40px"
                        className="object-cover" 
                      />
                    </div>
                  ) : (
                    <div className={`rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold shadow-md ${getAvatarStyles()}`}>
                      <span className={theme === 'dark' ? "text-stroke-black" : ""}>{userInitial}</span>
                    </div>
                  )}
                </div>
              </label>
              <ul tabIndex={0} className="mt-3 p-2 shadow-lg menu dropdown-content bg-base-100 rounded-box w-64 border-2 border-primary/20">
                <li className="menu-title py-3 px-4 border-b border-base-200 bg-base-200">
                  <div className="flex flex-col">
                    <span className="font-bold text-base">
                      {userData ? `${userData.first_name} ${userData.last_name}` : userName}
                    </span>
                    <span className="text-sm opacity-80">{session.user.email}</span>
                  </div>
                </li>
                <li>
                  <Link href="/profile" className="py-3 hover:bg-base-200">
                    <span className="flex items-center gap-2">
                      <FiUser className="h-5 w-5 text-primary" />
                      <span>โปรไฟล์</span>
                    </span>
                  </Link>
                </li>
                <li>
                  <button onClick={handleSignOut} className="py-3 hover:bg-base-200">
                    <span className="flex items-center gap-2">
                      <FiLogOut className="h-5 w-5 text-error" />
                      <span>ออกจากระบบ</span>
                    </span>
                  </button>
                </li>
              </ul>
            </div>
            
            {/* ปุ่ม Menu สำหรับหน้าจอขนาดเล็ก */}
            <button
              onClick={toggleMobileMenu}
              className="btn btn-ghost btn-circle lg:hidden ml-2"
            >
              <FiMenu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-base-100 border-b border-base-300 shadow-md">
          <ul className="menu p-2">
            <li>
              <Link href="/dashboard" className={`${isActive('/dashboard')} my-1`}>
                <FiHome className={`h-5 w-5 ${pathname === '/dashboard' ? 'text-primary' : ''}`} />
                แดชบอร์ด
              </Link>
            </li>
            <li>
              <Link href="/employees" className={`${isActive('/employees')} my-1`}>
                <FiUsers className={`h-5 w-5 ${pathname === '/employees' ? 'text-primary' : ''}`} />
                พนักงาน
              </Link>
            </li>
            <li>
              <Link href="/leaves" className={`${isActive('/leaves')} my-1`}>
                <FiCalendar className={`h-5 w-5 ${pathname === '/leaves' ? 'text-primary' : ''}`} />
                การลา
              </Link>
            </li>
            <li>
              <Link href="/overtime" className={`${isActive('/overtime')} my-1`}>
                <FiClock className={`h-5 w-5 ${pathname === '/overtime' ? 'text-primary' : ''}`} />
                ทำงานล่วงเวลา
              </Link>
            </li>
            <li>
              <Link href="/employee-calendar" className={`${isActive('/employee-calendar')} my-1`}>
                <FiCalendar className={`h-5 w-5 ${pathname === '/employee-calendar' ? 'text-primary' : ''}`} />
                ปฏิทินพนักงาน
              </Link>
            </li>
            <li>
              <Link href="/projects" className={`${isActive('/projects')} my-1`}>
                <FiFileText className={`h-5 w-5 ${pathname === '/projects' ? 'text-primary' : ''}`} />
                โปรเจค
              </Link>
            </li>
            <li>
              <Link href="/reports" className={`${isActive('/reports')} my-1`}>
                <FiFileText className={`h-5 w-5 ${pathname === '/reports' ? 'text-primary' : ''}`} />
                รายงาน
              </Link>
            </li>
            {(session?.user?.role === 'ADMIN' || session?.user?.role?.toUpperCase() === 'ADMIN') && (
              <li>
                <Link href="/user-access" className={`${isActive('/user-access')} my-1`}>
                  <FiShield className={`h-5 w-5 ${pathname === '/user-access' ? 'text-primary' : ''}`} />
                  จัดการสิทธิ์
                </Link>
              </li>
            )}
            <li>
              <Link href="/profile" className={`${isActive('/profile')} my-1`}>
                <FiUser className={`h-5 w-5 ${pathname === '/profile' ? 'text-primary' : ''}`} />
                โปรไฟล์
              </Link>
            </li>
          </ul>
        </div>
      )}
      
      {/* Main content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 bg-base-200">
        <div className="container mx-auto">
          {children}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="footer footer-center p-4 bg-base-200 text-base-content text-sm border-t border-base-300">
        <p>© {new Date().getFullYear()} BO Resource Management. All rights reserved.</p>
      </footer>
    </div>
  );
} 