'use client';

import { FiKey } from 'react-icons/fi';
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
          <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
          <DialogDescription>
            กำหนดรหัสผ่านใหม่สำหรับ {employee?.firstName} {employee?.lastName}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleUpdatePassword}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่านใหม่<span className="text-red-500">*</span></Label>
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
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่<span className="text-red-500">*</span></Label>
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
            
            {formError && (
              <p className="text-sm text-red-500">{formError}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white h-9"
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