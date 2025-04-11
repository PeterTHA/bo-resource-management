'use client';

import { FiEye, FiMail, FiPhone, FiCalendar, FiUser, FiUsers, FiKey, FiMapPin, FiEdit, FiLock } from 'react-icons/fi';
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

  // วันที่ที่จะแสดงผล
  const formattedBirthDate = employee.birthDate 
    ? format(new Date(employee.birthDate), 'dd MMMM yyyy', { locale: th })
    : '-';

  // หาชื่อทีมและแผนก
  const departmentName = departments.find(d => d.id === employee.departmentId)?.name || '-';
  const teamName = teams.find(t => t.id === employee.teamId)?.name || '-';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FiEye className="text-blue-600 dark:text-blue-400" /> 
            ข้อมูลพนักงาน
          </DialogTitle>
          <DialogDescription>
            ข้อมูลรายละเอียดของพนักงาน
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          {/* คอลัมน์ซ้าย - รูปโปรไฟล์และข้อมูลหลัก */}
          <div className="md:col-span-1 flex flex-col items-center">
            <div className="w-32 h-32 mb-4">
              <ProfileImage
                src={employee.image}
                alt={`${employee.firstName} ${employee.lastName}`}
                fallbackText={`${employee.firstName} ${employee.lastName}`}
                clickable={false}
                size="xl"
              />
            </div>
            
            <h2 className="text-lg font-semibold text-center">{employee.firstName} {employee.lastName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{employee.positionTitle || '-'}</p>
            
            <Badge 
              variant={employee.isActive ? "success" : "destructive"}
              className="mb-4"
            >
              {employee.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
            </Badge>
            
            <div className="w-full space-y-2">
              <div className="flex items-center text-sm">
                <FiMail className="mr-2 text-gray-500" />
                <span className="truncate">{employee.email}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <FiPhone className="mr-2 text-gray-500" />
                <span>{employee.phoneNumber || '-'}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <FiCalendar className="mr-2 text-gray-500" />
                <span>{formattedBirthDate}</span>
              </div>
            </div>
          </div>
          
          {/* คอลัมน์กลาง - ข้อมูลการทำงาน */}
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">รหัสพนักงาน</p>
                <p className="text-sm font-medium">{employee.employeeId}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">บทบาท</p>
                <div className="flex items-center">
                  <FiKey className="mr-1 text-gray-500" size={14} />
                  <p className="text-sm font-medium">
                    {employee.roleNameTh || employee.roleName || employee.role || '-'}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">ตำแหน่ง</p>
                <div className="flex items-center">
                  <FiUser className="mr-1 text-gray-500" size={14} />
                  <p className="text-sm font-medium truncate">
                    {employee.positionTitle || '-'}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">เพศ</p>
                <p className="text-sm font-medium">
                  {employee.gender === 'male' ? 'ชาย' : 
                   employee.gender === 'female' ? 'หญิง' : 
                   employee.gender === 'other' ? 'อื่นๆ' : '-'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">แผนก</p>
                <div className="flex items-center">
                  <FiMapPin className="mr-1 text-gray-500" size={14} />
                  <p className="text-sm font-medium truncate">{departmentName}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">ทีม</p>
                <div className="flex items-center">
                  <FiUsers className="mr-1 text-gray-500" size={14} />
                  <p className="text-sm font-medium truncate">{teamName}</p>
                </div>
              </div>
            </div>
            
            {/* ปุ่มต่างๆ */}
            <div className="flex flex-wrap gap-2 mt-6 justify-end">
              {(isAdmin || isTeamLead || isCurrentUser) && (
                <>
                  <Button 
                    onClick={() => onEdit(employee)}
                    variant="outline" 
                    size="sm" 
                    className="flex items-center"
                  >
                    <FiEdit className="mr-1" size={14} />
                    แก้ไขข้อมูล
                  </Button>
                  
                  {(isAdmin || isTeamLead) && (
                    <Button 
                      onClick={() => onPasswordChange(employee)}
                      variant="outline" 
                      size="sm" 
                      className="flex items-center"
                    >
                      <FiLock className="mr-1" size={14} />
                      เปลี่ยนรหัสผ่าน
                    </Button>
                  )}
                </>
              )}
              
              <Button 
                onClick={() => onOpenChange(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white" 
                size="sm"
              >
                ปิด
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 