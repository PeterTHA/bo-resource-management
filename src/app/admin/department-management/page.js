'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiArrowLeft, FiEdit, FiTrash2, FiUsers } from 'react-icons/fi';
import { hasPermission } from '@/lib/permissions';

export default function DepartmentManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    code: '', 
    description: '', 
    manager: '',
    teamCount: 0,
    totalMembers: 0
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchDepartments();
      fetchTeams();
    }
  }, [session]);

  const canManageDepartments = session?.user && (hasPermission(session.user, 'manage_departments') || session.user.role === 'admin');

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลแผนก');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลทีม');
    }
  };

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setFormData({ 
      name: '', 
      code: '', 
      description: '', 
      manager: '',
      teamCount: 0,
      totalMembers: 0
    });
    setIsDepartmentModalOpen(true);
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description,
      manager: department.manager,
      teamCount: department.teamCount,
      totalMembers: department.totalMembers
    });
    setIsDepartmentModalOpen(true);
  };

  const handleDeleteDepartment = async (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบแผนกนี้?')) {
      try {
        const response = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
        if (response.ok) {
          fetchDepartments();
          setSuccessMessage('ลบแผนกเรียบร้อยแล้ว');
        } else {
          setError('เกิดข้อผิดพลาดในการลบแผนก');
        }
      } catch (error) {
        console.error('Error deleting department:', error);
        setError('เกิดข้อผิดพลาดในการลบแผนก');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingDepartment ? `/api/departments/${editingDepartment.id}` : '/api/departments';
    const method = editingDepartment ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          manager: formData.manager,
          teamCount: formData.teamCount,
          totalMembers: formData.totalMembers,
          isActive: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(editingDepartment ? 'อัปเดตแผนกเรียบร้อยแล้ว' : 'เพิ่มแผนกเรียบร้อยแล้ว');
        fetchDepartments();
        setIsDepartmentModalOpen(false);
        setFormData({ 
          name: '', 
          code: '', 
          description: '', 
          manager: '',
          teamCount: 0,
          totalMembers: 0
        });
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error) {
      console.error('Error saving department:', error);
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!canManageDepartments) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">ไม่มีสิทธิ์เข้าถึง</h1>
          <p className="text-gray-600">คุณไม่มีสิทธิ์ในการจัดการแผนก</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            กลับไปหน้าแดชบอร์ด
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">จัดการแผนก</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push('/admin/team-management')}
            className="btn bg-green-600 hover:bg-green-700 text-white"
          >
            <FiUsers className="mr-1" />
            จัดการทีม
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn bg-gray-600 hover:bg-gray-700 text-white"
          >
            <FiArrowLeft className="mr-1" />
            กลับ
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">แผนกทั้งหมด</h2>
            <button onClick={handleAddDepartment} className="btn bg-blue-600 hover:bg-blue-700 text-white">
              <FiPlus className="mr-1" />
              เพิ่มแผนก
            </button>
          </div>
          {departments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">รหัส</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">ชื่อแผนก</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">ผู้จัดการ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">จำนวนทีม</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">จำนวนสมาชิก</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {departments.map((department) => (
                    <tr key={department.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{department.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{department.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{department.manager || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {teams.filter(team => team.departmentId === department.id).length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {teams
                          .filter(team => team.departmentId === department.id)
                          .reduce((sum, team) => sum + team.memberCount, 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex space-x-2">
                          <button onClick={() => handleEditDepartment(department)} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1">
                            <FiEdit className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleDeleteDepartment(department.id)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1">
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 dark:text-gray-400">ไม่พบข้อมูลแผนก</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal สำหรับเพิ่ม/แก้ไขแผนก */}
      {isDepartmentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingDepartment ? 'แก้ไขแผนก' : 'เพิ่มแผนก'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ชื่อแผนก
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    รหัส
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ผู้จัดการ
                  </label>
                  <input
                    type="text"
                    name="manager"
                    value={formData.manager}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    จำนวนทีม
                  </label>
                  <input
                    type="number"
                    name="teamCount"
                    value={formData.teamCount}
                    onChange={(e) => setFormData({ ...formData, teamCount: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    จำนวนสมาชิกทั้งหมด
                  </label>
                  <input
                    type="number"
                    name="totalMembers"
                    value={formData.totalMembers}
                    onChange={(e) => setFormData({ ...formData, totalMembers: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    รายละเอียด
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDepartmentModalOpen(false);
                    setFormData({ 
                      name: '', 
                      code: '', 
                      description: '', 
                      manager: '',
                      teamCount: 0,
                      totalMembers: 0
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  {editingDepartment ? 'บันทึกการแก้ไข' : 'เพิ่มแผนก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 