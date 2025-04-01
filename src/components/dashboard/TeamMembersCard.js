'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { FiHome, FiBriefcase, FiRefreshCw, FiMapPin, FiCalendar } from 'react-icons/fi';

export function TeamMembersCard() {
  const [teamMembers, setTeamMembers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamLeaves, setTeamLeaves] = useState([]);
  
  // ใช้วันที่ปัจจุบันในรูปแบบที่เหมาะสมสำหรับการเปรียบเทียบ
  const getCurrentDateFormatted = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [currentDate] = useState(getCurrentDateFormatted());
  
  // ฟังก์ชันเพื่อแปลงวันที่ให้เป็นรูปแบบเดียวกัน
  const formatDateForComparison = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      
      try {
        // ดึงข้อมูลสมาชิกในทีม
        const membersResponse = await fetch('/api/team-members');
        const membersData = await membersResponse.json();
        
        if (!membersData.success) {
          throw new Error(membersData.message);
        }
        
        if (isMounted) {
          setTeamMembers(membersData.data);
        }
        
        // ดึงข้อมูลการลาของทีม (วันนี้)
        try {
          const calendarResponse = await fetch(`/api/employee-calendar/all-data?startDate=${currentDate}&endDate=${currentDate}`);
          const calendarData = await calendarResponse.json();
          
          if (calendarData.success && calendarData.data && calendarData.data.leaves && isMounted) {
            // กรองเฉพาะข้อมูลการลาที่สถานะเป็น approved หรือ waiting_for_approve
            const activeLeaves = calendarData.data.leaves.filter(leave => 
              leave.status === 'approved' || leave.status === 'waiting_for_approve'
            );
            
            if (isMounted) {
              setTeamLeaves(activeLeaves);
            }
          }
        } catch (calendarErr) {
          console.error('Error fetching calendar data:', calendarErr);
        }
      } catch (err) {
        console.error('Error fetching team data:', err);
        if (isMounted) {
          setError('ไม่สามารถดึงข้อมูลสมาชิกในทีมได้');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [currentDate]);

  // ฟังก์ชั่นตรวจสอบว่าพนักงานมีการลาในวันนี้หรือไม่
  const getEmployeeLeaveToday = (employeeId) => {
    if (!teamLeaves || teamLeaves.length === 0) return null;
    
    return teamLeaves.find(leave => {
      return String(leave.employeeId) === String(employeeId) ||
             (leave.employee && String(leave.employee.id) === String(employeeId));
    });
  };

  // ฟังก์ชั่นดึงสถานะการทำงานล่าสุดของวันนี้
  const getTodayWorkStatus = (workStatuses) => {
    if (!workStatuses || workStatuses.length === 0) return 'OFFICE';
    
    // ค้นหาสถานะการทำงานของวันนี้โดยเปรียบเทียบวันที่อย่างถูกต้อง
    const todayStatus = workStatuses.find(status => {
      if (!status.date) return false;
      const statusDate = formatDateForComparison(status.date);
      return statusDate === currentDate;
    });
    
    // ถ้ามีสถานะของวันนี้ให้ใช้ค่านั้น ถ้าไม่มีให้ใช้สถานะล่าสุด
    return todayStatus ? todayStatus.status : workStatuses[0].status;
  };

  // ฟังก์ชั่นสำหรับแสดงไอคอนตามสถานะการทำงาน
  const getStatusIcon = (status) => {
    switch (status) {
      case 'OFFICE':
        return <FiBriefcase className="w-4 h-4" />;
      case 'WFH':
        return <FiHome className="w-4 h-4" />;
      case 'MIXED':
      case 'HYBRID':
        return <FiRefreshCw className="w-4 h-4" />;
      case 'OUTSIDE':
      case 'OFFSITE':
        return <FiMapPin className="w-4 h-4" />;
      case 'LEAVE':
        return <FiCalendar className="w-4 h-4" />;
      default:
        return <FiBriefcase className="w-4 h-4" />;
    }
  };

  const getWorkStatusColor = (status) => {
    switch (status) {
      case 'OFFICE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'WFH':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MIXED':
      case 'HYBRID':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'OUTSIDE':
      case 'OFFSITE':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'LEAVE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWorkStatusText = (status) => {
    switch (status) {
      case 'OFFICE':
        return 'Office';
      case 'WFH':
        return 'WFH';
      case 'MIXED':
      case 'HYBRID':
        return 'Mix';
      case 'OUTSIDE':
      case 'OFFSITE':
        return 'WFA';
      case 'LEAVE':
        return 'Leave';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="สมาชิกในทีม" />
        <CardContent className="p-5 pt-0">
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="สมาชิกในทีม" />
        <CardContent className="p-5 pt-0">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!teamMembers || teamMembers.length === 0) {
    return (
      <Card>
        <CardHeader title="สมาชิกในทีม" />
        <CardContent className="p-5 pt-0">
          <div className="flex justify-center items-center p-6 text-muted-foreground">
            ไม่พบข้อมูลสมาชิกในทีม
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="สมาชิกในทีม" />
      <CardContent className="p-5 pt-0">
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {teamMembers.map((member, index) => {
              // ตรวจสอบว่ามีการลาในวันนี้หรือไม่
              const leaveToday = getEmployeeLeaveToday(member.id);
              
              // ดึงสถานะการทำงานล่าสุดของวันนี้
              let status = getTodayWorkStatus(member.workStatuses);
              let statusText = getWorkStatusText(status);
              let colorClass = getWorkStatusColor(status);
              
              // ถ้ามีการลาในวันนี้ ให้แสดงสถานะเป็น LEAVE แทน (มีความสำคัญสูงกว่า)
              if (leaveToday) {
                status = 'LEAVE';
                statusText = 'Leave';
                colorClass = getWorkStatusColor('LEAVE');
              }
              
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex-shrink-0">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={`${member.firstName} ${member.lastName}`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                        <span className="text-sm font-medium text-primary">
                          {member.firstName?.[0] || ''}{member.lastName?.[0] || ''}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="truncate text-sm font-medium">
                        {member.firstName} {member.lastName}
                      </h3>
                      <Badge className={`border ${colorClass} min-w-[70px] justify-center px-2 py-0.5 text-xs flex items-center gap-1 font-normal`}>
                        {getStatusIcon(status)}
                        <span>{statusText}</span>
                      </Badge>
                    </div>
                    <div className="mt-1">
                      <p className="truncate text-xs text-muted-foreground">
                        {member.positionTitle || ''}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 