'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiUsers, FiSearch } from 'react-icons/fi';
import { LoadingPage } from '../../components/ui/LoadingSpinner';

export default function EmployeeListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        
        console.log('Fetching employees from API...');
        const res = await fetch('/api/employees');
        
        if (!res.ok) {
          setError('ไม่สามารถโหลดข้อมูลพนักงานได้');
          setEmployees([]);
          return;
        }
        
        const data = await res.json();
        console.log('API response:', data);
        
        // ตรวจสอบรูปแบบข้อมูลที่ได้รับ
        setEmployees(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchEmployees();
    }
  }, [session]);

  const filteredEmployees = employees.filter(employee => {
    if (!employee) return false;
    
    const searchValue = searchTerm.toLowerCase();
    
    return (
      employee.firstName?.toLowerCase().includes(searchValue) ||
      employee.lastName?.toLowerCase().includes(searchValue) ||
      employee.email?.toLowerCase().includes(searchValue) ||
      employee.position?.toLowerCase().includes(searchValue)
    );
  });

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingPage message="กำลังโหลดข้อมูลพนักงาน..." />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FiUsers className="mr-2 text-blue-600 dark:text-blue-400" /> รายการพนักงาน (หน้าทดสอบ)
        </h1>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาพนักงาน..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      </div>
      
      {employees.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">รหัสพนักงาน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">ตำแหน่ง</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">อีเมล</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{employee.employeeId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {`${employee.firstName || ''} ${employee.lastName || ''}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{employee.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{employee.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-10 text-center">
          <div className="flex flex-col items-center justify-center">
            <FiUsers className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">ไม่พบข้อมูลพนักงาน</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">กรุณาลองใหม่อีกครั้ง</p>
          </div>
        </div>
      )}
    </div>
  );
} 