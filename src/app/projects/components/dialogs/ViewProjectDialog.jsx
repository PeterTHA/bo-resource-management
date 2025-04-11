'use client';

import { FiEye, FiCalendar, FiUsers, FiClock, FiFlag, FiInfo, FiCode, FiMessageSquare, FiActivity, FiPaperclip, FiExternalLink, FiDownload, FiImage, FiArchive, FiFileText } from 'react-icons/fi';
import { BsFiletypePdf, BsFiletypeDocx, BsFiletypeXlsx, BsFiletypePpt, BsFiletypeCsv } from 'react-icons/bs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
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
  
  // ฟังก์ชันแสดงไอคอนและสีตามประเภทไฟล์
  const getFileTypeDisplay = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    // กำหนดสีและป้ายกำกับตามประเภทไฟล์
    const fileTypes = {
      // เอกสาร
      'pdf': { label: 'PDF', color: 'bg-red-100 text-red-700', icon: <BsFiletypePdf className="h-5 w-5 text-red-600" /> },
      'xlsx': { label: 'XLSX', color: 'bg-green-100 text-green-700', icon: <BsFiletypeXlsx className="h-5 w-5 text-green-600" /> },
      'xls': { label: 'XLS', color: 'bg-green-100 text-green-700', icon: <BsFiletypeXlsx className="h-5 w-5 text-green-600" /> },
      'docx': { label: 'DOCX', color: 'bg-blue-100 text-blue-700', icon: <BsFiletypeDocx className="h-5 w-5 text-blue-600" /> },
      'doc': { label: 'DOC', color: 'bg-blue-100 text-blue-700', icon: <BsFiletypeDocx className="h-5 w-5 text-blue-600" /> },
      'pptx': { label: 'PPTX', color: 'bg-orange-100 text-orange-700', icon: <BsFiletypePpt className="h-5 w-5 text-orange-600" /> },
      'ppt': { label: 'PPT', color: 'bg-orange-100 text-orange-700', icon: <BsFiletypePpt className="h-5 w-5 text-orange-600" /> },
      'csv': { label: 'CSV', color: 'bg-blue-100 text-blue-700', icon: <BsFiletypeCsv className="h-5 w-5 text-blue-600" /> },
      
      // รูปภาพ
      'jpeg': { label: 'JPEG', color: 'bg-purple-100 text-purple-700', icon: <FiImage className="h-5 w-5 text-purple-600" /> },
      'jpg': { label: 'JPG', color: 'bg-purple-100 text-purple-700', icon: <FiImage className="h-5 w-5 text-purple-600" /> },
      'png': { label: 'PNG', color: 'bg-purple-100 text-purple-700', icon: <FiImage className="h-5 w-5 text-purple-600" /> },
      'gif': { label: 'GIF', color: 'bg-purple-100 text-purple-700', icon: <FiImage className="h-5 w-5 text-purple-600" /> },
      'svg': { label: 'SVG', color: 'bg-purple-100 text-purple-700', icon: <FiImage className="h-5 w-5 text-purple-600" /> },
      
      // ซิป
      'zip': { label: 'ZIP', color: 'bg-yellow-100 text-yellow-700', icon: <FiArchive className="h-5 w-5 text-yellow-600" /> },
      'rar': { label: 'RAR', color: 'bg-yellow-100 text-yellow-700', icon: <FiArchive className="h-5 w-5 text-yellow-600" /> },
      
      // ค่าเริ่มต้น
      'default': { label: extension.toUpperCase().substring(0, 4), color: 'bg-gray-100 text-gray-700', icon: <FiFileText className="h-5 w-5 text-gray-600" /> }
    };
    
    return fileTypes[extension] || fileTypes['default'];
  };
  
  // ฟังก์ชันแสดงชื่อไฟล์แบบย่อตรงกลาง
  const formatFileName = (fileName) => {
    if (fileName.length <= 25) return fileName;
    
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) return fileName.substring(0, 22) + '...';
    
    const extension = fileName.substring(lastDotIndex);
    const baseName = fileName.substring(0, lastDotIndex);
    
    if (baseName.length <= 18) return fileName;
    
    return baseName.substring(0, 15) + '...' + extension;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white dark:bg-gray-900 rounded-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>ข้อมูลโปรเจค</DialogTitle>
          <DialogDescription className="sr-only">แสดงรายละเอียดโปรเจค {project.name}</DialogDescription>
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
          
          {/* ลิงก์ภายนอก - แสดงเป็นไอคอนแทน popover */}
          {(project.jiraUrl || project.confluenceUrl) && (
            <div className="absolute top-4 right-4 flex gap-2">
              {project.jiraUrl && (
                <a
                  href={project.jiraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  title="Jira"
                >
                  <FiExternalLink className="h-4 w-4" />
                  <span className="sr-only">Jira</span>
                </a>
              )}
              {project.confluenceUrl && (
                <a
                  href={project.confluenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  title="Confluence"
                >
                  <FiExternalLink className="h-4 w-4" />
                  <span className="sr-only">Confluence</span>
                </a>
              )}
            </div>
          )}
        </div>
        
        {/* ส่วนเนื้อหา - รายละเอียดโปรเจค */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ข้อมูลโปรเจค */}
            <div>
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center">
                <FiInfo className="mr-2 text-gray-600 dark:text-gray-400" />
                ข้อมูลโปรเจค
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-800/30 p-2 rounded-full">
                    <FiCode className="text-gray-600 dark:text-gray-400" size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">รหัสโปรเจค</p>
                    <p className="text-sm font-medium">{project.code}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-800/30 p-2 rounded-full">
                    <FiCalendar className="text-gray-600 dark:text-gray-400" size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">วันที่เริ่ม</p>
                    <p className="text-sm font-medium">{formattedStartDate}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-800/30 p-2 rounded-full">
                    <FiCalendar className="text-gray-600 dark:text-gray-400" size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">วันที่สิ้นสุด</p>
                    <p className="text-sm font-medium">{formattedEndDate}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-800/30 p-2 rounded-full">
                    <FiActivity className="text-gray-600 dark:text-gray-400" size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">สถานะ</p>
                    <p className="text-sm font-medium">{getStatusLabel(project.status)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-800/30 p-2 rounded-full">
                    <FiFlag className="text-gray-600 dark:text-gray-400" size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ความสำคัญ</p>
                    <p className="text-sm font-medium">{getPriorityLabel(project.priority)}</p>
                  </div>
                </div>
                
                {/* เอกสารแนบ - ปุ่มเปิด Sheet */}
                {project.attachments && project.attachments.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 dark:bg-gray-800/30 p-2 rounded-full">
                      <FiPaperclip className="text-gray-600 dark:text-gray-400" size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">เอกสารแนบ</p>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="link" size="sm" className="h-auto p-0 text-sm font-medium text-primary">
                            {project.attachments.length} ไฟล์
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-full sm:max-w-md">
                          <SheetHeader className="mb-5">
                            <SheetTitle>เอกสารแนบ ({project.attachments.length})</SheetTitle>
                            <SheetDescription>
                              รายการเอกสารที่แนบมาในโปรเจคนี้
                            </SheetDescription>
                          </SheetHeader>
                          <div className="pb-4">
                            <ScrollArea className="h-[calc(100vh-180px)]">
                              <div className="space-y-3 pr-3">
                                {project.attachments.map((fileName, index) => {
                                  const fileTypeInfo = getFileTypeDisplay(fileName);
                                  return (
                                    <div key={index} className="flex items-center gap-3 p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                      <div className={`flex items-center justify-center w-10 h-10 rounded-md ${fileTypeInfo.color}`}>
                                        {fileTypeInfo.icon}
                                      </div>
                                      <div className="overflow-hidden flex-1">
                                        <p className="text-sm font-medium truncate">{formatFileName(fileName)}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                                          >
                                            <FiDownload className="h-3.5 w-3.5" />
                                            <span className="sr-only">ดาวน์โหลด</span>
                                          </Button>
                                          <Badge variant="outline" className="px-1.5 py-0 h-5 text-xs font-normal">
                                            {fileTypeInfo.label}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </ScrollArea>
                          </div>
                          <SheetFooter>
                            <SheetClose asChild>
                              <Button type="button" variant="outline">ปิด</Button>
                            </SheetClose>
                          </SheetFooter>
                        </SheetContent>
                      </Sheet>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* สมาชิกในโปรเจค */}
            <div>
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center">
                <FiUsers className="mr-2 text-gray-600 dark:text-gray-400" />
                สมาชิกในโปรเจค
              </h2>
              <ScrollArea className="h-[300px] pr-4">
                {project.members && project.members.length > 0 ? (
                  <div className="space-y-3">
                    {project.members.map((member) => (
                      <div key={member.employeeId} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
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
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center">
                <FiMessageSquare className="mr-2 text-gray-600 dark:text-gray-400" />
                รายละเอียด
              </h2>
              <p className="text-sm whitespace-pre-line">{project.description}</p>
            </div>
          )}
        </div>
        
        {/* ส่วนท้าย - ปุ่มปิด */}
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button 
            onClick={() => onOpenChange(false)}
            variant="outline" 
            className="bg-white hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
            size="sm"
          >
            ปิด
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 