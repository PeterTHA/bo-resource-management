'use client';

import { FiEye, FiCalendar, FiUsers, FiClock, FiFlag, FiInfo, FiCode, FiMessageSquare, FiActivity } from 'react-icons/fi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ViewProjectDialog({
  open,
  onOpenChange,
  project,
}) {
  if (!project) return null;
  
  // วันที่ที่จะแสดงผล
  const formattedStartDate = project.startDate 
    ? format(new Date(project.startDate), 'dd MMMM yyyy', { locale: th })
    : '-';
  
  const formattedEndDate = project.endDate 
    ? format(new Date(project.endDate), 'dd MMMM yyyy', { locale: th })
    : '-';
  
  // ฟังก์ชันแปลงสถานะเป็นภาษาไทย
  const getStatusLabel = (status) => {
    const statusMap = {
      'active': 'กำลังดำเนินการ',
      'completed': 'เสร็จสิ้น',
      'on-hold': 'ระงับชั่วคราว',
      'cancelled': 'ยกเลิก'
    };
    return statusMap[status] || status;
  };

  // ฟังก์ชันแปลงความสำคัญเป็นภาษาไทย
  const getPriorityLabel = (priority) => {
    const priorityMap = {
      'low': 'ต่ำ',
      'medium': 'ปานกลาง',
      'high': 'สูง'
    };
    return priorityMap[priority] || priority;
  };

  // ฟังก์ชันกำหนดสีให้กับแต่ละสถานะ
  const getStatusBadgeVariant = (status) => {
    const statusVariantMap = {
      'active': 'default',
      'completed': 'success',
      'on-hold': 'warning',
      'cancelled': 'destructive'
    };
    return statusVariantMap[status] || 'default';
  };

  // ฟังก์ชันกำหนดสีให้กับแต่ละความสำคัญ
  const getPriorityBadgeVariant = (priority) => {
    const priorityVariantMap = {
      'low': 'outline',
      'medium': 'secondary',
      'high': 'destructive'
    };
    return priorityVariantMap[priority] || 'default';
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white dark:bg-gray-950 rounded-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>ข้อมูลโปรเจค</DialogTitle>
        </DialogHeader>
        
        {/* ส่วนหัว - ชื่อโปรเจค */}
        <div className="relative bg-gray-900 text-white">
          <div className="px-6 py-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white/10 text-white border-white/25">
                  {project.code}
                </Badge>
                <Badge
                  variant={getStatusBadgeVariant(project.status)}
                  className="capitalize"
                >
                  {getStatusLabel(project.status)}
                </Badge>
                <Badge
                  variant={getPriorityBadgeVariant(project.priority)}
                  className="capitalize"
                >
                  {getPriorityLabel(project.priority)}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-gray-300">{project.description}</p>
            </div>
          </div>
        </div>
        
        {/* ส่วนเนื้อหา - รายละเอียดโปรเจค */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ข้อมูลโปรเจค */}
            <div>
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-800 flex items-center">
                <FiInfo className="mr-2 text-gray-600 dark:text-gray-400" />
                ข้อมูลโปรเจค
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-full">
                    <FiCode className="text-gray-600 dark:text-gray-400" size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">รหัสโปรเจค</p>
                    <p className="text-sm font-medium">{project.code}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-full">
                    <FiCalendar className="text-gray-600 dark:text-gray-400" size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">วันที่เริ่ม</p>
                    <p className="text-sm font-medium">{formattedStartDate}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-full">
                    <FiCalendar className="text-gray-600 dark:text-gray-400" size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">วันที่สิ้นสุด</p>
                    <p className="text-sm font-medium">{formattedEndDate}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-full">
                    <FiActivity className="text-gray-600 dark:text-gray-400" size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">สถานะ</p>
                    <p className="text-sm font-medium">{getStatusLabel(project.status)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-full">
                    <FiFlag className="text-gray-600 dark:text-gray-400" size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ความสำคัญ</p>
                    <p className="text-sm font-medium">{getPriorityLabel(project.priority)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* สมาชิกในโปรเจค */}
            <div>
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-800 flex items-center">
                <FiUsers className="mr-2 text-gray-600 dark:text-gray-400" />
                สมาชิกในโปรเจค
              </h2>
              <ScrollArea className="h-[300px] pr-4">
                {project.members && project.members.length > 0 ? (
                  <div className="space-y-3">
                    {project.members.map((member) => (
                      <div key={member.employeeId} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-md">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={member.employee?.image} 
                            alt={`${member.employee?.firstName} ${member.employee?.lastName}`} 
                          />
                          <AvatarFallback>
                            {member.employee?.firstName?.charAt(0)}
                            {member.employee?.lastName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {member.employee?.firstName} {member.employee?.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {member.employee?.positionTitle || 'ไม่ระบุตำแหน่ง'}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {member.role || 'สมาชิก'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>ยังไม่มีสมาชิกในโปรเจคนี้</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
          
          {/* รายละเอียดโปรเจค */}
          {project.description && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-800 flex items-center">
                <FiMessageSquare className="mr-2 text-gray-600 dark:text-gray-400" />
                รายละเอียด
              </h2>
              <p className="text-sm whitespace-pre-line">{project.description}</p>
            </div>
          )}
        </div>
        
        {/* ส่วนท้าย - ปุ่มปิด */}
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <Button 
            onClick={() => onOpenChange(false)}
            variant="outline" 
            size="sm"
          >
            ปิด
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 