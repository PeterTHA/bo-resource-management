'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

// นำเข้า Components
import ProjectList from './components/ProjectList';
import AddProjectDialog from './components/dialogs/AddProjectDialog';
import AddMemberDialog from './components/dialogs/AddMemberDialog';
import DeleteConfirmDialog from './components/dialogs/DeleteConfirmDialog';
import ViewProjectDialog from './components/dialogs/ViewProjectDialog';

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
  const [isViewProjectDialogOpen, setIsViewProjectDialogOpen] = useState(false);
  
  // State สำหรับ dialog การเพิ่มสมาชิก
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
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
  const [isDeleting, setIsDeleting] = useState(false);
  
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
      
      return true;
    } catch (err) {
      console.error('Error adding member:', err);
      toast.error('เกิดข้อผิดพลาดในการเพิ่มสมาชิก');
      return false;
    } finally {
      setAddMemberLoading(false);
    }
  };
  
  // ฟังก์ชันลบโปรเจค
  const handleDeleteProject = async (projectId) => {
    try {
      setIsDeleting(true);
      
      // ส่งคำขอลบโปรเจค
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        // อัพเดทรายการโปรเจค
        const updatedProjects = projects.filter(project => project.id !== projectId);
        setProjects(updatedProjects);
        
        // ปิด dialog
        setIsDeleteProjectDialogOpen(false);
        toast.success('ลบโปรเจคเรียบร้อยแล้ว');
      } else {
        setError(data.message || 'ไม่สามารถลบโปรเจคได้');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('เกิดข้อผิดพลาดในการลบโปรเจค');
    } finally {
      setIsDeleting(false);
    }
  };

  // ฟังก์ชันเปิด Dialog ต่างๆ
  const openDialog = (dialog, project = null) => {
    if (project) {
      setSelectedProject(project);
    }

    switch (dialog) {
      case 'add':
        setIsAddProjectDialogOpen(true);
        break;
      case 'edit':
        setIsEditProjectDialogOpen(true);
        break;
      case 'view':
        setIsViewProjectDialogOpen(true);
        break;
      case 'delete':
        setIsDeleteProjectDialogOpen(true);
        break;
      case 'addMember':
        setIsAddMemberDialogOpen(true);
        break;
      default:
        break;
    }
  };

  // ฟังก์ชันปิด Dialog ต่างๆ
  const closeDialog = (dialog) => {
    switch (dialog) {
      case 'add':
        setIsAddProjectDialogOpen(false);
        break;
      case 'edit':
        setIsEditProjectDialogOpen(false);
        break;
      case 'view':
        setIsViewProjectDialogOpen(false);
        break;
      case 'delete':
        setIsDeleteProjectDialogOpen(false);
        break;
      case 'addMember':
        setIsAddMemberDialogOpen(false);
        break;
      default:
        break;
    }
  };

  // ฟังก์ชันเพิ่มโปรเจคใหม่
  const handleAddProject = async (projectData) => {
    try {
      setIsSaving(true);
      setError('');
      
      // แปลงข้อมูลฟอร์มให้เป็นรูปแบบที่ API ต้องการ
      const payload = {
        name: projectData.name,
        code: projectData.code,
        description: projectData.description,
        start_date: projectData.startDate,
        end_date: projectData.endDate,
        priority: projectData.priority,
        status: projectData.status,
        members: projectData.members,
        jira_url: projectData.jira_url,
        confluence_url: projectData.confluence_url,
        attachments: projectData.attachments.map(file => file.name) // ส่งเฉพาะชื่อไฟล์ไปก่อน ในอนาคตควรอัพโหลดไฟล์ไปยัง storage
      };
      
      // ส่งคำขอสร้างโปรเจคใหม่
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // เพิ่มโปรเจคใหม่เข้าไปในรายการ
        setProjects([data.data, ...projects]);
        
        // ปิด dialog
        setIsAddProjectDialogOpen(false);
        
        // แสดงข้อความสำเร็จ
        toast.success('เพิ่มโปรเจคเรียบร้อยแล้ว');
        
        return { success: true };
      } else {
        setError(data.message || 'ไม่สามารถเพิ่มโปรเจคได้');
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error('Error adding project:', err);
      setError('เกิดข้อผิดพลาดในการเพิ่มโปรเจค');
      return { success: false, message: 'เกิดข้อผิดพลาดในการเพิ่มโปรเจค' };
    } finally {
      setIsSaving(false);
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
    return (
      <div className="min-h-[200px] w-full flex flex-col items-center justify-center">
        <div className="w-12 h-12">
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
        <p className="mt-4 text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  // ไม่แสดงอะไรหากยังไม่ได้เข้าสู่ระบบ
  if (!session) {
    return null;
  }
  
  return (
    <div className="container mx-auto">
      {/* รายการโปรเจค */}
      <ProjectList 
        projects={projects}
        isLoading={loading}
        error={error}
        isAdmin={session?.user?.isAdmin}
        searchTerm={searchQuery}
        setSearchTerm={setSearchQuery}
        onView={(project) => openDialog('view', project)}
        onEdit={(project) => openDialog('edit', project)}
        onDelete={(project) => openDialog('delete', project)}
        onAddMember={(project) => openDialog('addMember', project)}
        onAdd={() => openDialog('add')}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
      />

      {/* Dialog สำหรับเพิ่มโปรเจค */}
      <AddProjectDialog
        open={isAddProjectDialogOpen}
        onOpenChange={setIsAddProjectDialogOpen}
        isSaving={isSaving}
        onAddProject={handleAddProject}
        employees={employees}
      />

      {/* Dialog สำหรับเพิ่มสมาชิก */}
      <AddMemberDialog
        open={isAddMemberDialogOpen}
        onOpenChange={setIsAddMemberDialogOpen}
        selectedProject={selectedProject}
        employees={employees}
        teams={teams}
        onAddMember={handleAddMember}
      />

      {/* Dialog สำหรับลบโปรเจค */}
      <DeleteConfirmDialog
        open={isDeleteProjectDialogOpen}
        onOpenChange={setIsDeleteProjectDialogOpen}
        project={selectedProject}
        isDeleting={isDeleting}
        onConfirmDelete={handleDeleteProject}
        error={error}
      />

      {/* Dialog สำหรับดูรายละเอียดโปรเจค */}
      <ViewProjectDialog
        open={isViewProjectDialogOpen}
        onOpenChange={setIsViewProjectDialogOpen}
        project={selectedProject}
      />
    </div>
  );
}
