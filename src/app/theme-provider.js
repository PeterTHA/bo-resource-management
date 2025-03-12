'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => null,
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // ตรวจสอบ theme จาก localStorage หรือ system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemPreference;
    
    setTheme(initialTheme);
    applyTheme(initialTheme);

    // เพิ่ม event listener สำหรับการเปลี่ยนแปลง system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // ฟังก์ชันสำหรับใช้งาน theme
  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
      document.body.style.backgroundColor = 'var(--bg-color)';
      document.body.style.color = 'var(--text-color)';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = 'var(--bg-color)';
      document.body.style.color = 'var(--text-color)';
    }
    
    root.setAttribute('data-theme', newTheme);

    // อัปเดต meta theme-color สำหรับ mobile browser
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        newTheme === 'dark' ? '#0f172a' : '#ffffff'
      );
    }
  };
  
  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };
  
  // ป้องกัน hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme: changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
} 