'use client';

import { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiLogIn, FiHelpCircle } from 'react-icons/fi';
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
      console.log('มี session อยู่แล้ว นำทางไปยังหน้า dashboard...');
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
        console.error('Login error:', result.error);
      } else if (result.ok) {
        console.log('ล็อกอินสำเร็จ กำลังเปลี่ยนเส้นทางไปยัง dashboard...');
        
        // สร้าง timestamp เพื่อป้องกันการแคชหน้า
        const timestamp = new Date().getTime();
        
        // ใช้การนำทางแบบบังคับโดยเพิ่ม timestamp เป็น hash fragment
        window.location.href = `/dashboard#${timestamp}`;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content flex-col lg:flex-row-reverse">
        <div className="text-center lg:text-left lg:ml-8">
          <h1 className="text-4xl font-bold">เข้าสู่ระบบ</h1>
          <p className="py-6">ระบบจัดการทรัพยากรบุคคล สำหรับจัดการข้อมูลพนักงาน การลา และการทำงานล่วงเวลา</p>
        </div>
        <div className="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
          <div className="card-body">
            <form onSubmit={handleSubmit} method="POST">
              {error && <ErrorMessage message={error} />}
              
              <div className="form-control">
                <label className="label" htmlFor="email">
                  <span className="label-text">อีเมล</span>
                </label>
                <div className="input-group">
                  <span className="bg-base-200 flex items-center justify-center px-4 border border-r-0 border-base-300 rounded-l-lg">
                    <FiMail className="text-base-content/60" />
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="อีเมล"
                    className="input input-bordered w-full rounded-l-none"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              
              <div className="form-control mt-4">
                <label className="label" htmlFor="password">
                  <span className="label-text">รหัสผ่าน</span>
                </label>
                <div className="input-group">
                  <span className="bg-base-200 flex items-center justify-center px-4 border border-r-0 border-base-300 rounded-l-lg">
                    <FiLock className="text-base-content/60" />
                  </span>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="รหัสผ่าน"
                    className="input input-bordered w-full rounded-l-none"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline flex items-center">
                    <FiHelpCircle className="mr-1" size={14} />
                    ลืมรหัสผ่าน?
                  </Link>
                </div>
              </div>
              
              <div className="form-control mt-6">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <FiLogIn className="mr-2" />
                      <span>เข้าสู่ระบบ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 