'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { TrendingUp } from 'lucide-react';

// สีสำหรับแท่งกราฟแต่ละเดือน - ใช้สีเดียวคล้ายกับในรูปภาพ
const CHART_COLOR = '#e07a5f';

export function OvertimeBarChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trendPercentage, setTrendPercentage] = useState(5.2); // ตัวอย่าง trend percentage

  useEffect(() => {
    const fetchOvertimeData = async () => {
      try {
        // ดึงข้อมูลเฉพาะปีปัจจุบัน
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1); // 1 มกราคม ปีปัจจุบัน
        const endDate = new Date(currentYear, 11, 31); // 31 ธันวาคม ปีปัจจุบัน

        const response = await fetch(`/api/overtime?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&summary=true`);
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'ไม่สามารถดึงข้อมูลได้');
        }
        
        // มีข้อมูลสรุปตามเดือนหรือไม่
        if (data.data && data.data.monthlySummary) {
          // สร้างข้อมูลตั้งต้นสำหรับทุกเดือนในปีนี้
          const thaiMonthNames = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
          ];
          
          // สร้างข้อมูลเริ่มต้นสำหรับทุกเดือน
          const allMonthsData = thaiMonthNames.map(month => ({
            month,
            total_hours: 0,
            count: 0
          }));
          
          // อัพเดทข้อมูลจากที่มีอยู่จริง
          data.data.monthlySummary.forEach(monthData => {
            const monthIndex = thaiMonthNames.findIndex(m => m === monthData.month);
            if (monthIndex !== -1) {
              allMonthsData[monthIndex].total_hours = Math.round(monthData.total_hours);
              allMonthsData[monthIndex].count = monthData.count;
            }
          });
          
          setChartData(allMonthsData);
        } else {
          // ถ้าไม่มีข้อมูลจริง ใช้ข้อมูลตัวอย่างคล้ายในรูปภาพ
          const currentYear = new Date().getFullYear();
          const thaiMonthNames = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
          ];
          
          const mockData = thaiMonthNames.map(month => ({
            month,
            total_hours: 0,
            count: 0
          }));
          
          // ตัวอย่างข้อมูล
          mockData[0].total_hours = 186; // มกราคม
          mockData[1].total_hours = 305; // กุมภาพันธ์
          mockData[2].total_hours = 237; // มีนาคม
          mockData[3].total_hours = 73;  // เมษายน
          mockData[4].total_hours = 209; // พฤษภาคม
          mockData[5].total_hours = 214; // มิถุนายน
          
          setChartData(mockData);
        }
      } catch (err) {
        console.error('Error fetching overtime data:', err);
        setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    fetchOvertimeData();
  }, []);

  if (loading) {
    return (
      <Card className="border shadow-sm">
        <CardHeader title="Chart" />
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-[350px] w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border shadow-sm">
        <CardHeader title="Chart" />
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const currentYear = new Date().getFullYear();
  const firstHalfOfYear = `มกราคม - มิถุนายน ${currentYear}`;

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M8 17V9" />
          <path d="M12 17V13" />
          <path d="M16 17V7" />
        </svg>
        <span>Chart</span>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center justify-center size-8 border rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            </svg>
          </button>
          <button className="bg-white border text-black px-4 py-2 rounded-md text-sm font-medium">
            View Code
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold">Bar Chart - Custom Label</h3>
            <p className="text-gray-500">{firstHalfOfYear}</p>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
                barSize={30}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="month" 
                  type="category" 
                  width={100}
                  tick={{ fill: '#6b7280', fontSize: 16 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value) => [value, 'ชั่วโมง']}
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '8px 12px',
                    backgroundColor: '#fff'
                  }}
                />
                <Bar 
                  dataKey="totalHours" 
                  fill={CHART_COLOR}
                  radius={[0, 8, 8, 0]}
                  background={{ fill: '#f3f4f6' }}
                >
                  <LabelList 
                    dataKey="totalHours" 
                    position="right" 
                    style={{ 
                      fontWeight: 'bold', 
                      fill: '#374151',
                      fontSize: '16px'
                    }}
                    offset={10}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col space-y-1">
            <div className="flex items-center text-sm font-medium">
              <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
              <span>เพิ่มขึ้น {trendPercentage}% ในเดือนนี้</span>
            </div>
            <p className="text-sm text-muted-foreground">
              แสดงจำนวนชั่วโมงการทำงานล่วงเวลาในรอบ 6 เดือน
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 