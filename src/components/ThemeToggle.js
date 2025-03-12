'use client';

import { useState, useEffect } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../app/theme-provider';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // เมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    setMounted(true);
  }, []);

  // ป้องกัน hydration mismatch
  if (!mounted) {
    return <div className="w-10 h-10"></div>;
  }

  // เปลี่ยนธีม
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-12 h-6 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
      aria-label="สลับธีม"
      title={theme === 'light' ? 'เปลี่ยนเป็นโหมดมืด' : 'เปลี่ยนเป็นโหมดสว่าง'}
    >
      <span 
        className={`absolute left-1 top-1 flex items-center justify-center w-4 h-4 rounded-full bg-white dark:bg-gray-800 text-yellow-500 dark:text-blue-400 transition-all duration-300 transform ${
          theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        {theme === 'light' ? 
          <FiSun className="w-3 h-3" /> : 
          <FiMoon className="w-3 h-3" />
        }
      </span>
      <span className="sr-only">
        {theme === 'light' ? 'เปลี่ยนเป็นโหมดมืด' : 'เปลี่ยนเป็นโหมดสว่าง'}
      </span>
    </button>
  );
} 