import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useProjects() {
  // State สำหรับโปรเจค
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionError, setConnectionError] = useState(false);

  // ฟังก์ชันดึงข้อมูลโปรเจค
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setConnectionError(false);
      
      const res = await fetch('/api/projects');
      const data = await res.json();
      
      if (data.success) {
        setProjects(data.data || []);
      } else {
        setError(data.message || 'ไม่สามารถดึงข้อมูลโปรเจคได้');
        toast.error(data.message || 'ไม่สามารถดึงข้อมูลโปรเจคได้');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลโปรเจค');
      
      if (err.message?.includes('Failed to fetch')) {
        setConnectionError(true);
      }
      
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลโปรเจค');
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันเพิ่มโปรเจคใหม่เข้าในรายการ
  const addProject = (newProject) => {
    setProjects(prevProjects => [newProject, ...prevProjects]);
  };

  // ฟังก์ชันอัปเดตโปรเจค
  const updateProject = (updatedProject) => {
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === updatedProject.id ? updatedProject : project
      )
    );
  };

  // ฟังก์ชันลบโปรเจค
  const deleteProject = (projectId) => {
    setProjects(prevProjects => 
      prevProjects.filter(project => project.id !== projectId)
    );
  };

  // ฟังก์ชันเพิ่มสมาชิกโปรเจค
  const addMemberToProject = (projectId, newMember) => {
    setProjects(prevProjects => 
      prevProjects.map(project => {
        if (project.id === projectId) {
          // สร้างอาร์เรย์สมาชิกใหม่หากยังไม่มี
          const members = project.members ? [...project.members] : [];
          // เพิ่มสมาชิกใหม่
          return {
            ...project,
            members: [...members, newMember]
          };
        }
        return project;
      })
    );
  };

  // ฟังก์ชันลบสมาชิกโปรเจค
  const removeMemberFromProject = (projectId, memberId) => {
    setProjects(prevProjects => 
      prevProjects.map(project => {
        if (project.id === projectId && project.members) {
          return {
            ...project,
            members: project.members.filter(member => member.id !== memberId)
          };
        }
        return project;
      })
    );
  };

  return {
    projects,
    isLoading,
    error,
    connectionError,
    fetchProjects,
    addProject,
    updateProject,
    deleteProject,
    addMemberToProject,
    removeMemberFromProject
  };
} 