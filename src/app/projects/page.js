'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiUsers, FiFilter, FiChevronDown } from 'react-icons/fi';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { LoadingPage, LoadingSpinner } from '../../components/ui/loading';
import { formatDateToDisplay } from '../../lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import { Checkbox } from '../../components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { ScrollArea } from '../../components/ui/scroll-area';

export default function ProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State สำหรับโหลดดิ้ง
  const [loading, setLoading] = useState(true);
  
  // State สำหรับโปรเจค
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // State สำหรับพนักงาน
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  
  // State สำหรับฟิลเตอร์
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State สำหรับการเรียงลำดับ
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc',
  });
  
  // State สำหรับ dialog การเพิ่มและแก้ไขโปรเจค
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState(false);
  
  // State สำหรับ dialog การเพิ่มสมาชิก
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [searchMember, setSearchMember] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  
  // State สำหรับฟอร์มโปรเจค
  const [projectForm, setProjectForm] = useState({
    name: '',
    code: '',
    description: '',
    startDate: '',
    endDate: '',
    priority: 'medium',
    status: 'active',
  });
  
  // State สำหรับการโหลดดิ้งในขณะบันทึก
  const [isSaving, setIsSaving] = useState(false);
  
  // State สำหรับข้อความ error
  const [error, setError] = useState('');

  // ฟังก์ชันเรียกข้อมูลโปรเจค
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      const data = await res.json();
      
      if (data.success) {
        setProjects(data.data);
      } else {
        setError(data.message || 'ไม่สามารถดึงข้อมูลโปรเจคได้');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลโปรเจค');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันเรียกข้อมูลพนักงานและทีม
  const fetchEmployeesAndTeams = async () => {
    try {
      const res = await fetch('/api/employees?includeAll=true');
      const data = await res.json();
      
      if (data.success) {
        setEmployees(data.data);
        
        // สกัดข้อมูลทีมจากพนักงาน
        const uniqueTeams = Array.from(
          new Set(
            data.data
              .filter(emp => emp.team && emp.team.name)
              .map(emp => JSON.stringify({ id: emp.team.id, name: emp.team.name }))
          )
        ).map(team => JSON.parse(team));
        
        setTeams(uniqueTeams);
      }
    } catch (err) {
      console.error('Error fetching employees and teams:', err);
    }
  };

  // ฟังก์ชันเพิ่มสมาชิกโปรเจค
  const handleAddMember = async (employeeId) => {
    if (!selectedProject) return;
    
    // ตรวจสอบว่าพนักงานอยู่ในโปรเจคแล้วหรือไม่
    const isAlreadyMember = selectedProject.members?.some(member => member.employeeId === employeeId);
    if (isAlreadyMember) {
      toast.error('พนักงานนี้เป็นสมาชิกในโปรเจคอยู่แล้ว');
      return;
    }
    
    try {
      setAddMemberLoading(true);
      
      // ค้นหาข้อมูลพนักงาน
      const employee = employees.find(emp => emp.id === employeeId);
      
      // อัพเดทข้อมูลโปรเจคและสมาชิกในโปรเจค
      const updatedProject = { ...selectedProject };
      if (!updatedProject.members) updatedProject.members = [];
      
      // เพิ่มสมาชิกใหม่
      updatedProject.members.push({
        employeeId: employeeId,
        projectId: selectedProject.id,
        roleId: 1, // ค่าเริ่มต้นเป็น member
        employee: employee
      });
      
      // อัพเดท selected project
      setSelectedProject(updatedProject);
      
      // อัพเดทรายการโปรเจคทั้งหมด
      const updatedProjects = projects.map(project => 
        project.id === selectedProject.id ? updatedProject : project
      );
      setProjects(updatedProjects);
      
      toast.success(`เพิ่ม ${employee.firstName} ${employee.lastName} เป็นสมาชิกเรียบร้อยแล้ว`);
      
      // รีเซ็ตค่าการค้นหา
      setSearchMember('');
    } catch (err) {
      console.error('Error adding member:', err);
      toast.error('เกิดข้อผิดพลาดในการเพิ่มสมาชิก');
    } finally {
      setAddMemberLoading(false);
    }
  };

  // useEffect สำหรับการตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // useEffect สำหรับการโหลดข้อมูลเมื่อเข้าสู่ระบบแล้ว
  useEffect(() => {
    if (session) {
      fetchProjects();
      fetchEmployeesAndTeams();
    }
  }, [session]);

  // แสดงหน้าโหลดดิ้งหากกำลังโหลดสถานะการเข้าสู่ระบบ
  if (status === 'loading') {
    return <LoadingPage message="กำลังโหลดข้อมูล..." />;
  }

  // ไม่แสดงอะไรหากยังไม่ได้เข้าสู่ระบบ
  if (!session) {
    return null;
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

  // ฟังก์ชันแปลงตำแหน่งเป็นภาษาไทย
  const getRoleTitle = (abbreviation) => {
    const roleMap = {
      'PM': 'Project Manager',
      'TL': 'Team Leader',
      'BE': 'Backend Developer',
      'FE': 'Frontend Developer',
      'FS': 'Full Stack Developer',
      'QA': 'Quality Assurance',
      'UX': 'UX Designer',
      'DV': 'DevOps Engineer',
      'BA': 'Business Analyst',
      'AM': 'Account Manager',
      'SM': 'Scrum Master',
      'PO': 'Product Owner',
      'CM': 'Content Manager',
    };
    return roleMap[abbreviation] || abbreviation;
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">จัดการโปรเจค</h1>

      {/* Header section with add button */}
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <Button onClick={() => setIsAddProjectDialogOpen(true)}>
          <FiPlus className="mr-2" />
          เพิ่มโปรเจค
          </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-6">
        <Tabs defaultValue="all" value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList>
            <TabsTrigger value="all">
              ทั้งหมด
              <Badge variant="outline" className="ml-2">
                {projects.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="active">
              กำลังดำเนินการ
              <Badge variant="outline" className="ml-2">
                {projects.filter(p => p.status === 'active').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed">
              เสร็จสิ้น
              <Badge variant="outline" className="ml-2">
                {projects.filter(p => p.status === 'completed').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="on-hold">
              ระงับชั่วคราว
              <Badge variant="outline" className="ml-2">
                {projects.filter(p => p.status === 'on-hold').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              ยกเลิก
              <Badge variant="outline" className="ml-2">
                {projects.filter(p => p.status === 'cancelled').length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Search field */}
      <div className="relative mb-6">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="ค้นหาโปรเจคตามชื่อ, รหัส หรือผู้สร้าง"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Projects table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => {
                    setSortConfig({
                      key: 'name',
                      direction: sortConfig.key === 'name' && sortConfig.direction === 'asc' ? 'desc' : 'asc',
                    });
                  }}
                >
                  ชื่อโปรเจค
                  {sortConfig.key === 'name' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => {
                    setSortConfig({
                      key: 'code',
                      direction: sortConfig.key === 'code' && sortConfig.direction === 'asc' ? 'desc' : 'asc',
                    });
                  }}
                >
                  รหัส
                  {sortConfig.key === 'code' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => {
                    setSortConfig({
                      key: 'startDate',
                      direction: sortConfig.key === 'startDate' && sortConfig.direction === 'asc' ? 'desc' : 'asc',
                    });
                  }}
                >
                  วันที่เริ่ม
                  {sortConfig.key === 'startDate' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => {
                    setSortConfig({
                      key: 'endDate',
                      direction: sortConfig.key === 'endDate' && sortConfig.direction === 'asc' ? 'desc' : 'asc',
                    });
                  }}
                >
                  วันที่สิ้นสุด
                  {sortConfig.key === 'endDate' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => {
                    setSortConfig({
                      key: 'priority',
                      direction: sortConfig.key === 'priority' && sortConfig.direction === 'asc' ? 'desc' : 'asc',
                    });
                  }}
                >
                  ความสำคัญ
                  {sortConfig.key === 'priority' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => {
                    setSortConfig({
                      key: 'status',
                      direction: sortConfig.key === 'status' && sortConfig.direction === 'asc' ? 'desc' : 'asc',
                    });
                  }}
                >
                  สถานะ
                  {sortConfig.key === 'status' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead>ผู้รับผิดชอบ</TableHead>
                <TableHead className="w-[80px]">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* จะเพิ่มโค้ดแสดงรายการโปรเจคที่นี่ */}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog สำหรับเพิ่มสมาชิก */}
      <AlertDialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <AlertDialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>เพิ่มสมาชิก</AlertDialogTitle>
            <AlertDialogDescription>
              เลือกพนักงานที่ต้องการเพิ่มเป็นสมาชิกในโปรเจค
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <Command className="rounded-lg border shadow-md">
            <CommandInput 
              placeholder="ค้นหาพนักงาน..." 
              value={searchMember}
              onValueChange={setSearchMember}
            />
            <CommandList>
              <CommandEmpty>ไม่พบพนักงานที่ค้นหา</CommandEmpty>
              {teams.map(team => {
                // กรองพนักงานตามทีม
                const teamEmployees = employees
                  .filter(emp => 
                    emp.team?.id === team.id && 
                    (!selectedProject || !selectedProject.members?.some(m => m.employeeId === emp.id)) &&
                    (emp.firstName?.toLowerCase().includes(searchMember.toLowerCase()) || 
                     emp.lastName?.toLowerCase().includes(searchMember.toLowerCase()))
                  );
                
                // แสดงเฉพาะทีมที่มีพนักงาน
                if (teamEmployees.length === 0) return null;
                
                return (
                  <CommandGroup key={team.id} heading={team.name}>
                    {teamEmployees.map(employee => (
                      <CommandItem 
                        key={employee.id}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={employee.image} 
                                alt={`${employee.firstName} ${employee.lastName}`} 
                              />
                              <AvatarFallback>
                                {employee.firstName?.charAt(0)}
                                {employee.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p>{employee.firstName} {employee.lastName}</p>
                              <p className="text-sm text-gray-500">
                                {employee.position || 'ไม่ระบุตำแหน่ง'}
                              </p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddMember(employee.id);
                            }}
                            disabled={addMemberLoading}
                          >
                            {addMemberLoading ? (
                              <LoadingSpinner className="w-4 h-4 mr-2" />
                            ) : (
                              <FiPlus className="mr-1" />
                            )}
                            เพิ่ม
                          </Button>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
              
              {/* พนักงานที่ไม่อยู่ในทีมใด */}
              {(() => {
                const noTeamEmployees = employees
                  .filter(emp => 
                    !emp.team?.id && 
                    (!selectedProject || !selectedProject.members?.some(m => m.employeeId === emp.id)) &&
                    (emp.firstName?.toLowerCase().includes(searchMember.toLowerCase()) || 
                     emp.lastName?.toLowerCase().includes(searchMember.toLowerCase()))
                  );
                
                if (noTeamEmployees.length === 0) return null;
                
                return (
                  <CommandGroup heading="ไม่มีทีม">
                    {noTeamEmployees.map(employee => (
                      <CommandItem 
                        key={employee.id}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={employee.image} 
                                alt={`${employee.firstName} ${employee.lastName}`} 
                              />
                              <AvatarFallback>
                                {employee.firstName?.charAt(0)}
                                {employee.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p>{employee.firstName} {employee.lastName}</p>
                              <p className="text-sm text-gray-500">
                                {employee.position || 'ไม่ระบุตำแหน่ง'}
                              </p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddMember(employee.id);
                            }}
                            disabled={addMemberLoading}
                          >
                            {addMemberLoading ? (
                              <LoadingSpinner className="w-4 h-4 mr-2" />
                            ) : (
                              <FiPlus className="mr-1" />
                            )}
                            เพิ่ม
                          </Button>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })()}
            </CommandList>
          </Command>
          
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddMemberDialogOpen(false);
              setSearchMember('');
            }}>
              ปิด
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
