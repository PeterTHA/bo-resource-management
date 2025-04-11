'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiUser, FiX, FiUpload, FiCalendar } from 'react-icons/fi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ProfileImage from '@/components/ui/ProfileImage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

export default function AddEmployeeDialog({
  open, 
  onOpenChange,
  formData,
  formError,
  formLoading,
  positions,
  positionLevels,
  departments,
  teams,
  roles,
  handleFormChange,
  handleAddEmployee,
  imagePreview,
  handleImageChange,
  handleRemoveImage,
}) {
  const [debugValues, setDebugValues] = useState(false);

  useEffect(() => {
    console.log('Form Data in AddEmployeeDialog:', formData);
    console.log('Positions in AddEmployeeDialog:', positions);
    console.log('Position Levels in AddEmployeeDialog:', positionLevels);
    console.log('Roles in AddEmployeeDialog:', roles);
    
    // ตรวจสอบการแสดงผลของ dropdown
    console.log('Position dropdown shows:', positions.find(p => String(p.id) === String(formData.positionId))?.name_th || 
                positions.find(p => String(p.id) === String(formData.positionId))?.name || '');
                
    console.log('Position Level dropdown shows:', positionLevels.find(l => String(l.id) === String(formData.positionLevelId))?.name_th || 
                positionLevels.find(l => String(l.id) === String(formData.positionLevelId))?.name || '');
                
    console.log('Role dropdown shows:', roles.find(r => r.id === formData.roleId)?.name_th || 
                roles.find(r => r.id === formData.roleId)?.name || '');
                
    // ตรวจสอบข้อมูลแบบละเอียด
    console.log('All positions codes:', positions.map(p => p.code).join(', '));
    console.log('All position levels codes:', positionLevels.map(p => p.code).join(', '));
    console.log('All roles codes:', roles.map(r => r.code).join(', '));
  }, [formData, departments, teams, positions, positionLevels, roles]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FiPlus className="text-gray-600 dark:text-gray-400" /> 
            เพิ่มพนักงานใหม่
          </DialogTitle>
          <DialogDescription>
            กรอกข้อมูลพนักงานใหม่ที่ต้องการเพิ่มเข้าระบบ
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleAddEmployee}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-3 md:col-span-1">
              <div className="space-y-1 h-[70px]">
                <Label htmlFor="employeeId">รหัสพนักงาน<span className="text-red-500">*</span></Label>
                <Input 
                  id="employeeId"
                  name="employeeId"
                  type="text"
                  placeholder="รหัสพนักงาน"
                  value={formData.employeeId}
                  onChange={handleFormChange}
                  required
                  className="h-9"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3 h-[70px]">
                <div className="space-y-1">
                  <Label htmlFor="firstName">ชื่อ<span className="text-red-500">*</span></Label>
                  <Input 
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="ชื่อ"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    required
                    className="h-9"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="lastName">นามสกุล<span className="text-red-500">*</span></Label>
                  <Input 
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="นามสกุล"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    required
                    className="h-9"
                  />
                </div>
              </div>
              
              <div className="space-y-1 h-[70px]">
                <Label htmlFor="email">อีเมล<span className="text-red-500">*</span></Label>
                <Input 
                  id="email"
                  name="email"
                  type="email"
                  placeholder="อีเมล"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                  className="h-9"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3 h-[70px]">
                <div className="space-y-1">
                  <Label htmlFor="departmentId">แผนก</Label>
                  <Select
                    value={formData.departmentId ? String(formData.departmentId) : ''}
                    onValueChange={(value) => handleFormChange({
                      target: { 
                        name: 'departmentId', 
                        value, 
                        type: 'select',
                        additionalData: {
                          department: departments.find(d => String(d.id) === String(value))?.code || ''
                        }
                      }
                    })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="เลือกแผนก">
                        {departments.find(d => String(d.id) === String(formData.departmentId))?.name || ''}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={String(dept.id)}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="teamId">ทีม</Label>
                  <Select
                    value={formData.teamId ? String(formData.teamId) : ''}
                    onValueChange={(value) => handleFormChange({
                      target: { 
                        name: 'teamId', 
                        value, 
                        type: 'select',
                        additionalData: {
                          team: teams.find(t => String(t.id) === String(value))?.code || ''
                        }
                      }
                    })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="เลือกทีม">
                        {teams.find(t => String(t.id) === String(formData.teamId))?.name || ''}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={String(team.id)}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 h-[70px]">
                <div className="space-y-1">
                  <Label htmlFor="gender">เพศ</Label>
                  <Select
                    value={formData.gender || ''}
                    onValueChange={(value) => handleFormChange({
                      target: { name: 'gender', value, type: 'select' }
                    })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="เลือกเพศ">
                        {formData.gender === 'male' ? 'ชาย' : 
                        formData.gender === 'female' ? 'หญิง' : 
                        formData.gender === 'other' ? 'อื่นๆ' : ''}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ชาย</SelectItem>
                      <SelectItem value="female">หญิง</SelectItem>
                      <SelectItem value="other">อื่นๆ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="roleId">บทบาท</Label>
                  <Select
                    value={formData.roleId || ''}
                    onValueChange={(value) => {
                      const selectedRole = roles.find(r => r.id === value);
                      console.log('Selected role:', selectedRole);
                      handleFormChange({
                        target: { 
                          name: 'roleId', 
                          value, 
                          type: 'select',
                          additionalData: {
                            role: selectedRole ? selectedRole.code : formData.role,
                            roleName: selectedRole ? selectedRole.name : formData.roleName
                          }
                        }
                      });
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="เลือกบทบาท">
                        {roles.find(r => r.id === formData.roleId)?.name_th || 
                         roles.find(r => r.id === formData.roleId)?.name || ''}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(roles) && roles.length > 0 ? (
                        roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name_th || role.name || role.code}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>ไม่มีบทบาทให้เลือก</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 h-[70px]">
                <div className="space-y-1">
                  <Label htmlFor="phoneNumber">เบอร์โทรศัพท์</Label>
                  <Input 
                    id="phoneNumber"
                    name="phoneNumber"
                    type="text"
                    placeholder="เบอร์โทรศัพท์"
                    value={formData.phoneNumber}
                    onChange={handleFormChange}
                    className="h-9"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="birthDate">วันเกิด</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="relative">
                        <Input
                          id="birthDate"
                          name="birthDateDisplay"
                          value={formData.birthDate ? new Date(formData.birthDate).toLocaleDateString('th-TH') : ''}
                          className="pl-10 h-9"
                          placeholder="เลือกวันเกิด"
                          readOnly
                        />
                        <FiCalendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[999]" align="start" style={{ zIndex: 999 }}>
                      <Calendar
                        mode="single"
                        selected={formData.birthDate ? new Date(formData.birthDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const formattedDate = `${year}-${month}-${day}`;
                            
                            handleFormChange({
                              target: {
                                name: 'birthDate',
                                value: formattedDate
                              }
                            });
                          }
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 md:col-span-1">
              {/* ส่วนของการอัปโหลดรูปโปรไฟล์ */}
              <div className="flex justify-center h-[209px] mb-8">
                <div className="w-48 h-48 relative group mt-0">
                  <div className="rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center h-full">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="object-cover w-full h-full" 
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4">
                        <FiUser size={40} className="text-gray-600 dark:text-gray-400 mb-2" />
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">ยังไม่มีรูปโปรไฟล์</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute bottom-0 right-0 flex space-x-1">
                    <label className="cursor-pointer bg-gray-800 hover:bg-black text-white p-2 rounded-full shadow-md">
                      <FiUpload size={16} />
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleImageChange}
                        accept="image/*"
                      />
                    </label>
                    
                    {imagePreview && (
                      <button 
                        type="button"
                        className="bg-gray-800 hover:bg-black text-white p-2 rounded-full shadow-md"
                        onClick={handleRemoveImage}
                      >
                        <FiX size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 h-[70px] mt-6">
                <div className="space-y-1">
                  <Label htmlFor="positionId">ตำแหน่ง</Label>
                  <Select
                    value={formData.positionId ? String(formData.positionId) : ''}
                    onValueChange={(value) => {
                      const selectedPosition = positions.find(p => String(p.id) === String(value));
                      console.log('Selected position:', selectedPosition);
                      handleFormChange({
                        target: { 
                          name: 'positionId', 
                          value, 
                          type: 'select',
                          additionalData: {
                            position: selectedPosition ? selectedPosition.code : formData.position
                          }
                        }
                      });
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="เลือกตำแหน่ง">
                        {positions.find(p => String(p.id) === String(formData.positionId))?.name_th || 
                         positions.find(p => String(p.id) === String(formData.positionId))?.name || ''}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(positions) && positions.length > 0 ? (
                        positions.map((position) => (
                          <SelectItem key={position.id} value={String(position.id)}>
                            {position.name_th || position.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>ไม่มีตำแหน่งให้เลือก</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="positionLevelId">ระดับตำแหน่ง</Label>
                  <Select
                    value={formData.positionLevelId ? String(formData.positionLevelId) : ''}
                    onValueChange={(value) => {
                      const selectedLevel = positionLevels.find(l => String(l.id) === String(value));
                      console.log('Selected position level:', selectedLevel);
                      handleFormChange({
                        target: { 
                          name: 'positionLevelId', 
                          value, 
                          type: 'select',
                          additionalData: {
                            positionLevel: selectedLevel ? selectedLevel.code : formData.positionLevel
                          }
                        }
                      });
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="เลือกระดับตำแหน่ง">
                        {positionLevels.find(l => String(l.id) === String(formData.positionLevelId))?.name_th || 
                         positionLevels.find(l => String(l.id) === String(formData.positionLevelId))?.name || ''}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(positionLevels) && positionLevels.length > 0 ? (
                        positionLevels.map((level) => (
                          <SelectItem key={level.id} value={String(level.id)}>
                            {level.name_th || level.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>ไม่มีระดับตำแหน่งให้เลือก</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-1 h-[70px]">
                <Label htmlFor="positionTitle">ชื่อตำแหน่ง</Label>
                <Input 
                  id="positionTitle"
                  name="positionTitle"
                  type="text"
                  placeholder="ชื่อตำแหน่ง"
                  value={formData.positionTitle || ''}
                  onChange={handleFormChange}
                  className="h-9"
                />
              </div>
              
              <div className="space-y-2 h-[70px] justify-start mt-2">
                <Label htmlFor="isActive">สถานะการใช้งาน</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => {
                      console.log("Switch changed to:", checked);
                      handleFormChange({
                        target: { name: 'isActive', value: checked, type: 'checkbox' }
                      });
                    }}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer text-sm text-gray-500 pl-1">
                    {formData.isActive === true ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                  </Label>
                </div>
              </div>
            </div>
          </div>
          
          {formError && formError.general && (
            <div className="text-red-500 text-sm mb-4">{formError.general}</div>
          )}
          
          <div className="flex justify-end gap-3 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              type="submit" 
              className="bg-gray-800 hover:bg-black text-white"
              disabled={formLoading}
            >
              {formLoading ? (
                <>
                  <LoadingSpinner className="mr-2" size="sm" /> กำลังบันทึก...
                </>
              ) : 'บันทึกข้อมูล'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 