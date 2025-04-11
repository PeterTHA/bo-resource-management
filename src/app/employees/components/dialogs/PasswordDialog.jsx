'use client';

import { FiKey, FiLock, FiUnlock } from 'react-icons/fi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function PasswordDialog({
  open,
  onOpenChange,
  employee,
  passwordFormData,
  formLoading,
  formError,
  handlePasswordFormChange,
  handleUpdatePassword,
}) {
  if (!employee) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FiKey className="text-gray-600 dark:text-gray-400" />
            เปลี่ยนรหัสผ่าน
          </DialogTitle>
          <DialogDescription>
            กำหนดรหัสผ่านใหม่สำหรับ {employee?.firstName} {employee?.lastName}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleUpdatePassword}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="flex items-center gap-1">
                <FiUnlock className="text-gray-600 dark:text-gray-400" size={14} />
                รหัสผ่านปัจจุบัน<span className="text-red-500">*</span>
              </Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                placeholder="รหัสผ่านปัจจุบัน"
                value={passwordFormData.currentPassword}
                onChange={handlePasswordFormChange}
                required
                className="h-9"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-1">
                <FiLock className="text-gray-600 dark:text-gray-400" size={14} />
                รหัสผ่านใหม่<span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="รหัสผ่านใหม่"
                value={passwordFormData.password}
                onChange={handlePasswordFormChange}
                required
                className="h-9"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-1">
                <FiLock className="text-gray-600 dark:text-gray-400" size={14} />
                ยืนยันรหัสผ่านใหม่<span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="ยืนยันรหัสผ่านใหม่"
                value={passwordFormData.confirmPassword}
                onChange={handlePasswordFormChange}
                required
                className="h-9"
              />
            </div>
            
            <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/30 p-3 rounded border border-gray-200 dark:border-gray-700">
              <p>ข้อมูลรหัสผ่านของคุณจะถูกเข้ารหัสก่อนส่งไปยังเซิร์ฟเวอร์เพื่อความปลอดภัยสูงสุด</p>
            </div>
            
            {formError && (
              <p className="text-sm text-red-500">{formError}</p>
            )}
          </div>
          
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
              ) : 'เปลี่ยนรหัสผ่าน'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 