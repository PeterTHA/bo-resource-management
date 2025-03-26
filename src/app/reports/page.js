'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiBarChart2, FiUsers, FiCalendar, FiClock, FiChevronLeft, FiFilter, FiSearch } from 'react-icons/fi';
import { LoadingPage, LoadingButton } from '../../components/ui/LoadingSpinner';

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
      <div className="container mx-auto p-4">
        <LoadingPage message="กำลังโหลด..." />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const renderReportContent = () => {
    if (reportType === 'summary') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow dark:shadow-gray-900/30 p-6">
            <div className="flex items-center">
              <div className="bg-primary-100 dark:bg-primary/20 p-3 rounded-full mr-4">
                <FiUsers className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">พนักงานทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{reportData.totalEmployees}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow dark:shadow-gray-900/30 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 dark:bg-blue-600/20 p-3 rounded-full mr-4">
                <FiCalendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">จำนวนวันลาทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{reportData.totalLeaveDays} วัน</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow dark:shadow-gray-900/30 p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 dark:bg-purple-600/20 p-3 rounded-full mr-4">
                <FiClock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">จำนวนชั่วโมง OT ทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{reportData.totalOvertimeHours} ชั่วโมง</p>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (reportType === 'leaves') {
      return (
        <div className="overflow-x-auto mt-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
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
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {leave.employeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {leave.leaveType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {new Date(leave.startDate).toLocaleDateString('th-TH')} - {new Date(leave.endDate).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {leave.days} วัน
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          leave.status === 'รออนุมัติ' 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/30 dark:text-yellow-200' 
                            : leave.status === 'อนุมัติ' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-200'
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300">
                    ไม่พบข้อมูลการลาในช่วงเวลาที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    } else if (reportType === 'overtime') {
      return (
        <div className="overflow-x-auto mt-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
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
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {overtime.employeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {new Date(overtime.date).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {overtime.startTime} - {overtime.endTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {overtime.hours} ชั่วโมง
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          overtime.status === 'รออนุมัติ' 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/30 dark:text-yellow-200' 
                            : overtime.status === 'อนุมัติ' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-200'
                        }`}
                      >
                        {overtime.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300">
                    ไม่พบข้อมูลการทำงานล่วงเวลาในช่วงเวลาที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FiBarChart2 className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">รายงาน</h1>
        </div>
        <button
          onClick={() => router.back()}
          className="btn btn-outline btn-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FiChevronLeft className="mr-1 h-4 w-4" />
          กลับ
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/30 p-6 mb-6">
        <div className="flex items-center mb-4">
          <FiFilter className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-medium text-gray-800 dark:text-gray-100">สร้างรายงาน</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              ประเภทรายงาน
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="summary">สรุปภาพรวม</option>
              <option value="leaves">รายงานการลา</option>
              <option value="overtime">รายงานการทำงานล่วงเวลา</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              วันที่เริ่มต้น
            </label>
            <input 
              type="date"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              วันที่สิ้นสุด
            </label>
            <input 
              type="date"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        
        <div className="mt-6 text-right">
          <LoadingButton 
            onClick={handleGenerateReport}
            loading={loading}
            className="btn btn-primary"
            textClass="text-black dark:text-white"
          >
            <FiSearch className="mr-2 h-4 w-4" />
            สร้างรายงาน
          </LoadingButton>
        </div>
      </div>

      {/* แสดงผลรายงาน */}
      {reportData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/30 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                {reportType === 'summary' && 'ผลลัพธ์รายงานสรุปภาพรวม'}
                {reportType === 'leaves' && 'ผลลัพธ์รายงานการลา'}
                {reportType === 'overtime' && 'ผลลัพธ์รายงานการทำงานล่วงเวลา'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                ข้อมูลระหว่างวันที่ {new Date(startDate).toLocaleDateString('th-TH')} ถึงวันที่ {new Date(endDate).toLocaleDateString('th-TH')}
              </p>
            </div>
          </div>
          
          {renderReportContent()}
        </div>
      )}
    </div>
  );
} 