'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiUsers, FiCalendar, FiClock, FiPieChart, FiUser, FiFileText, FiPlus } from 'react-icons/fi';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
// นำเข้าฟังก์ชัน Redis แต่ใช้ try-catch เพื่อจัดการกับข้อผิดพลาด
let redisModule;
try {
  redisModule = require('../../lib/redis');
} catch (error) {
  console.error('Redis module error:', error);
  redisModule = {
    getCachedData: () => ({ success: false }),
    cacheData: () => ({ success: false }),
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    pendingOvertimes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // ลองดึงข้อมูลจาก Redis cache ก่อน (ถ้า Redis พร้อมใช้งาน)
        let useCache = false;
        try {
          const cachedStats = await redisModule.getCachedData('dashboard_stats');
          
          if (cachedStats.success) {
            setStats(cachedStats.data);
            setLoading(false);
            useCache = true;
          }
        } catch (error) {
          console.log('Redis not available, fetching from API');
        }
        
        // ถ้าไม่มีใน cache หรือ Redis ยังไม่พร้อม ให้ดึงจาก API
        if (!useCache) {
          // ดึงข้อมูลพนักงาน
          let employeesData = { data: [] };
          try {
            const employeesRes = await fetch('/api/employees');
            employeesData = await employeesRes.json();
          } catch (error) {
            console.error('Error fetching employees:', error);
          }
          
          // ดึงข้อมูลการลา
          let pendingLeaves = [];
          try {
            const leavesRes = await fetch('/api/leaves');
            const leavesData = await leavesRes.json();
            // ตรวจสอบว่า leavesData.data มีค่าและเป็น array ก่อนใช้ filter
            if (leavesData && leavesData.data && Array.isArray(leavesData.data)) {
              pendingLeaves = leavesData.data.filter(leave => leave && leave.status === 'รออนุมัติ');
            }
          } catch (error) {
            console.error('Error fetching leaves:', error);
          }
          
          // ดึงข้อมูลการทำงานล่วงเวลา
          let pendingOvertimes = [];
          try {
            const overtimesRes = await fetch('/api/overtime');
            const overtimesData = await overtimesRes.json();
            // ตรวจสอบว่า overtimesData.data มีค่าและเป็น array ก่อนใช้ filter
            if (overtimesData && overtimesData.data && Array.isArray(overtimesData.data)) {
              pendingOvertimes = overtimesData.data.filter(overtime => overtime && overtime.status === 'รออนุมัติ');
            }
          } catch (error) {
            console.error('Error fetching overtimes:', error);
          }
          
          const newStats = {
            totalEmployees: employeesData && employeesData.data && Array.isArray(employeesData.data) ? employeesData.data.length : 0,
            pendingLeaves: pendingLeaves.length,
            pendingOvertimes: pendingOvertimes.length,
          };
          
          setStats(newStats);
          
          // เก็บข้อมูลใน Redis cache (หมดอายุใน 5 นาที) ถ้า Redis พร้อมใช้งาน
          try {
            await redisModule.cacheData('dashboard_stats', newStats, 300);
          } catch (error) {
            console.log('Redis not available for caching');
          }
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchStats();
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-primary-300 border-t-primary-500" role="status">
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <p className="mt-2 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 bg-white">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">แดชบอร์ด</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary-100 mr-4">
                <FiUsers className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">พนักงานทั้งหมด</p>
                <p className="text-2xl font-bold text-primary-600">{stats.totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-100 mr-4">
                <FiCalendar className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">การลารออนุมัติ</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pendingLeaves}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-emerald-100 mr-4">
                <FiClock className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">OT รออนุมัติ</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.pendingOvertimes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-xl font-semibold text-gray-800 mb-4">ทางลัด</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {session?.user.role === 'admin' && (
          <Link href="/employees/add" className="block">
            <Card className="hover:bg-primary-50 transition-colors">
              <CardContent>
                <div className="flex items-center p-2">
                  <div className="p-3 rounded-full bg-primary-100 mr-4">
                    <FiPlus className="h-5 w-5 text-primary-800" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">เพิ่มพนักงาน</h3>
                    <p className="text-sm text-gray-600">เพิ่มข้อมูลพนักงานใหม่</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
        
        <Link href="/leaves/add" className="block">
          <Card className="hover:bg-amber-50 transition-colors">
            <CardContent>
              <div className="flex items-center p-2">
                <div className="p-3 rounded-full bg-amber-100 mr-4">
                  <FiCalendar className="h-5 w-5 text-amber-800" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">ขอลางาน</h3>
                  <p className="text-sm text-gray-600">ส่งคำขอลางาน</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/overtime/add" className="block">
          <Card className="hover:bg-emerald-50 transition-colors">
            <CardContent>
              <div className="flex items-center p-2">
                <div className="p-3 rounded-full bg-emerald-100 mr-4">
                  <FiClock className="h-5 w-5 text-emerald-800" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">ขอทำงานล่วงเวลา</h3>
                  <p className="text-sm text-gray-600">ส่งคำขอทำงานล่วงเวลา</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/profile" className="block">
          <Card className="hover:bg-indigo-50 transition-colors">
            <CardContent>
              <div className="flex items-center p-2">
                <div className="p-3 rounded-full bg-indigo-100 mr-4">
                  <FiUser className="h-5 w-5 text-indigo-800" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">โปรไฟล์</h3>
                  <p className="text-sm text-gray-600">จัดการข้อมูลส่วนตัว</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        {(session?.user.role === 'admin' || session?.user.role === 'manager') && (
          <Link href="/reports" className="block">
            <Card className="hover:bg-purple-50 transition-colors">
              <CardContent>
                <div className="flex items-center p-2">
                  <div className="p-3 rounded-full bg-purple-100 mr-4">
                    <FiFileText className="h-5 w-5 text-purple-800" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">รายงาน</h3>
                    <p className="text-sm text-gray-600">ดูรายงานสรุป</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
} 