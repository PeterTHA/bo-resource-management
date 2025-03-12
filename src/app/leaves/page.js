'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// เปลี่ยนจาก Heroicons เป็น react-icons
import { FiCheckCircle, FiXCircle, FiTrash2, FiPlus, FiFilter, FiCalendar } from 'react-icons/fi';

export default function LeavesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await fetch('/api/leaves');
        const data = await res.json();
        
        if (data.success) {
          setLeaves(data.data);
        } else {
          setError(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลการลา');
        }
      } catch (error) {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchLeaves();
    }
  }, [session]);

  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบข้อมูลการลานี้ใช่หรือไม่?')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        setLeaves(leaves.filter(leave => leave._id !== id));
      } else {
        alert(data.message || 'เกิดข้อผิดพลาดในการลบข้อมูลการลา');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    }
  };

  const handleApprove = async (id, status) => {
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setLeaves(leaves.map(leave => 
          leave._id === id ? { ...leave, status } : leave
        ));
      } else {
        alert(data.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะการลา');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    }
  };

  const filteredLeaves = leaves.filter(leave => {
    if (filter === 'all') return true;
    if (filter === 'pending') return leave.status === 'รออนุมัติ';
    if (filter === 'approved') return leave.status === 'อนุมัติ';
    if (filter === 'rejected') return leave.status === 'ไม่อนุมัติ';
    return true;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
          <FiCalendar className="mr-2 text-blue-600 dark:text-blue-400" /> รายการการลา
        </h1>
        <Link
          href="/leaves/add"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <FiPlus className="mr-2" /> ขอลางาน
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 shadow-sm dark:bg-red-900/30 dark:text-red-300 dark:border-red-500">
          <div className="flex items-center">
            <FiXCircle className="h-5 w-5 mr-2 text-red-500 dark:text-red-400" />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center">
            <FiFilter className="mr-2" /> กรองข้อมูล
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === 'pending'
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              รออนุมัติ
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === 'approved'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              อนุมัติแล้ว
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === 'rejected'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              ไม่อนุมัติ
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  พนักงาน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ประเภทการลา
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  วันที่ลา
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  จำนวนวัน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  เหตุผล
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLeaves.length > 0 ? (
                filteredLeaves.map((leave) => (
                  <tr key={leave._id || leave.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-300 font-medium">
                            {leave.employee?.firstName?.charAt(0) || ''}{leave.employee?.lastName?.charAt(0) || ''}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {leave.employee?.firstName || ''} {leave.employee?.lastName || ''}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {leave.employee?.position || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                        {leave.leaveType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{formatDate(leave.startDate)}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{formatDate(leave.endDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1} วัน
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {leave.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          leave.status === 'รออนุมัติ'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : leave.status === 'อนุมัติ'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {(session.user.role === 'admin' || session.user.role === 'manager') && leave.status === 'รออนุมัติ' && (
                          <>
                            <button
                              onClick={() => handleApprove(leave._id, 'อนุมัติ')}
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1 rounded-full hover:bg-green-50 dark:hover:bg-green-900 transition-colors duration-200"
                              title="อนุมัติ"
                            >
                              <FiCheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleApprove(leave._id, 'ไม่อนุมัติ')}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900 transition-colors duration-200"
                              title="ไม่อนุมัติ"
                            >
                              <FiXCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        
                        {(session.user.role === 'admin' || 
                          (session.user.id === leave.employee._id && leave.status === 'รออนุมัติ')) && (
                          <button
                            onClick={() => handleDelete(leave._id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900 transition-colors duration-200"
                            title="ลบ"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <p className="text-lg font-medium text-gray-900 dark:text-gray-100">ไม่พบข้อมูลการลา</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">ลองเปลี่ยนตัวกรองหรือเพิ่มข้อมูลการลาใหม่</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 