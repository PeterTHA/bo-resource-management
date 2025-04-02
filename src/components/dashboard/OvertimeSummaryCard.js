'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { format, parse, getMonth, getYear } from 'date-fns';
import { th } from 'date-fns/locale';

export function OvertimeSummaryCard() {
  const [overtimeData, setOvertimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);

  useEffect(() => {
    const fetchOvertimeData = async () => {
      try {
        const response = await fetch('/api/overtime-summary');
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message);
        }
        
        setOvertimeData(data.data);
        // ใช้ข้อมูล monthlyStats ที่คำนวณจาก API แล้ว
        setMonthlyStats(data.data.monthlyStats || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOvertimeData();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'waiting_for_approve':
        return 'bg-yellow-500';
      case 'approved':
      case 'อนุมัติ':
        return 'bg-green-500';
      case 'rejected':
      case 'ไม่อนุมัติ':
        return 'bg-red-500';
      case 'cancelled':
      case 'ยกเลิก':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'waiting_for_approve':
        return 'รอดำเนินการ';
      case 'approved':
      case 'อนุมัติ':
        return 'อนุมัติแล้ว';
      case 'rejected':
      case 'ไม่อนุมัติ':
        return 'ไม่อนุมัติ';
      case 'cancelled':
      case 'ยกเลิก':
        return 'ยกเลิก';
      default:
        return status || 'ไม่ระบุ';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="สรุปการทำงานล่วงเวลา" />
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="สรุปการทำงานล่วงเวลา" />
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="สรุปการทำงานล่วงเวลา" />
      <CardContent className="p-5 pt-0">
        <div className="space-y-5">
          {/* สถิติรวม */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-md border p-3">
              <div className="text-sm font-medium text-muted-foreground">รวม</div>
              <div className="text-2xl font-bold">{overtimeData.stats.approved + overtimeData.stats.pending}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-sm font-medium text-muted-foreground">รอ</div>
              <div className="text-2xl font-bold text-yellow-500">{overtimeData.stats.pending}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-sm font-medium text-muted-foreground">อนุมัติ</div>
              <div className="text-2xl font-bold text-green-500">{overtimeData.stats.approved}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-sm font-medium text-muted-foreground">ชั่วโมงรวม</div>
              <div className="text-2xl font-bold text-blue-500">{overtimeData.stats.approvedHours || 0}</div>
            </div>
          </div>

          {/* สถิติรายเดือน */}
          {monthlyStats && monthlyStats.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2 flex justify-between">
                <span>ชั่วโมงทำงานล่วงเวลารายเดือน</span>
                <span className="text-xs text-muted-foreground">(อนุมัติแล้ว)</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {monthlyStats.map((stat, index) => (
                  <div key={index} className="border rounded-md p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{stat.name.split(' ')[0]}</span>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-muted-foreground">{stat.count} ครั้ง</span>
                        <Badge variant="outline" className="bg-green-50 py-1 text-xs">
                          {stat.hours.toFixed(1)} ชม.
                        </Badge>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (stat.hours / (overtimeData.stats.approvedHours || 1)) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 