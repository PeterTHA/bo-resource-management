'use client';

import { useState, useEffect } from 'react';
import { FiFolder, FiEdit, FiTrash2, FiEye, FiUsers, FiPlus, FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown, FiPaperclip, FiExternalLink, FiDownload, FiFileText, FiImage, FiArchive } from 'react-icons/fi';
import { BsFiletypePdf, BsFiletypeDocx, BsFiletypeXlsx, BsFiletypePpt, BsFiletypeCsv } from 'react-icons/bs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function ProjectList({
  projects,
  isLoading,
  error,
  isAdmin,
  searchTerm,
  setSearchTerm,
  onView,
  onEdit,
  onDelete,
  onAddMember,
  onAdd,
  sortConfig,
  setSortConfig,
}) {
  // state สำหรับ pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ฟังก์ชันสำหรับการเรียงลำดับข้อมูล
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // รีเซ็ตหน้าเมื่อมีการเรียงลำดับใหม่
  };

  // ฟังก์ชันจัดการการเรียงลำดับ
  const sortedItems = (items) => {
    if (!sortConfig.key) return items;
    
    return [...items].sort((a, b) => {
      if (sortConfig.key === 'startDate' || sortConfig.key === 'endDate') {
        const aDate = a[sortConfig.key] ? new Date(a[sortConfig.key]) : new Date(0);
        const bDate = b[sortConfig.key] ? new Date(b[sortConfig.key]) : new Date(0);
        
        if (sortConfig.direction === 'asc') {
          return aDate - bDate;
        } else {
          return bDate - aDate;
        }
      }
      
      // กรณีอื่นๆ
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      if (sortConfig.direction === 'asc') {
        return typeof aValue === 'string' ? aValue.localeCompare(bValue) : aValue - bValue;
      } else {
        return typeof bValue === 'string' ? bValue.localeCompare(aValue) : bValue - aValue;
      }
    });
  };

  // ฟังก์ชันกรองโปรเจคตามคำค้นหา
  const filteredProjects = searchTerm 
    ? projects.filter(project => 
        project.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        project.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : projects;

  // เรียงลำดับข้อมูล
  const sortedProjects = sortedItems(filteredProjects);
  
  // คำนวณจำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
  
  // คำนวณรายการที่แสดงในหน้าปัจจุบัน
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedProjects.slice(indexOfFirstItem, indexOfLastItem);

  // ฟังก์ชันเปลี่ยนหน้า
  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // ฟังก์ชันแสดงไอคอนการเรียงลำดับ
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'asc' ? 
      <FiChevronUp className="h-3 w-3 inline-block ml-1" /> : 
      <FiChevronDown className="h-3 w-3 inline-block ml-1" />;
  };

  // ฟังก์ชันแสดงไอคอนและสีตามประเภทไฟล์
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return { icon: <BsFiletypePdf className="h-5 w-5 text-red-600" />, color: "text-red-500", tooltip: "PDF" };
      case 'doc':
      case 'docx':
        return { icon: <BsFiletypeDocx className="h-5 w-5 text-blue-600" />, color: "text-blue-500", tooltip: "Word" };
      case 'xls':
      case 'xlsx':
        return { icon: <BsFiletypeXlsx className="h-5 w-5 text-green-600" />, color: "text-green-500", tooltip: "Excel" };
      case 'ppt':
      case 'pptx':
        return { icon: <BsFiletypePpt className="h-5 w-5 text-orange-600" />, color: "text-orange-500", tooltip: "PowerPoint" };
      case 'csv':
        return { icon: <BsFiletypeCsv className="h-5 w-5 text-blue-600" />, color: "text-blue-500", tooltip: "CSV" };
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return { icon: <FiImage className="h-5 w-5 text-purple-600" />, color: "text-purple-500", tooltip: "รูปภาพ" };
      case 'zip':
      case 'rar':
        return { icon: <FiArchive className="h-5 w-5 text-yellow-600" />, color: "text-yellow-500", tooltip: "ไฟล์บีบอัด" };
      default:
        return { icon: <FiFileText className="h-5 w-5 text-gray-600" />, color: "text-gray-500", tooltip: "เอกสาร" };
    }
  };

  if (isLoading) {
    return (
      <div className="w-full px-2 mx-auto">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-1">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-8 w-40" />
            </div>
            <Skeleton className="h-4 w-64 ml-8 mt-1" />
          </div>
          
          <div className="rounded-lg border bg-card shadow">
            <div className="flex items-center justify-between p-4 border-b">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-9 w-40" />
            </div>
            
            <div className="p-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center gap-4 mb-4">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-2 mx-auto">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

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
    <div className="w-full px-2 mx-auto">
      <div className="flex flex-col gap-4">
        {/* หัวข้อหลักและคำอธิบาย */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-1">
            <FiFolder className="text-primary h-5 w-5" />
            <h1 className="text-xl font-bold">จัดการโปรเจค</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-8">
            จัดการข้อมูลโปรเจคในระบบ
          </p>
        </div>

        {/* ตารางข้อมูล */}
        <div className="rounded-lg border bg-card shadow">
          <div className="flex items-center justify-between p-4 border-b">
            {/* ชื่อตาราง */}
            <h2 className="text-lg font-medium">รายการโปรเจค</h2>
            
            {/* ปุ่มเพิ่มโปรเจค */}
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={onAdd}
              size="sm"
            >
              <FiPlus className="mr-1" size={16} />
              เพิ่มโปรเจค
            </Button>
          </div>
          
          {/* ตารางโปรเจค */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead 
                    className="font-semibold text-muted-foreground text-center cursor-pointer hover:text-primary transition-colors"
                    onClick={() => requestSort('name')}
                  >
                    ชื่อโปรเจค {getSortIcon('name')}
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-muted-foreground text-center cursor-pointer hover:text-primary transition-colors"
                    onClick={() => requestSort('code')}
                  >
                    รหัส {getSortIcon('code')}
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-muted-foreground text-center cursor-pointer hover:text-primary transition-colors"
                    onClick={() => requestSort('startDate')}
                  >
                    วันที่เริ่ม {getSortIcon('startDate')}
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-muted-foreground text-center cursor-pointer hover:text-primary transition-colors"
                    onClick={() => requestSort('endDate')}
                  >
                    วันที่สิ้นสุด {getSortIcon('endDate')}
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-muted-foreground text-center cursor-pointer hover:text-primary transition-colors"
                    onClick={() => requestSort('priority')}
                  >
                    ความสำคัญ {getSortIcon('priority')}
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-muted-foreground text-center cursor-pointer hover:text-primary transition-colors"
                    onClick={() => requestSort('status')}
                  >
                    สถานะ {getSortIcon('status')}
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-center">ผู้รับผิดชอบ</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-center">เอกสาร</TableHead>
                  <TableHead className="w-[100px] text-center font-semibold text-muted-foreground">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      ไม่พบข้อมูลโปรเจค
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map(project => (
                    <TableRow key={project.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium">{project.name}</div>
                        {project.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {project.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{project.code}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {project.startDate ? new Date(project.startDate).toLocaleDateString('th-TH') : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {project.endDate ? new Date(project.endDate).toLocaleDateString('th-TH') : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getPriorityBadgeVariant(project.priority)}>
                          {getPriorityLabel(project.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusBadgeVariant(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex -space-x-2 justify-center">
                          {project.members && project.members.length > 0 ? (
                            <>
                              {project.members.slice(0, 3).map((member) => (
                                <Avatar key={member.employeeId} className="h-8 w-8 border-2 border-background">
                                  <AvatarImage 
                                    src={member.employee?.image} 
                                    alt={`${member.employee?.firstName} ${member.employee?.lastName}`}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {member.employee?.firstName?.charAt(0)}
                                    {member.employee?.lastName?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {project.members.length > 3 && (
                                <Avatar className="h-8 w-8 border-2 border-background bg-muted">
                                  <AvatarFallback className="text-xs">
                                    +{project.members.length - 3}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">ไม่มีสมาชิก</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {project.attachments && project.attachments.length > 0 ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1 text-xs h-7 mx-auto"
                              >
                                <FiPaperclip className="h-3 w-3" />
                                {project.attachments.length} ไฟล์
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-3" align="center">
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">เอกสารแนบ ({project.attachments.length})</h4>
                                <div className="max-h-60 overflow-y-auto pr-1">
                                  {project.attachments.map((file, index) => {
                                    const fileInfo = getFileIcon(file);
                                    return (
                                      <div key={index} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md transition-colors">
                                        <div className={`flex items-center justify-center w-8 h-8 ${fileInfo.color === 'text-red-500' ? 'bg-red-100' : 
                                          fileInfo.color === 'text-blue-500' ? 'bg-blue-100' : 
                                          fileInfo.color === 'text-green-500' ? 'bg-green-100' : 
                                          fileInfo.color === 'text-orange-500' ? 'bg-orange-100' : 
                                          fileInfo.color === 'text-purple-500' ? 'bg-purple-100' : 
                                          fileInfo.color === 'text-yellow-500' ? 'bg-yellow-100' : 
                                          'bg-gray-100'} rounded-md`}>
                                          {fileInfo.icon}
                                        </div>
                                        <div className="flex-1 truncate text-sm">
                                          {file}
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                          <FiDownload className="h-3 w-3" />
                                          <span className="sr-only">ดาวน์โหลด</span>
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-muted-foreground text-sm">ไม่มีเอกสาร</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(project)}>
                            <FiEye className="h-4 w-4" />
                            <span className="sr-only">ดูรายละเอียด</span>
                          </Button>
                          
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(project)}>
                            <FiEdit className="h-4 w-4" />
                            <span className="sr-only">แก้ไข</span>
                          </Button>
                          
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAddMember(project)}>
                            <FiUsers className="h-4 w-4" />
                            <span className="sr-only">จัดการสมาชิก</span>
                          </Button>
                          
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(project)}>
                            <FiTrash2 className="h-4 w-4" />
                            <span className="sr-only">ลบ</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                แสดง {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedProjects.length)} จากทั้งหมด {sortedProjects.length} รายการ
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <FiChevronLeft className="h-4 w-4" />
                </Button>
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  // แสดงเฉพาะหน้าที่อยู่ในช่วง +/- 2 จากหน้าปัจจุบัน และหน้าแรกกับหน้าสุดท้าย
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                  ) {
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => paginate(pageNumber)}
                        className="w-9"
                      >
                        {pageNumber}
                      </Button>
                    );
                  } else if (
                    (pageNumber === currentPage - 3 && currentPage > 3) ||
                    (pageNumber === currentPage + 3 && currentPage < totalPages - 2)
                  ) {
                    return <span key={pageNumber}>...</span>;
                  }
                  return null;
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <FiChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 