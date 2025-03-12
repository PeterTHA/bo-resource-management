'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SetupPostgresPage() {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [setupResult, setSetupResult] = useState(null);
  const [error, setError] = useState('');

  const handleTestConnection = async () => {
    setLoading(true);
    setError('');
    setTestResult(null);

    try {
      const res = await fetch('/api/setup-postgres', {
        method: 'GET',
      });
      
      const data = await res.json();
      setTestResult(data);
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการทดสอบการเชื่อมต่อ');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupDatabase = async () => {
    setLoading(true);
    setError('');
    setSetupResult(null);

    try {
      const res = await fetch('/api/setup-postgres', {
        method: 'POST',
      });
      
      const data = await res.json();
      setSetupResult(data);
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการตั้งค่าฐานข้อมูล');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">ตั้งค่าฐานข้อมูล Vercel Postgres</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {testResult && (
          <div className={`${testResult.success ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded mb-4`}>
            <p className="font-medium">{testResult.message}</p>
            {testResult.success && testResult.data && (
              <p className="text-sm mt-1">เวลาเซิร์ฟเวอร์: {new Date(testResult.data.now).toLocaleString()}</p>
            )}
            {!testResult.success && testResult.error && (
              <p className="text-sm mt-1">ข้อผิดพลาด: {testResult.error}</p>
            )}
          </div>
        )}
        
        {setupResult && (
          <div className={`${setupResult.success ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded mb-4`}>
            <p className="font-medium">{setupResult.message}</p>
            {setupResult.success && setupResult.adminCreated && (
              <div className="text-sm mt-2">
                <p className="font-medium">บัญชีผู้ดูแลระบบเริ่มต้น:</p>
                <p>อีเมล: admin@example.com</p>
                <p>รหัสผ่าน: admin123</p>
              </div>
            )}
            {!setupResult.success && setupResult.error && (
              <p className="text-sm mt-1">ข้อผิดพลาด: {setupResult.error}</p>
            )}
          </div>
        )}
        
        <div className="space-y-4 mt-6">
          <button
            onClick={handleTestConnection}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
          </button>
          
          <button
            onClick={handleSetupDatabase}
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'กำลังตั้งค่า...' : 'ตั้งค่าฐานข้อมูล'}
          </button>
          
          {setupResult && setupResult.success && (
            <Link
              href="/login"
              className="w-full bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 block text-center"
            >
              ไปยังหน้าเข้าสู่ระบบ
            </Link>
          )}
        </div>
        
        <div className="mt-6 text-sm text-gray-600">
          <p className="mb-2">หมายเหตุ:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>ต้องตั้งค่า Environment Variables ใน Vercel ให้ถูกต้องก่อนใช้งาน</li>
            <li>ต้องสร้าง Postgres Database ใน Vercel Dashboard ก่อน</li>
            <li>การตั้งค่าจะสร้างตารางที่จำเป็นและบัญชีผู้ดูแลระบบเริ่มต้น</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 