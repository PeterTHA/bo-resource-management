'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import { FiSearch, FiFilter, FiInfo, FiCheck, FiX, FiTag, FiLayers, FiShield, FiUsers, FiRefreshCw } from 'react-icons/fi';

export default function UserAccessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [processingPermission, setProcessingPermission] = useState(null);

  // เช็คสิทธิ์การเข้าถึงหน้านี้
  useEffect(() => {
    if (status === 'authenticated') {
      if (session.user.role !== 'admin') {
        toast({
          variant: "destructive",
          title: "ไม่มีสิทธิ์เข้าถึง",
          description: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้",
        });
        router.push('/dashboard');
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router, toast]);

  // โหลดข้อมูลเมื่อเข้าสู่หน้า
  useEffect(() => {
    if (status === 'authenticated' && session.user.role === 'admin') {
      fetchRoles();
      fetchPermissions();
      fetchRolePermissions(false);
    }
  }, [status, session]);

  // โหลดข้อมูลบทบาท
  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      const data = await response.json();
      
      if (response.ok) {
        setRoles(data);
      } else {
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: data.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลบทบาท',
        });
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการโหลดข้อมูลบทบาท',
      });
    }
  };

  // โหลดข้อมูลสิทธิ์
  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/permissions');
      const data = await response.json();
      
      if (response.ok) {
        setPermissions(data);
      } else {
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: data.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลสิทธิ์',
        });
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสิทธิ์',
      });
    } finally {
      setLoading(false);
    }
  };

  // โหลดข้อมูลสิทธิ์ของแต่ละบทบาท
  const fetchRolePermissions = async (showToast = true) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/role-permissions');
      const data = await response.json();
      
      if (response.ok) {
        // จัดรูปแบบข้อมูลให้ง่ายต่อการใช้งาน
        const formattedData = {};
        data.forEach(rp => {
          if (!formattedData[rp.role_id]) {
            formattedData[rp.role_id] = [];
          }
          formattedData[rp.role_id].push(rp.permission_id);
        });
        
        setRolePermissions(formattedData);
        
        // แสดง toast เฉพาะเมื่อต้องการให้แสดง (เช่น กรณีกด refresh)
        if (showToast) {
          toast({
            title: "สำเร็จ",
            description: "โหลดข้อมูลสิทธิ์เรียบร้อยแล้ว",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: data.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลความสัมพันธ์ระหว่างบทบาทและสิทธิ์',
        });
      }
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการโหลดข้อมูลความสัมพันธ์ระหว่างบทบาทและสิทธิ์',
      });
    } finally {
      setLoading(false);
    }
  };

  // กรองข้อมูลตามคำค้นหาและหมวดหมู่
  const filteredPermissions = permissions.filter(permission => {
    // กรองตามคำค้นหา
    const matchesSearch = 
      permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.name_th.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (permission.description && permission.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // กรองตามหมวดหมู่ที่เลือก
    const matchesCategory = selectedCategory === 'all' || permission.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // จัดกลุ่มสิทธิ์ตามหมวดหมู่
  const permissionsByCategory = filteredPermissions.reduce((acc, permission) => {
    const category = permission.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {});

  // รับรายการหมวดหมู่ทั้งหมดที่มีใน permissions
  const allCategories = [...new Set(permissions.map(p => p.category || 'general'))];

  // บันทึกการเปลี่ยนแปลงสิทธิ์
  const handlePermissionChange = async (roleId, permissionId, isChecked) => {
    try {
      // บันทึกรายการที่กำลังประมวลผล
      setProcessingPermission(`${roleId}-${permissionId}`);
      
      const method = isChecked ? 'POST' : 'DELETE';
      const url = `/api/role-permissions${isChecked ? '' : `?roleId=${roleId}&permissionId=${permissionId}`}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: isChecked ? JSON.stringify({ role_id: roleId, permission_id: permissionId }) : undefined,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // อัปเดตข้อมูลในส่วนของ UI
        setRolePermissions(prev => {
          const updated = { ...prev };
          
          if (isChecked) {
            if (!updated[roleId]) {
              updated[roleId] = [];
            }
            updated[roleId].push(permissionId);
          } else {
            if (updated[roleId]) {
              updated[roleId] = updated[roleId].filter(id => id !== permissionId);
            }
          }
          
          return updated;
        });
        
        toast({
          title: "สำเร็จ",
          description: isChecked ? "เพิ่มสิทธิ์สำเร็จ" : "ลบสิทธิ์สำเร็จ",
        });
      } else {
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: data.message || `เกิดข้อผิดพลาดในการ${isChecked ? 'เพิ่ม' : 'ลบ'}สิทธิ์`,
        });
        // กรณีเกิดข้อผิดพลาด ให้ revert ค่ากลับ
        setRolePermissions(prev => ({ ...prev }));
      }
    } catch (error) {
      console.error(`Error ${isChecked ? 'adding' : 'removing'} permission:`, error);
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: `เกิดข้อผิดพลาดในการ${isChecked ? 'เพิ่ม' : 'ลบ'}สิทธิ์`,
      });
      // กรณีเกิดข้อผิดพลาด ให้ revert ค่ากลับ
      setRolePermissions(prev => ({ ...prev }));
    } finally {
      setProcessingPermission(null);
    }
  };

  // แสดงป้ายสถานะของหมวดหมู่
  const getCategoryBadge = (category) => {
    const categories = {
      'general': { label: 'ทั่วไป', icon: <FiTag className="mr-1 h-3 w-3" /> },
      'employee': { label: 'พนักงาน', icon: <FiUsers className="mr-1 h-3 w-3" /> },
      'leave': { label: 'การลา', icon: <FiTag className="mr-1 h-3 w-3" /> },
      'overtime': { label: 'โอที', icon: <FiTag className="mr-1 h-3 w-3" /> },
      'project': { label: 'โครงการ', icon: <FiLayers className="mr-1 h-3 w-3" /> },
      'report': { label: 'รายงาน', icon: <FiTag className="mr-1 h-3 w-3" /> },
      'system': { label: 'ระบบ', icon: <FiShield className="mr-1 h-3 w-3" /> },
      'work_status': { label: 'สถานะการทำงาน', icon: <FiTag className="mr-1 h-3 w-3" /> },
    };
    
    const categoryInfo = categories[category] || categories.general;
    
    return (
      <span className="inline-flex items-center text-xs font-medium">
        {categoryInfo.icon}
        {categoryInfo.label}
      </span>
    );
  };

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3">กำลังโหลด...</span>
      </div>
    );
  }

  return (
    <div className="container py-6 mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <FiShield className="mr-2 h-6 w-6 text-primary" />
            จัดการสิทธิ์ผู้ใช้
          </h1>
          <p className="text-muted-foreground mt-1">กำหนดสิทธิ์การใช้งานแต่ละฟังก์ชันให้กับบทบาทต่างๆ ในระบบ</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="ค้นหาสิทธิ์..."
              className="pl-9 w-full md:w-60"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => fetchRolePermissions(true)}
            title="รีเฟรชข้อมูล"
          >
            <FiRefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4 bg-muted/20 p-2 rounded-md">
        <Button 
          size="sm" 
          variant={selectedCategory === 'all' ? "default" : "outline"}
          onClick={() => setSelectedCategory('all')}
          className={`rounded-full h-8 ${selectedCategory === 'all' ? 'font-semibold shadow-sm' : 'text-muted-foreground'}`}
        >
          ทั้งหมด
        </Button>
        {allCategories.map(category => (
          <Button
            key={category}
            size="sm"
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full h-8 ${selectedCategory === category ? 'font-semibold shadow-sm' : 'text-muted-foreground'}`}
          >
            {getCategoryBadge(category)}
          </Button>
        ))}
      </div>
      
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">ตารางกำหนดสิทธิ์การใช้งาน</CardTitle>
          <CardDescription>
            เปิด/ปิดสวิตช์เพื่อกำหนดสิทธิ์ให้กับบทบาทต่างๆ ในระบบ
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {Object.keys(permissionsByCategory).length > 0 ? (
            <div className="overflow-auto border rounded-md max-h-[700px] relative">
              <Table className="relative w-full">
                <TableHeader className="sticky top-0 bg-background z-30 border-b shadow-sm">
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-40 w-[280px] !p-3 font-bold border-r">สิทธิ์การใช้งาน</TableHead>
                    {roles.map((role) => (
                      <TableHead key={role.id} className="text-center min-w-[130px] !p-3 bg-background">
                        <div className="font-medium">{role.name_th}</div>
                        <div className="text-xs text-muted-foreground">({role.name})</div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                    <React.Fragment key={category}>
                      <TableRow className="bg-secondary/30">
                        <TableCell colSpan={roles.length + 1} className="sticky left-0 py-2 font-semibold bg-secondary/30 z-10 shadow-sm">
                          <div className="flex items-center gap-2">
                            {getCategoryBadge(category)}
                            <Badge variant="outline" className="ml-2 bg-background">
                              {permissions.length} สิทธิ์
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {permissions.map((permission) => (
                        <TableRow key={permission.id} className="h-[60px] hover:bg-muted/10">
                          <TableCell className="sticky left-0 bg-background z-10 align-middle py-1.5 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <div className="font-medium text-sm">{permission.name_th}</div>
                            <div className="text-xs text-muted-foreground">{permission.name}</div>
                            <code className="text-[10px] text-muted-foreground">{permission.code}</code>
                          </TableCell>
                          
                          {roles.map((role) => {
                            const isChecked = rolePermissions[role.id]?.includes(permission.id);
                            const isProcessing = processingPermission === `${role.id}-${permission.id}`;
                            
                            return (
                              <TableCell key={`${role.id}-${permission.id}`} className="text-center py-1.5">
                                <div className="flex justify-center">
                                  <Switch
                                    id={`${role.id}-${permission.id}`}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => handlePermissionChange(role.id, permission.id, checked)}
                                    disabled={loading || isProcessing}
                                    className={isProcessing ? "opacity-50" : ""}
                                  />
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FiInfo className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">ไม่พบข้อมูล</h3>
              <p className="text-sm text-muted-foreground mt-1">
                ไม่พบข้อมูลสิทธิ์ที่ตรงตามเงื่อนไขที่กำหนด
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 