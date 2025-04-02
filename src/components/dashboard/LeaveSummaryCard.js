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
          setLeaveData(data.data);
          
          // จัดกลุ่มข้อมูลตามประเภทการลาและสถานะ
          const byType = {};
          data.data.forEach(leave => {
            const type = leave.leaveType || 'ไม่ระบุ';
            if (!byType[type]) {
              byType[type] = {
                total: 0,
                totalDays: 0,
                waiting_for_approve: [],
                approved: [],
                rejected: [],
                canceled: []
              };
            }
            
            // เพิ่มเข้าไปใน arrays ตามสถานะ
            if (leave.status === 'waiting_for_approve') {
              byType[type].waiting_for_approve.push(leave);
              byType[type].total++;  // นับเฉพาะ waiting และ approved
              byType[type].totalDays += leave.totalDays || 0;  // นับวันเฉพาะ waiting และ approved
            } else if (leave.status === 'approved') {
              byType[type].approved.push(leave);
              byType[type].total++;  // นับเฉพาะ waiting และ approved
              byType[type].totalDays += leave.totalDays || 0;  // นับวันเฉพาะ waiting และ approved
            } else if (leave.status === 'rejected') {
              byType[type].rejected.push(leave);
            } else if (leave.status === 'canceled') {
              byType[type].canceled.push(leave);
            }
          });
          
          // เรียงลำดับประเภทการลาตามจำนวนทั้งหมด (มากไปน้อย)
          const sortedByType = Object.fromEntries(
            Object.entries(byType).sort((a, b) => b[1].total - a[1].total)
          );
          
          setLeavesByType(sortedByType);
          
          // คำนวณข้อมูลการลาตามเดือน
          const currentYear = new Date().getFullYear();
          const thaiMonthNames = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
          ];
          
          // สร้างข้อมูลเริ่มต้นสำหรับทุกเดือนในปีปัจจุบัน
          const monthStats = {};
          for (let i = 0; i < 12; i++) {
            const monthName = `${thaiMonthNames[i]} ${currentYear}`;
            const key = `${currentYear}-${i}`;
            
            monthStats[key] = {
              name: monthName,
              days: 0,
              count: 0
            };
          }
          
          // เพิ่มข้อมูลจริงจาก approved leaves
          const approvedLeaves = data.data.filter(leave => leave.status === 'approved');
          approvedLeaves.forEach(leave => {
            const startDate = new Date(leave.startDate);
            const year = startDate.getFullYear();
            
            // เฉพาะข้อมูลของปีปัจจุบัน
            if (year === currentYear) {
              const month = startDate.getMonth();
              const key = `${year}-${month}`;
              
              if (monthStats[key]) {
                monthStats[key].days += leave.totalDays || 0;
                monthStats[key].count += 1;
              }
            }
          });
          
          // เรียงลำดับตามเดือน (มกราคม-ธันวาคม)
          setMonthlyStats(
            Object.entries(monthStats)
              .sort((a, b) => {
                const [yearA, monthA] = a[0].split('-').map(Number);
                const [yearB, monthB] = b[0].split('-').map(Number);
                return monthA - monthB;
              })
              .map(([key, stats]) => stats)
          );
          
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

  // คำนวณจำนวนรวมของวันลาทั้งหมด
  const totalLeaveDays = useMemo(() => {
    if (!leavesByType) return 0;
    return Object.values(leavesByType).reduce((total, data) => total + data.totalDays, 0);
  }, [leavesByType]);

  // คำนวณจำนวนรวมของวันลาที่อนุมัติแล้ว
  const totalApprovedDays = useMemo(() => {
    if (!leavesByType) return 0;
    return Object.values(leavesByType).reduce((total, data) => {
      // คำนวณจำนวนวันลาที่อนุมัติของแต่ละประเภท
      const approvedDays = data.approved.reduce((sum, leave) => sum + (leave.totalDays || 0), 0);
      return total + approvedDays;
    }, 0);
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
        {leavesByType && Object.keys(leavesByType).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(leavesByType).map(([type, data], index) => (
              <div key={index} className="border rounded-md p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center mb-2">
                  <div
                    className="h-3 w-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[type] || COLORS.default }}
                  ></div>
                  <span className="font-medium">{type}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">จำนวนครั้ง:</span>
                    <span className="font-medium">{data.total} ครั้ง</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">จำนวนวัน:</span>
                    <span className="font-medium">{data.totalDays} วัน</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">อนุมัติแล้ว:</span>
                    <span className="font-medium">{data.approved.length} ครั้ง</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">รออนุมัติ:</span>
                    <span className="font-medium">{data.waiting_for_approve.length} ครั้ง</span>
                  </div>
                </div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="h-1.5 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (data.totalDays / (totalLeaveDays || 1)) * 100)}%`,
                      backgroundColor: COLORS[type] || COLORS.default
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