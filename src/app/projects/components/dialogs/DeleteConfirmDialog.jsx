'use client';

import { FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  project,
  isDeleting,
  onConfirmDelete,
  error,
}) {
  if (!project) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FiTrash2 className="text-red-500" /> 
            ลบโปรเจค
          </DialogTitle>
          <DialogDescription>
            คุณแน่ใจหรือว่าต้องการลบโปรเจคนี้ การดำเนินการนี้ไม่สามารถยกเลิกได้
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md mb-4 flex items-start">
            <FiAlertTriangle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">คำเตือน</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                การลบโปรเจคจะเป็นการลบข้อมูลของ <span className="font-medium">{project.name}</span> ออกจากระบบทั้งหมด รวมถึงข้อมูลสมาชิกและข้อมูลที่เกี่ยวข้องอื่นๆ
              </p>
            </div>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
            <p className="text-sm font-medium mb-1">ข้อมูลโปรเจค</p>
            <p className="text-sm mb-0.5">
              <span className="text-gray-600 dark:text-gray-400">รหัสโปรเจค:</span> {project.code}
            </p>
            <p className="text-sm mb-0.5">
              <span className="text-gray-600 dark:text-gray-400">ชื่อโปรเจค:</span> {project.name}
            </p>
            <p className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">สถานะ:</span> {project.status || '-'}
            </p>
          </div>
          
          {error && (
            <p className="text-sm text-red-500 mt-3">{error}</p>
          )}
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="mr-2"
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onConfirmDelete(project.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 mr-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                กำลังลบ...
              </>
            ) : 'ยืนยันการลบ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 