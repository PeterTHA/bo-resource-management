'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
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
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">รายการพนักงาน</h1>
        {session?.user.role === 'admin' && (
          <Link href="/employees/add" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center">
            <FiPlus className="mr-2" />
            เพิ่มพนักงาน
          </Link>
        )}
      </div>
      
      {connectionError ? (
        <ConnectionErrorMessage />
      ) : error && (
        <ErrorMessage message={error} type="error" />
      )}
      
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหาพนักงาน..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FiSearch className="absolute right-3 top-3 text-gray-400" />
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-blue-300 border-t-blue-600" role="status">
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      ) : employees.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสพนักงาน</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ตำแหน่ง</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">แผนก</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อีเมล</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.employee_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{`${employee.first_name} ${employee.last_name}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.position}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {employee.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link href={`/employees/${employee.id}/edit`} className="text-blue-600 hover:text-blue-900">
                        <FiEdit className="h-5 w-5" />
                      </Link>
                      {session?.user.role === 'admin' && (
                        <button
                          onClick={() => handleDelete(employee.id)}
                          className="text-red-600 hover:text-red-900"
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
      ) : (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-500">ไม่พบข้อมูลพนักงาน</p>
        </div>
      )}
    </div>
  );
} 