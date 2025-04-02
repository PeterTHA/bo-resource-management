'use client';

import { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiLogIn, FiHelpCircle, FiGrid } from 'react-icons/fi';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ตรวจสอบว่าผู้ใช้ล็อกอินอยู่แล้วหรือไม่
  useEffect(() => {
    // ถ้ามี session อยู่แล้ว ให้ redirect ไปที่ dashboard ทันที
    if (session) {
      router.replace('/dashboard');
    }
  }, [session, router]);

  // ตรวจสอบว่ามีการออกจากระบบโดยตั้งใจหรือไม่
  useEffect(() => {
    // ล้าง session เฉพาะเมื่อมีพารามิเตอร์ logout หรือต้องการล้าง session เท่านั้น
    const shouldLogout = searchParams.get('logout') === 'true';
    const errorType = searchParams.get('error');
    
    if (shouldLogout || errorType) {
      // ทำการออกจากระบบเมื่อมีพารามิเตอร์ logout หรือมีข้อผิดพลาด
      signOut({ redirect: false });
      
      // ล้าง local/session storage ที่เกี่ยวข้อง
      localStorage.removeItem('nextauth.message');
      localStorage.removeItem('auth_success');
      sessionStorage.removeItem('nextauth.message');
    }
    
    // ถ้ามี query string ให้เปลี่ยนเส้นทางไปที่หน้า login โดยไม่มี query string
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  // ตรวจสอบ URL parameters เมื่อโหลดหน้า
  useEffect(() => {
    const errorType = searchParams.get('error');
    if (errorType === 'SessionExpired') {
      setError('เซสชันของคุณหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง');
    } else if (errorType === 'ServerRestarted') {
      setError('เซิร์ฟเวอร์มีการรีสตาร์ท กรุณาเข้าสู่ระบบอีกครั้ง');
    } else if (errorType === 'AuthError') {
      setError('เกิดข้อผิดพลาดในระบบยืนยันตัวตน กรุณาเข้าสู่ระบบอีกครั้ง');
    } else if (errorType === 'ConfigError') {
      setError('เกิดข้อผิดพลาดในการตั้งค่าระบบ กรุณาติดต่อผู้ดูแลระบบ');
    } else if (errorType) {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ใช้ redirect: false เพื่อจัดการการนำทางเอง
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });
      
      if (!result) {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
      } else if (result.error) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (result.ok) {
        // สร้าง timestamp เพื่อป้องกันการแคชหน้า
        const timestamp = new Date().getTime();
        
        // ใช้การนำทางแบบบังคับโดยเพิ่ม timestamp เป็น hash fragment
        window.location.href = `/dashboard#${timestamp}`;
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <div className="bg-background rounded-lg shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* ฟอร์มล็อกอิน */}
            <div className="p-8 md:w-1/2">
              <div className="mb-6 flex flex-col gap-2 text-center">
                <div className="flex items-center justify-center gap-2 self-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <FiGrid className="size-4" />
                  </div>
                  <span className="text-xl font-semibold">ระบบจัดการทรัพยากรบุคคล</span>
                </div>
                <p className="text-sm text-muted-foreground">เข้าสู่ระบบเพื่อจัดการข้อมูลพนักงาน การลา และการทำงานล่วงเวลา</p>
              </div>

              <form onSubmit={handleSubmit} method="POST" className="space-y-4">
                {error && <ErrorMessage message={error} />}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="email">อีเมล</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="your.email@example.com"
                      className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium" htmlFor="password">รหัสผ่าน</label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                      ลืมรหัสผ่าน?
                    </Link>
                  </div>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    "เข้าสู่ระบบ"
                  )}
                </button>
              </form>
            </div>
            
            {/* รูปภาพด้านข้าง */}
            <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-primary-100 to-primary-50 relative">
              <div className="absolute inset-0 bg-cover bg-center" style={{ 
                backgroundImage: "url('/images/login-illustration.svg')", 
                opacity: 0.9
              }}></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <h2 className="text-2xl font-bold text-primary-950 mb-4">ระบบจัดการทรัพยากรบุคคล</h2>
                <p className="text-primary-800 max-w-xs">
                  ระบบที่ช่วยให้การจัดการข้อมูลพนักงาน การลางาน และการทำงานล่วงเวลาเป็นเรื่องง่าย
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 