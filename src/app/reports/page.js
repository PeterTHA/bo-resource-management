'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('summary');
  const [reportData, setReportData] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    leavesByType: [],
    leavesByStatus: [],
    overtimesByStatus: [],
    overtimeHours: 0,
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session.user.role === 'employee') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!session || (session.user.role !== 'admin' && session.user.role !== 'manager')) {
        return;
      }

      try {
        setLoading(true);

        // ดึงข้อมูลพนักงาน
        const employeesRes = await fetch('/api/employees');
        const employeesData = await employeesRes.json();
        
        if (employeesData.success) {
          const activeEmployees = employeesData.data.filter(emp => emp.isActive).length;
          const inactiveEmployees = employeesData.data.filter(emp => !emp.isActive).length;
          
          setReportData(prev => ({
            ...prev,
            totalEmployees: employeesData.data.length,
            activeEmployees,
            inactiveEmployees,
          }));
        }

        // ดึงข้อมูลการลา
        const leavesRes = await fetch(`/api/leaves?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
        const leavesData = await leavesRes.json();
        
        if (leavesData.success) {
          // จัดกลุ่มตามประเภทการลา
          const leavesByType = {};
          leavesData.data.forEach(leave => {
            if (!leavesByType[leave.leaveType]) {
              leavesByType[leave.leaveType] = 0;
            }
            leavesByType[leave.leaveType]++;
          });

          // จัดกลุ่มตามสถานะการลา
          const leavesByStatus = {};
          leavesData.data.forEach(leave => {
            if (!leavesByStatus[leave.status]) {
              leavesByStatus[leave.status] = 0;
            }
            leavesByStatus[leave.status]++;
          });

          setReportData(prev => ({
            ...prev,
            leavesByType: Object.entries(leavesByType).map(([type, count]) => ({ type, count })),
            leavesByStatus: Object.entries(leavesByStatus).map(([status, count]) => ({ status, count })),
          }));
        }

        // ดึงข้อมูลการทำงานล่วงเวลา
        const overtimesRes = await fetch(`/api/overtime?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
        const overtimesData = await overtimesRes.json();
        
        if (overtimesData.success) {
          // จัดกลุ่มตามสถานะการทำงานล่วงเวลา
          const overtimesByStatus = {};
          let totalHours = 0;
          
          overtimesData.data.forEach(overtime => {
            if (!overtimesByStatus[overtime.status]) {
              overtimesByStatus[overtime.status] = 0;
            }
            overtimesByStatus[overtime.status]++;
            
            if (overtime.status === 'อนุมัติ') {
              totalHours += overtime.totalHours;
            }
          });

          setReportData(prev => ({
            ...prev,
            overtimesByStatus: Object.entries(overtimesByStatus).map(([status, count]) => ({ status, count })),
            overtimeHours: totalHours,
          }));
        }
      } catch (error) {
        setError('เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchReportData();
    }
  }, [session, dateRange]);

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value,
    }));
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

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'manager')) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">รายงาน</h1>
        <Link
          href="/dashboard"
          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
        >
          กลับ
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center mb-4 space-y-2 md:space-y-0 md:space-x-4">
          <div>
            <label htmlFor="reportType" className="block text-gray-700 font-medium mb-1">
              ประเภทรายงาน
            </label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="summary">สรุปภาพรวม</option>
              <option value="leaves">รายงานการลา</option>
              <option value="overtime">รายงานการทำงานล่วงเวลา</option>
            </select>
          </div>

          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <div>
              <label htmlFor="startDate" className="block text-gray-700 font-medium mb-1">
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateRangeChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-gray-700 font-medium mb-1">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateRangeChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {reportType === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">ข้อมูลพนักงาน</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">พนักงานทั้งหมด:</span>
                <span className="font-semibold">{reportData.totalEmployees} คน</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">พนักงานที่ทำงานอยู่:</span>
                <span className="font-semibold text-green-600">{reportData.activeEmployees} คน</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">พนักงานที่ลาออก:</span>
                <span className="font-semibold text-red-600">{reportData.inactiveEmployees} คน</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">ข้อมูลการลา</h2>
            <div className="space-y-2">
              {reportData.leavesByStatus.map(item => (
                <div key={item.status} className="flex justify-between">
                  <span className="text-gray-600">{item.status}:</span>
                  <span className="font-semibold">{item.count} รายการ</span>
                </div>
              ))}
              {reportData.leavesByStatus.length === 0 && (
                <p className="text-gray-500">ไม่มีข้อมูลการลาในช่วงเวลาที่เลือก</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">ข้อมูลการทำงานล่วงเวลา</h2>
            <div className="space-y-2">
              {reportData.overtimesByStatus.map(item => (
                <div key={item.status} className="flex justify-between">
                  <span className="text-gray-600">{item.status}:</span>
                  <span className="font-semibold">{item.count} รายการ</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-600">จำนวนชั่วโมง OT ที่อนุมัติ:</span>
                <span className="font-semibold text-green-600">{reportData.overtimeHours.toFixed(2)} ชั่วโมง</span>
              </div>
              {reportData.overtimesByStatus.length === 0 && (
                <p className="text-gray-500">ไม่มีข้อมูลการทำงานล่วงเวลาในช่วงเวลาที่เลือก</p>
              )}
            </div>
          </div>
        </div>
      )}

      {reportType === 'leaves' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">รายงานการลา</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">การลาตามประเภท</h3>
              <div className="space-y-2">
                {reportData.leavesByType.map(item => (
                  <div key={item.type} className="flex justify-between">
                    <span className="text-gray-600">{item.type}:</span>
                    <span className="font-semibold">{item.count} รายการ</span>
                  </div>
                ))}
                {reportData.leavesByType.length === 0 && (
                  <p className="text-gray-500">ไม่มีข้อมูลการลาในช่วงเวลาที่เลือก</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">การลาตามสถานะ</h3>
              <div className="space-y-2">
                {reportData.leavesByStatus.map(item => (
                  <div key={item.status} className="flex justify-between">
                    <span className="text-gray-600">{item.status}:</span>
                    <span className="font-semibold">{item.count} รายการ</span>
                  </div>
                ))}
                {reportData.leavesByStatus.length === 0 && (
                  <p className="text-gray-500">ไม่มีข้อมูลการลาในช่วงเวลาที่เลือก</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'overtime' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">รายงานการทำงานล่วงเวลา</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">การทำงานล่วงเวลาตามสถานะ</h3>
              <div className="space-y-2">
                {reportData.overtimesByStatus.map(item => (
                  <div key={item.status} className="flex justify-between">
                    <span className="text-gray-600">{item.status}:</span>
                    <span className="font-semibold">{item.count} รายการ</span>
                  </div>
                ))}
                {reportData.overtimesByStatus.length === 0 && (
                  <p className="text-gray-500">ไม่มีข้อมูลการทำงานล่วงเวลาในช่วงเวลาที่เลือก</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">สรุปชั่วโมงการทำงานล่วงเวลา</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">จำนวนชั่วโมง OT ที่อนุมัติ:</span>
                  <span className="font-semibold text-green-600">{reportData.overtimeHours.toFixed(2)} ชั่วโมง</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 