'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiBarChart2, FiUsers, FiCalendar, FiClock, FiChevronLeft } from 'react-icons/fi';

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reportType, setReportType] = useState('summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    // ตั้งค่าวันที่เริ่มต้นเป็นวันแรกของเดือนปัจจุบัน
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(formatDateForInput(firstDayOfMonth));
    setEndDate(formatDateForInput(today));
  }, [status, router]);

  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError('กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/reports?type=${reportType}&startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      
      if (data.success) {
        setReportData(data.data);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-teal-300 border-t-teal-600 dark:border-teal-700 dark:border-t-teal-400" role="status">
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">กำลังโหลด...</p>
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
          <FiBarChart2 className="mr-2 text-teal-600 dark:text-teal-400" /> รายงาน
        </h1>
        <button
          onClick={() => router.back()}
          className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg flex items-center transition-all duration-200"
        >
          <FiChevronLeft className="mr-2" /> กลับ
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 shadow-sm dark:bg-red-900/30 dark:text-red-300 dark:border-red-500">
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">เลือกประเภทรายงาน</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div 
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              reportType === 'summary' 
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30' 
                : 'border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-700'
            }`}
            onClick={() => setReportType('summary')}
          >
            <div className="flex items-center">
              <div className="bg-teal-100 dark:bg-teal-900/50 p-3 rounded-full mr-4">
                <FiBarChart2 className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">สรุปภาพรวม</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">ดูสรุปข้อมูลพนักงาน การลา และการทำงานล่วงเวลา</p>
              </div>
            </div>
          </div>
          
          <div 
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              reportType === 'leaves' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
            onClick={() => setReportType('leaves')}
          >
            <div className="flex items-center">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mr-4">
                <FiCalendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">รายงานการลา</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">ดูข้อมูลการลาของพนักงานทั้งหมด</p>
              </div>
            </div>
          </div>
          
          <div 
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              reportType === 'overtime' 
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' 
                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
            onClick={() => setReportType('overtime')}
          >
            <div className="flex items-center">
              <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-full mr-4">
                <FiClock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">รายงานทำงานล่วงเวลา</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">ดูข้อมูลการทำงานล่วงเวลาของพนักงาน</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">วันที่เริ่มต้น</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">วันที่สิ้นสุด</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 text-white py-2 px-6 rounded-lg flex items-center transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="spinner-border animate-spin inline-block w-4 h-4 border-2 rounded-full border-white border-t-transparent mr-2"></div>
                กำลังประมวลผล...
              </>
            ) : (
              'สร้างรายงาน'
            )}
          </button>
        </div>
      </div>
      
      {reportData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            {reportType === 'summary' && 'สรุปภาพรวม'}
            {reportType === 'leaves' && 'รายงานการลา'}
            {reportType === 'overtime' && 'รายงานทำงานล่วงเวลา'}
          </h2>
          
          {reportType === 'summary' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center">
                  <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-full mr-4">
                    <FiUsers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">พนักงานทั้งหมด</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{reportData.totalEmployees}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center">
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mr-4">
                    <FiCalendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">จำนวนวันลาทั้งหมด</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{reportData.totalLeaveDays} วัน</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center">
                  <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-full mr-4">
                    <FiClock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">จำนวนชั่วโมง OT ทั้งหมด</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{reportData.totalOvertimeHours} ชั่วโมง</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {reportType === 'leaves' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">พนักงาน</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ประเภทการลา</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">วันที่ลา</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">จำนวนวัน</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reportData.leaves.length > 0 ? (
                    reportData.leaves.map((leave, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {leave.employeeName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {leave.leaveType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(leave.startDate).toLocaleDateString('th-TH')} - {new Date(leave.endDate).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {leave.days} วัน
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        ไม่พบข้อมูลการลาในช่วงเวลาที่เลือก
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {reportType === 'overtime' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">พนักงาน</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">วันที่</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">เวลา</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">จำนวนชั่วโมง</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reportData.overtimes.length > 0 ? (
                    reportData.overtimes.map((overtime, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {overtime.employeeName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(overtime.date).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {overtime.startTime} - {overtime.endTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {overtime.hours} ชั่วโมง
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              overtime.status === 'รออนุมัติ'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : overtime.status === 'อนุมัติ'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {overtime.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        ไม่พบข้อมูลการทำงานล่วงเวลาในช่วงเวลาที่เลือก
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 