'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiUser, FiX, FiUpload } from 'react-icons/fi';
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
            <FiPlus className="text-blue-600 dark:text-blue-400" /> 
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
                        <SelectItem value="" disabled>ไม่มีบทบาทให้เลือก</SelectItem>
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
                  <Input 
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    value={formData.birthDate || ''}
                    onChange={handleFormChange}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-3 md:col-span-1">
              {/* ส่วนของการอัปโหลดรูปโปรไฟล์ */}
              <div className="space-y-1 h-[233px]">
                <Label>รูปโปรไฟล์</Label>
                <div className="flex flex-col items-center border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-900 h-[200px]">
                  <div className="flex flex-col items-center">
                    {imagePreview ? (
                      <div className="relative mb-2">
                        <div className="w-20 h-20 overflow-hidden rounded-full border-2 border-primary/20 flex items-center justify-center">
                          <ProfileImage
                            src={imagePreview}
                            alt="รูปโปรไฟล์"
                            size="lg"
                            fallbackText={`${formData.firstName} ${formData.lastName}`}
                            clickable={false}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm"
                          title="ลบรูปภาพ"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2 border-2 border-primary/20">
                        <FiUser className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                    
                    <label className="flex items-center justify-center px-2 py-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-md cursor-pointer transition-colors">
                      <FiUpload className="mr-1 h-3 w-3" />
                      <span>อัปโหลดรูปภาพ</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      รองรับไฟล์ JPG, PNG, GIF, WEBP (≤10MB)
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 h-[70px]">
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
                        <SelectItem value="" disabled>ไม่มีตำแหน่งให้เลือก</SelectItem>
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
                        <SelectItem value="" disabled>ไม่มีระดับตำแหน่งให้เลือก</SelectItem>
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
              
              <div className="space-y-1 h-[70px] flex items-end">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive === undefined ? true : formData.isActive}
                    onCheckedChange={(checked) => handleFormChange({
                      target: { name: 'isActive', value: checked, type: 'checkbox' }
                    })}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    สถานะการใช้งาน {formData.isActive === undefined || formData.isActive === true ? '(ใช้งาน)' : '(ไม่ใช้งาน)'}
                  </Label>
                </div>
              </div>
            </div>
          </div>
          
          {formError && (
            <p className="text-sm text-red-500 mt-2">{formError}</p>
          )}
          
          <div className="flex justify-end mt-4 border-t pt-4">
            <Button 
              key="cancel-button" 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="mr-2 h-9"
            >
              ยกเลิก
            </Button>
            <Button 
              key="save-button" 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white h-9" 
              disabled={formLoading}
            >
              {formLoading ? (
                <>
                  <LoadingSpinner className="mr-2" size="sm" /> กำลังบันทึก...
                </>
              ) : 'เพิ่มพนักงาน'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 