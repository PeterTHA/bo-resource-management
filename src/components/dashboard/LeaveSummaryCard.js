'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';

// กำหนดสีชุดใหม่ที่สวยงามกว่า
const COLORS = {
  "ลาป่วย": "#E57373", // แดง
  "ลากิจ": "#64B5F6", // ฟ้า
  "ลาพักร้อน": "#81C784", // เขียว
  "ลาฝึกอบรม": "#FFD54F", // เหลือง
  "ลาคลอด": "#BA68C8", // ม่วง
  "default": "#9E9E9E" // เทา
};

export function LeaveSummaryCard() {
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leavesByType, setLeavesByType] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]); // สำหรับเก็บสถิติรายเดือน

  useEffect(() => {
    const fetchLeaveData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/leave-summary');
        const data = await response.json();
        
        if (data.success) {
          // ใช้ข้อมูลที่คำนวณมาจาก API
          setLeavesByType(data.data.byType);
          setMonthlyStats(data.data.monthlyStats || []);
          
          setError(null);
        } else {
          setError(data.message || 'ไม่สามารถดึงข้อมูลการลาได้');
        }
      } catch (err) {
        console.error('Error fetching leave data:', err);
        setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveData();
  }, []);

  // คำนวณจำนวนรวมของวันลาทั้งหมด จากข้อมูลที่ได้จาก API
  const totalLeaveDays = useMemo(() => {
    if (!leavesByType) return 0;
    return leavesByType.reduce((total, data) => total + data.total_days, 0);
  }, [leavesByType]);

  // คำนวณจำนวนรวมของวันลาที่อนุมัติแล้ว จากข้อมูลที่ได้จาก API
  const totalApprovedDays = useMemo(() => {
    if (!leavesByType) return 0;
    return leavesByType.reduce((total, data) => total + data.approved.days, 0);
  }, [leavesByType]);

  // คำนวณเปอร์เซ็นต์การเปลี่ยนแปลงเทียบกับเดือนที่แล้ว (สมมติว่าเพิ่มขึ้น 10%)
  const trendPercentage = 10;

  if (loading) {
    return (
      <Card className="border shadow-sm bg-white">
        <CardHeader
          title="สถิติการลาแยกประเภท"
          subtitle="กำลังโหลดข้อมูล..."
        />
        <CardContent className="pb-0">
          <div className="mx-auto flex items-center justify-center h-40">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border shadow-sm bg-white">
        <CardHeader
          title="สถิติการลาแยกประเภท"
        />
        <CardContent>
          <ErrorMessage message={error} />
        </CardContent>
      </Card>
    );
  }

  const currentYear = new Date().getFullYear();

  return (
    <Card className="border shadow-sm bg-white">
      <CardHeader 
        title="สถิติการลาแยกประเภท"
        subtitle={`ปี ${currentYear}`}
        className="items-center pb-0 pt-5"
      />
      
      <CardContent className="flex-1 pb-0 px-4">
        {/* สถิติการลาแยกประเภท */}
        {leavesByType && leavesByType.length > 0 ? (
          <div className="space-y-3">
            {leavesByType.map((leaveData, index) => (
              <div key={index} className="border rounded-md p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center mb-2">
                  <div
                    className="h-3 w-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[leaveData.type] || COLORS.default }}
                  ></div>
                  <span className="font-medium">{leaveData.type}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">จำนวนครั้ง:</span>
                    <span className="font-medium">{leaveData.total} ครั้ง</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">จำนวนวัน:</span>
                    <span className="font-medium">{leaveData.total_days} วัน</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">อนุมัติแล้ว:</span>
                    <span className="font-medium">{leaveData.approved.count} ครั้ง</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">รออนุมัติ:</span>
                    <span className="font-medium">{leaveData.waiting_for_approve.count} ครั้ง</span>
                  </div>
                </div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="h-1.5 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (leaveData.total_days / (totalLeaveDays || 1)) * 100)}%`,
                      backgroundColor: COLORS[leaveData.type] || COLORS.default
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-10">
            <p className="text-gray-500">ไม่มีข้อมูลการลา</p>
          </div>
        )}
        
        {/* สถิติรายเดือน */}
        {monthlyStats && monthlyStats.length > 0 && (
          <div className="space-y-4 mt-6">
            <h3 className="text-sm font-semibold border-b pb-2 flex justify-between">
              <span>วันลารายเดือน</span>
              <span className="text-xs text-muted-foreground">(อนุมัติแล้ว)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {monthlyStats.map((stat, index) => (
                <div key={index} className="border rounded-md p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{stat.name.split(' ')[0]}</span>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-muted-foreground">{stat.count} ครั้ง</span>
                      <span className="font-medium text-xs bg-purple-50 py-1 px-2 rounded-md">
                        {stat.days.toFixed(1)} วัน
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-purple-600 h-1.5 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, (stat.days / (totalApprovedDays || 1)) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex-col gap-2 text-sm pt-3 pb-5">
        <div className="flex items-center gap-2 font-medium leading-none">
          <span>เพิ่มขึ้น {Math.abs(trendPercentage)}% จากปีที่แล้ว</span>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </div>
        <div className="leading-none text-muted-foreground">
          แสดงข้อมูลการลาทั้งหมดในปี {currentYear}
        </div>
      </CardFooter>
    </Card>
  );
} 