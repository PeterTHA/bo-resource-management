'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiArrowLeft, FiEdit, FiTrash2, FiUsers } from 'react-icons/fi';
import { hasPermission } from '@/lib/permissions';
import Select from 'react-select';

export default function TeamManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    departmentId: '',
    teamLeaderIds: []
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      Promise.all([
        fetchTeams(),
        fetchDepartments(),
        fetchEmployees()
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [session]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      const data = await response.json();
      setTeams(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลทีม');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      const data = await response.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลแผนก');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      if (Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน');
    }
  };

  const handleAddTeam = () => {
    setEditingTeam(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      departmentId: '',
      teamLeaderIds: []
    });
    setIsTeamModalOpen(true);
  };

  const handleEditClick = (team) => {
    setEditingTeam(team);
    setFormData({
      id: team.id,
      name: team.name || '',
      code: team.code || '',
      description: team.description || '',
      departmentId: team.departmentId || '',
      teamLeaderIds: team.teamLeaders?.map(leader => leader.id) || []
    });
    setIsTeamModalOpen(true);
  };

  const handleDeleteTeam = async (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบทีมนี้?')) {
      try {
        const response = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
        if (response.ok) {
          fetchTeams();
          setSuccessMessage('ลบทีมเรียบร้อยแล้ว');
        } else {
          setError('เกิดข้อผิดพลาดในการลบทีม');
        }
      } catch (error) {
        console.error('Error deleting team:', error);
        setError('เกิดข้อผิดพลาดในการลบทีม');
      }
    }
  };

  const updateEmployeeRole = async (employeeId, newRole) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update employee role');
      }
      
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee role:', error);
      setError('เกิดข้อผิดพลาดในการอัปเดตสิทธิ์พนักงาน');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingTeam ? `/api/teams/${editingTeam.id}` : '/api/teams';
    const method = editingTeam ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          teamLeaderIds: formData.teamLeaderIds || []
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(editingTeam ? 'อัปเดตทีมเรียบร้อยแล้ว' : 'เพิ่มทีมเรียบร้อยแล้ว');
        fetchTeams();
        setIsTeamModalOpen(false);
        setFormData({
          name: '',
          code: '',
          description: '',
          departmentId: '',
          teamLeaderIds: []
        });
        setEditingTeam(null);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error) {
      console.error('Error saving team:', error);
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message);
    }
  };

  const canManageTeams = session?.user && (hasPermission(session.user, 'manage_teams') || session.user.role === 'admin');

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!canManageTeams) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">ไม่มีสิทธิ์เข้าถึง</h1>
          <p className="text-gray-600">คุณไม่มีสิทธิ์ในการจัดการทีม</p>
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
        <h1 className="text-2xl font-bold">จัดการทีม</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push('/admin/department-management')}
            className="btn bg-green-600 hover:bg-green-700 text-white"
          >
            <FiUsers className="mr-1" />
            จัดการแผนก
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
            <h2 className="text-xl font-semibold">ทีมทั้งหมด</h2>
            <button onClick={handleAddTeam} className="btn bg-blue-600 hover:bg-blue-700 text-white">
              <FiPlus className="mr-1" />
              เพิ่มทีม
            </button>
          </div>
          {teams.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">รหัส</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">ชื่อทีม</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">แผนก</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">หัวหน้าทีม</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">จำนวนสมาชิก</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {teams.map((team) => (
                    <tr key={team.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{team.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{team.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {team.department?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {team.teamLeaders?.map(leader => `${leader.firstName} ${leader.lastName}`).join(', ') || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {team.members?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex space-x-2">
                          <button onClick={() => handleEditClick(team)} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1">
                            <FiEdit className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleDeleteTeam(team.id)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1">
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
              <p className="text-gray-600 dark:text-gray-400">ไม่พบข้อมูลทีม</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal สำหรับเพิ่ม/แก้ไขทีม */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingTeam ? 'แก้ไขทีม' : 'เพิ่มทีม'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ชื่อทีม
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
                    แผนก
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">เลือกแผนก</option>
                    {Array.isArray(departments) && departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    หัวหน้าทีม
                  </label>
                  <select
                    name="teamLeaderIds"
                    value={formData.teamLeaderIds || []}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => Number(option.value));
                      setFormData(prev => ({
                        ...prev,
                        teamLeaderIds: selectedOptions
                      }));
                    }}
                    multiple
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {employees
                      .filter(emp => emp.teamId === formData.id || !emp.teamId)
                      .map((employee) => (
                        <option 
                          key={employee.id} 
                          value={employee.id}
                          className={employee.role === 'supervisor' ? 'font-semibold' : ''}
                        >
                          {employee.firstName} {employee.lastName} 
                          ({employee.positionTitle || employee.position})
                          {employee.role === 'supervisor' ? ' - หัวหน้าทีม' : ''}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">กดปุ่ม Ctrl (Windows) หรือ Command (Mac) เพื่อเลือกหลายคน</p>
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
                    setIsTeamModalOpen(false);
                    setFormData({
                      name: '',
                      code: '',
                      description: '',
                      departmentId: '',
                      teamLeaderIds: []
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
                  {editingTeam ? 'บันทึกการแก้ไข' : 'เพิ่มทีม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 