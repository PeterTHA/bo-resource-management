'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiLogIn, FiHelpCircle } from 'react-icons/fi';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { LoadingButton } from '../../components/ui/LoadingSpinner';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const res = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (!res) {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
      } else if (res.error) {
        if (res.error === 'ServerRestarted') {
          setError('เซิร์ฟเวอร์มีการรีสตาร์ท กรุณาเข้าสู่ระบบอีกครั้ง');
        } else {
          setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }
      } else {
        router.push('/dashboard');
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
            <form onSubmit={handleSubmit}>
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
                <LoadingButton 
                  type="submit" 
                  className="btn-primary"
                  loading={loading}
                >
                  เข้าสู่ระบบ
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 