'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaKey, FaEnvelope, FaArrowLeft } from 'react-icons/fa';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    try {
      // ส่งคำขอไปยัง API สำหรับรีเซ็ตรหัสผ่าน (จะสร้างในขั้นตอนถัดไป)
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, employeeId }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessageType('success');
        setMessage(data.message || 'คำขอรีเซ็ตรหัสผ่านสำเร็จ ถ้ามีพนักงานที่มีข้อมูลตรงกัน ระบบจะส่งอีเมลไปให้');
        // รีเซ็ตฟอร์ม
        setEmail('');
        setEmployeeId('');
      } else {
        setMessageType('error');
        setMessage(data.message || 'เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน');
      }
    } catch (error) {
      console.error('Error requesting password reset:', error);
      setMessageType('error');
      setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-blue-600 py-6 px-6">
          <h2 className="text-2xl font-bold text-white text-center">ลืมรหัสผ่าน</h2>
          <p className="text-blue-100 text-center mt-2">กรอกข้อมูลเพื่อขอรีเซ็ตรหัสผ่าน</p>
        </div>
        
        <div className="p-6">
          {message && (
            <div 
              className={`p-4 mb-4 text-sm rounded-lg ${
                messageType === 'success' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                อีเมล
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="กรอกอีเมลของคุณ"
                  className="p-2.5 pl-10 w-full rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="employeeId" className="block text-gray-700 text-sm font-bold mb-2">
                รหัสพนักงาน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FaKey className="text-gray-400" />
                </div>
                <input
                  id="employeeId"
                  type="text"
                  placeholder="กรอกรหัสพนักงานของคุณ"
                  className="p-2.5 pl-10 w-full rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="flex flex-col space-y-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 text-white font-medium rounded-lg py-2.5 px-5 w-full flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? 'กำลังดำเนินการ...' : 'ขอรีเซ็ตรหัสผ่าน'}
              </button>
              
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-800 font-medium text-center flex items-center justify-center"
              >
                <FaArrowLeft className="mr-2" /> กลับไปยังหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 