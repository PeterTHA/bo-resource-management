'use client';

import { useState, useEffect } from 'react';
import { FiUser, FiEdit, FiTrash2, FiEye, FiKey, FiPlus, FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProfileImage from '@/components/ui/ProfileImage';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import ErrorMessage, { ConnectionErrorMessage } from '@/components/ui/ErrorMessage';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function EmployeeList({
  employees,
  isLoading,
  error,
  connectionError,
  isAdmin,
  isTeamLead,
  searchTerm,
  setSearchTerm,
  onView,
  onEdit,
  onDelete,
  onPasswordChange,
  onAdd,
  currentUserId,
}) {
  // state สำหรับ pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // state สำหรับ sorting
  const [sortConfig, setSortConfig] = useState({
    key: '',
    direction: ''
  });

  // ใช้ useEffect เพื่อตรวจสอบค่า props ที่รับเข้ามา
  useEffect(() => {
    console.log("isAdmin:", isAdmin);
    console.log("isTeamLead:", isTeamLead);
    console.log("currentUserId:", currentUserId);
  }, [isAdmin, isTeamLead, currentUserId]);

  const getProfileDisplay = (employee) => {
    return (
      <div className="flex items-center gap-3">
        <ProfileImage
          src={employee.image}
          alt={`${employee.firstName} ${employee.lastName}`}
          fallbackText={`${employee.firstName} ${employee.lastName}`}
          size="sm"
          clickable={employee.image ? true : false}
          onClickImage={() => employee.image && handleImagePreview(employee.image)}
        />
        <div className="ml-1">
          <h3 className="font-medium text-sm">{employee.firstName} {employee.lastName}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {employee.positionTitle || '-'}
          </p>
          {employee.positionLevel && (
            <p className="text-xs text-muted-foreground">
              {employee.positionLevel}
            </p>
          )}
        </div>
      </div>
    );
  };

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
      // ตรวจสอบว่าเป็นการเรียงลำดับตามแผนกหรือทีม
      if (sortConfig.key === 'department') {
        const aValue = a.department?.name || '';
        const bValue = b.department?.name || '';
        
        if (sortConfig.direction === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }
      
      if (sortConfig.key === 'team') {
        const aValue = a.teamData?.name || '';
        const bValue = b.teamData?.name || '';
        
        if (sortConfig.direction === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
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

  // ฟังก์ชันกรองพนักงานตามคำค้นหา
  const filteredEmployees = searchTerm 
    ? employees.filter(employee => 
        employee.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        employee.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.positionTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.department?.name && employee.department.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (employee.teamData?.name && employee.teamData.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : employees;

  // เรียงลำดับข้อมูล
  const sortedEmployees = sortedItems(filteredEmployees);
  
  // คำนวณจำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  
  // คำนวณรายการที่แสดงในหน้าปัจจุบัน
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedEmployees.slice(indexOfFirstItem, indexOfLastItem);

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

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error && !connectionError) {
    return <ErrorMessage message={error} />;
  }

  if (connectionError) {
    return <ConnectionErrorMessage message={error} />;
  }

  // ตรวจสอบสถานะการเป็น admin หรือ team lead อีกครั้ง
  const canManageEmployees = isAdmin === true || isTeamLead === true;
  
  return (
    <div className="w-full px-2 mx-auto">
      <div className="flex flex-col gap-4">
        {/* หัวข้อหลักและคำอธิบาย */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-1">
            <FiUser className="text-primary h-5 w-5" />
            <h1 className="text-xl font-bold">รายการพนักงาน</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-1">
            จัดการข้อมูลพนักงานในระบบ
          </p>
        </div>

        {/* ตารางข้อมูล */}
        <div className="rounded-lg border bg-card shadow">
          <div className="flex items-center justify-between p-4 border-b">
            {/* ชื่อตาราง */}
            <h2 className="text-lg font-medium">รายการพนักงาน</h2>
            
            {/* ปุ่มเพิ่มพนักงาน - แสดงเมื่อเป็น admin หรือ team lead เท่านั้น */}
            {canManageEmployees && (
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={onAdd}
                size="sm"
              >
                <FiPlus className="mr-1" size={16} />
                เพิ่มหนักงานใหม่
              </Button>
            )}
          </div>
          
          {/* ตารางพนักงาน */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead 
                    className="w-[120px] font-semibold text-muted-foreground text-center cursor-pointer hover:text-primary transition-colors"
                    onClick={() => requestSort('employeeId')}
                  >
                    รหัสพนักงาน {getSortIcon('employeeId')}
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-muted-foreground text-center cursor-pointer hover:text-primary transition-colors"
                    onClick={() => requestSort('firstName')}
                  >
                    ชื่อ-นามสกุล {getSortIcon('firstName')}
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-muted-foreground text-center cursor-pointer hover:text-primary transition-colors"
                    onClick={() => requestSort('department')}
                  >
                    แผนก {getSortIcon('department')}
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-muted-foreground text-center cursor-pointer hover:text-primary transition-colors"
                    onClick={() => requestSort('team')}
                  >
                    ทีม {getSortIcon('team')}
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-muted-foreground text-center cursor-pointer hover:text-primary transition-colors"
                    onClick={() => requestSort('email')}
                  >
                    อีเมล {getSortIcon('email')}
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-muted-foreground text-center cursor-pointer hover:text-primary transition-colors"
                    onClick={() => requestSort('isActive')}
                  >
                    สถานะ {getSortIcon('isActive')}
                  </TableHead>
                  <TableHead className="text-center font-semibold text-muted-foreground">
                    จัดการ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan="7" className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FiUser className="text-muted-foreground mb-2" size={36} />
                        <p className="text-sm text-muted-foreground">ไม่พบข้อมูลพนักงาน</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((employee) => (
                    <TableRow key={employee.id} className="border-b hover:bg-muted/10">
                      <TableCell className="font-medium text-sm text-center">
                        {employee.employeeId}
                      </TableCell>
                      <TableCell>
                        {getProfileDisplay(employee)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground text-center">
                        {employee.department?.name || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground text-center">
                        {employee.teamData?.name || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground text-center">
                        {employee.email}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Badge 
                            variant={employee.isActive ? "success" : "destructive"}
                            className="text-xs"
                          >
                            {employee.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button 
                            size="icon"
                            variant="ghost" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" 
                            onClick={() => onView(employee)}
                            title="ดูข้อมูล"
                          >
                            <FiEye className="h-4 w-4" />
                          </Button>
                          
                          {/* แสดงปุ่มแก้ไขเมื่อเป็น admin หรือ team lead หรือเป็นข้อมูลของตัวเอง */}
                          {(canManageEmployees || employee.id === currentUserId) && (
                            <Button 
                              size="icon"
                              variant="ghost" 
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" 
                              onClick={() => onEdit(employee)}
                              title="แก้ไข"
                            >
                              <FiEdit className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* แสดงปุ่มจัดการอื่นๆ เมื่อเป็น admin หรือ team lead เท่านั้น */}
                          {canManageEmployees && (
                            <>
                              <Button 
                                size="icon"
                                variant="ghost" 
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" 
                                onClick={() => onPasswordChange(employee)}
                                title="เปลี่ยนรหัสผ่าน"
                              >
                                <FiKey className="h-4 w-4" />
                              </Button>
                              
                              <Button 
                                size="icon"
                                variant="ghost" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                                onClick={() => onDelete(employee)}
                                title="ลบพนักงาน"
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {sortedEmployees.length > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
              <div className="text-muted-foreground text-sm">
                แสดง {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedEmployees.length)} จาก {sortedEmployees.length} รายการ
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-7 w-7 border-muted-foreground/30"
                >
                  <FiChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  หน้า <span className="font-medium">{currentPage}</span> จาก <span className="font-medium">{totalPages}</span>
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-7 w-7 border-muted-foreground/30"
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