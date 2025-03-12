'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiUser, FiUsers } from 'react-icons/fi';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import ErrorMessage, { ConnectionErrorMessage } from '../../components/ui/ErrorMessage';

export default function EmployeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionError, setConnectionError] = useState(false);
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
        setError('');
        setConnectionError(false);
        
        const res = await fetch('/api/employees');
        
        if (!res.ok) {
          // ถ้าเกิด error ในการเชื่อมต่อกับ API
          if (res.status === 500) {
            setError('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
            setConnectionError(true);
          } else {
            const errorData = await res.json();
            setError(errorData.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน');
          }
          setEmployees([]);
          return;
        }
        
        const data = await res.json();
        
        // ตรวจสอบว่ามีข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูลหรือไม่
        if (data.connectionError) {
          setConnectionError(true);
          setError(data.message || 'ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        }
        
        setEmployees(data.data || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setError('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        setConnectionError(true);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchEmployees();
    }
  }, [session]);

  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบข้อมูลพนักงานนี้ใช่หรือไม่?')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        setEmployees(employees.filter(employee => employee.id !== id));
      } else {
        alert(data.message || 'เกิดข้อผิดพลาดในการลบข้อมูลพนักงาน');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    if (!employee) return false;
    
    const searchValue = searchTerm.toLowerCase();
    return (
      employee.first_name?.toLowerCase().includes(searchValue) ||
      employee.last_name?.toLowerCase().includes(searchValue) ||
      employee.employee_id?.toLowerCase().includes(searchValue) ||
      employee.email?.toLowerCase().includes(searchValue) ||
      employee.position?.toLowerCase().includes(searchValue) ||
      employee.department?.toLowerCase().includes(searchValue)
    );
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <p className="mt-2">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center">
          <FiUsers className="mr-2 text-purple-600 dark:text-purple-400" /> รายการพนักงาน
        </h1>
        <Link
          href="/employees/add"
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg flex items-center transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <FiPlus className="mr-2" /> เพิ่มพนักงาน
        </Link>
      </div>
      
      {connectionError ? (
        <ConnectionErrorMessage />
      ) : error && (
        <ErrorMessage message={error} type="error" />
      )}
      
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาพนักงาน..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-purple-300 border-t-purple-600 dark:border-purple-700 dark:border-t-purple-400" role="status">
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">กำลังโหลดข้อมูล...</p>
        </div>
      ) : employees.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">รหัสพนักงาน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ตำแหน่ง</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">แผนก</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">อีเมล</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">จัดการ</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{employee.employee_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 dark:text-purple-400 font-medium">
                            {employee.first_name?.charAt(0) || ''}{employee.last_name?.charAt(0) || ''}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {`${employee.first_name || ''} ${employee.last_name || ''}`}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.role === 'admin' ? 'ผู้ดูแลระบบ' : employee.role === 'manager' ? 'ผู้จัดการ' : 'พนักงาน'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{employee.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{employee.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{employee.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                        {employee.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link href={`/employees/${employee.id}/edit`} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors duration-200" title="แก้ไข">
                          <FiEdit className="h-5 w-5" />
                        </Link>
                        {session?.user.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(employee.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-200"
                            title="ลบ"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-10 text-center">
          <div className="flex flex-col items-center justify-center">
            <FiUser className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">ไม่พบข้อมูลพนักงาน</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">เพิ่มพนักงานใหม่เพื่อเริ่มต้นใช้งานระบบ</p>
            <Link
              href="/employees/add"
              className="mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg flex items-center transition-all duration-200"
            >
              <FiPlus className="mr-2" /> เพิ่มพนักงาน
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 