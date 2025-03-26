'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { FiSun, FiMoon } from 'react-icons/fi';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // เมื่อ component ถูก mount บนฝั่ง client จึงแสดง UI
  useEffect(() => {
    setMounted(true);
  }, []);

  // ป้องกันการเกิด hydration error
  if (!mounted) {
    return null;
  }

  // สลับระหว่าง light กับ dark mode
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button 
      onClick={toggleTheme}
      className={`
        btn btn-lg btn-circle transition-all duration-300 shadow-lg
        scale-100 hover:scale-110
        ${theme === 'dark' 
          ? 'bg-amber-500 hover:bg-amber-600 text-amber-950 border-2 border-amber-400' 
          : 'bg-indigo-700 hover:bg-indigo-800 text-indigo-50 border-2 border-indigo-600'}
      `}
      aria-label={theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
    >
      {theme === 'dark' ? (
        <FiSun className="w-6 h-6" />
      ) : (
        <FiMoon className="w-6 h-6" />
      )}
    </button>
  );
} 