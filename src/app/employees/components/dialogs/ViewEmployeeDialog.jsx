'use client';

import { FiEye, FiMail, FiPhone, FiCalendar, FiUser, FiUsers, FiKey, FiMapPin, FiBriefcase, FiClock, FiMaximize2 } from 'react-icons/fi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProfileImage from '@/components/ui/ProfileImage';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useState } from 'react';

export default function ViewEmployeeDialog({
  open,
  onOpenChange,
  employee,
  isAdmin,
  isTeamLead,
  isCurrentUser,
  departments,
  teams,
  onEdit,
  onPasswordChange,
}) {
  if (!employee) return null;
  
  const [showFullImage, setShowFullImage] = useState(false);

  // วันที่ที่จะแสดงผล
  const formattedBirthDate = employee.birthDate 
    ? format(new Date(employee.birthDate), 'dd MMMM yyyy', { locale: th })
    : '-';

  // หาชื่อทีมและแผนก
  const departmentName = departments.find(d => d.id === employee.departmentId)?.name || '-';
  const teamName = teams.find(t => t.id === employee.teamId)?.name || '-';
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white dark:bg-gray-900 rounded-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>ข้อมูลพนักงาน</DialogTitle>
          </DialogHeader>
          
          {/* ส่วนหัว - ชื่อพนักงานและรูปโปรไฟล์ */}
          <div className="relative overflow-hidden bg-black text-white">
            <div className="absolute inset-0 bg-opacity-20 bg-black"></div>
            <div className="relative px-6 py-8 flex flex-col md:flex-row items-center md:items-end gap-6">
              <div 
                className="h-32 w-32 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden cursor-pointer relative group"
                onClick={() => setShowFullImage(true)}
              >
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <FiMaximize2 className="text-white" size={24} />
                </div>
                <ProfileImage
                  src={employee.image}
                  alt={`${employee.firstName} ${employee.lastName}`}
                  fallbackText={`${employee.firstName} ${employee.lastName}`}
                  clickable={false}
                  size="xl"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold">{employee.firstName} {employee.lastName}</h1>
                <p className="text-gray-200">{employee.positionTitle || '-'}</p>
                <div className="flex mt-2 justify-center md:justify-start gap-2">
                  <Badge 
                    variant={employee.isActive ? "success" : "destructive"}
                    className="bg-white/20 dark:bg-white/10 text-white border-none"
                  >
                    {employee.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                  </Badge>
                  <Badge className="bg-white/20 dark:bg-white/10 text-white border-none">
                    รหัส: {employee.employeeId}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          {/* ส่วนเนื้อหา - รายละเอียดพนักงาน */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* ข้อมูลส่วนตัว */}
              <div>
                <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center">
                  <FiUser className="mr-2 text-gray-600 dark:text-gray-400" />
                  ข้อมูลส่วนตัว
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 dark:bg-gray-800/30 p-2 rounded-full">
                      <FiMail className="text-gray-600 dark:text-gray-400" size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">อีเมล</p>
                      <p className="text-sm font-medium truncate">{employee.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 dark:bg-gray-800/30 p-2 rounded-full">
                      <FiPhone className="text-gray-600 dark:text-gray-400" size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">เบอร์โทรศัพท์</p>
                      <p className="text-sm font-medium">{employee.phoneNumber || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 dark:bg-gray-800/30 p-2 rounded-full">
                      <FiCalendar className="text-gray-600 dark:text-gray-400" size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">วันเกิด</p>
                      <p className="text-sm font-medium">{formattedBirthDate}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 dark:bg-gray-800/30 p-2 rounded-full">
                      <FiUser className="text-gray-600 dark:text-gray-400" size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">เพศ</p>
                      <p className="text-sm font-medium">
                        {employee.gender === 'male' ? 'ชาย' : 
                        employee.gender === 'female' ? 'หญิง' : 
                        employee.gender === 'other' ? 'อื่นๆ' : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* ข้อมูลการทำงาน */}
              <div>
                <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center">
                  <FiBriefcase className="mr-2 text-gray-600 dark:text-gray-400" />
                  ข้อมูลการทำงาน
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 dark:bg-gray-800/30 p-2 rounded-full">
                      <FiKey className="text-gray-600 dark:text-gray-400" size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">บทบาท</p>
                      <p className="text-sm font-medium">{employee.roleNameTh || employee.roleName || employee.role || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 dark:bg-gray-800/30 p-2 rounded-full">
                      <FiBriefcase className="text-gray-600 dark:text-gray-400" size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">ตำแหน่ง</p>
                      <p className="text-sm font-medium">{employee.positionTitle || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 dark:bg-gray-800/30 p-2 rounded-full">
                      <FiMapPin className="text-gray-600 dark:text-gray-400" size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">แผนก</p>
                      <p className="text-sm font-medium">{departmentName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 dark:bg-gray-800/30 p-2 rounded-full">
                      <FiUsers className="text-gray-600 dark:text-gray-400" size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">ทีม</p>
                      <p className="text-sm font-medium">{teamName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* ส่วนท้าย - ปุ่มปิด */}
          <div className="bg-black px-6 py-4 border-t border-gray-700 flex justify-end">
            <Button 
              onClick={() => onOpenChange(false)}
              className="bg-gray-800 hover:bg-gray-700 text-white" 
              size="sm"
            >
              ปิด
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog สำหรับแสดงรูปขยาย */}
      {showFullImage && (
        <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-0 rounded-lg">
            <DialogHeader className="sr-only">
              <DialogTitle>รูปโปรไฟล์</DialogTitle>
            </DialogHeader>
            
            <div className="relative w-full h-[80vh] flex items-center justify-center">
              <div className="absolute inset-0 bg-black"></div>
              <div className="relative w-full h-full flex items-center justify-center p-6">
                {employee.image ? (
                  <img
                    src={employee.image}
                    alt={`${employee.firstName} ${employee.lastName}`}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="w-64 h-64 bg-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-6xl font-semibold text-white">
                      {`${employee.firstName?.charAt(0) || ''}${employee.lastName?.charAt(0) || ''}`}
                    </span>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={() => setShowFullImage(false)}
                className="absolute top-4 right-4 bg-black/70 hover:bg-black text-white rounded-full p-2 z-10"
                size="icon"
              >
                ✕
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 