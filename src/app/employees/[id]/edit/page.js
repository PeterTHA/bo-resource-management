'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiSave, FiArrowLeft, FiUpload, FiX, FiKey, FiUser, FiEdit2, FiLock } from 'react-icons/fi';
import { LoadingPage, LoadingButton } from '../../../../components/ui/LoadingSpinner';
import ErrorMessage from '../../../../components/ui/ErrorMessage';
import { use } from 'react';

// เพิ่มฟังก์ชันตรวจสอบว่าเป็นรูปภาพจาก mock-images หรือไม่
const isMockImage = (src) => {
  return src && typeof src === 'string' && (src.startsWith('/mock-images/') || src.startsWith('./mock-images/'));
};

export default function EditEmployeePage({ params }) {
  // ใช้ React.use เพื่อแกะ params promise
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    positionLevel: '',
    positionTitle: '',
    departmentId: '',
    teamId: '',
    hireDate: '',
    role: 'employee',
    isActive: true,
    image: '',
    gender: 'male',
    birthDate: '',
    phoneNumber: '',
  });
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [positionLevels, setPositionLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // เรียกข้อมูลทีม แผนก ตำแหน่ง และระดับตำแหน่งเมื่อโหลดหน้า
  useEffect(() => {
    if (status === 'authenticated') {
      fetchPositions();
      fetchPositionLevels();
      
      // ดึงข้อมูลทีมตามบทบาท
      if (session.user.role === 'admin') {
        // หากเป็นแอดมิน ดึงทุกทีม
        fetchTeams();
        fetchDepartments();
      } else if (session.user.role === 'supervisor') {
        // หากเป็นหัวหน้างาน ดึงเฉพาะทีมของตัวเอง
        fetchSupervisorTeam();
        fetchSupervisorDepartment();
      }
    }
  }, [status, session]);

  // กำหนดตัวแปรเพื่อตรวจสอบว่าเป็นหัวหน้างานหรือไม่
  const isSupervisor = session?.user?.role === 'supervisor';
  
  // ตรวจสอบว่าผู้ใช้เป็นเจ้าของข้อมูลที่กำลังแก้ไขหรือไม่
  const isOwnProfile = session?.user?.id === employeeId;

  // ดึงข้อมูลทีมจาก API (สำหรับแอดมิน)
  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      
      if (data.success) {
        setTeams(data.data || []);
      } else {
        console.error('Error fetching teams:', data.message);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  // ดึงข้อมูลทีมของหัวหน้างาน
  const fetchSupervisorTeam = async () => {
    try {
      // ถ้าเป็นหัวหน้างาน ใช้ teamId จาก session
      if (session.user.teamId) {
        // ใช้ข้อมูลทีมที่มีอยู่ใน session ก่อน
        const teamName = session.user.team;
        if (teamName) {
          setTeams([{
            id: session.user.teamId,
            name: teamName
          }]);
        } else {
          // ถ้าไม่มีชื่อทีมใน session ค่อยดึงจาก API
          try {
            const res = await fetch(`/api/teams/${session.user.teamId}`);
            if (res.ok) {
              const data = await res.json();
              
              if (data.success && data.data) {
                // กำหนดเป็นอาร์เรย์ที่มีเพียงทีมเดียว
                setTeams([data.data]);
              } else {
                // ถ้าไม่สำเร็จแต่ไม่มีข้อผิดพลาด กำหนดเป็นทีมเปล่า
                setTeams([{
                  id: session.user.teamId,
                  name: 'ทีมของคุณ'
                }]);
              }
            } else {
              // ถ้า API ตอบกลับด้วย error ใช้ค่าที่มีอยู่
              setTeams([{
                id: session.user.teamId,
                name: 'ทีมของคุณ'
              }]);
            }
          } catch (error) {
            console.error('API error when fetching team:', error);
            // ใช้ค่าเริ่มต้นในกรณีที่มีข้อผิดพลาด
            setTeams([{
              id: session.user.teamId,
              name: 'ทีมของคุณ'
            }]);
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchSupervisorTeam:', error);
      // สร้างทีมเริ่มต้นในกรณีที่มีข้อผิดพลาด
      if (session.user.teamId) {
        setTeams([{
          id: session.user.teamId,
          name: 'ทีมของคุณ'
        }]);
      }
    }
  };

  // ดึงข้อมูลแผนกของหัวหน้างาน
  const fetchSupervisorDepartment = async () => {
    try {
      // กรณีหัวหน้างาน ตรวจสอบก่อนว่ามีข้อมูลแผนกใน session หรือไม่
      if (session.user.departmentId && session.user.department) {
        // ถ้ามีข้อมูลแผนกใน session ใช้ข้อมูลนั้นเลย
        setDepartments([{
          id: session.user.departmentId,
          name: session.user.department
        }]);
        return;
      }
      
      // ถ้าไม่มีข้อมูลใน session ดึงจาก API
      const res = await fetch('/api/departments');
      const data = await res.json();
      
      if (data.success) {
        // ถ้าเป็นหัวหน้างาน แสดงแค่แผนกของตัวเอง
        if (session.user.departmentId) {
          const supervisorDept = data.data?.find(d => d.id === session.user.departmentId);
          if (supervisorDept) {
            setDepartments([supervisorDept]);
          } else {
            // ถ้าไม่พบแผนกในข้อมูล API ใช้แผนกเริ่มต้น
            setDepartments([{
              id: session.user.departmentId,
              name: 'แผนกของคุณ'
            }]);
          }
        } else {
          // กรณีไม่มี departmentId ใน session ให้แสดงทุกแผนก
          setDepartments(data.data || []);
        }
      } else {
        console.error('Error fetching departments:', data.message);
        
        // กรณีมีข้อผิดพลาด ใช้แผนกเริ่มต้น
        if (session.user.departmentId) {
          setDepartments([{
            id: session.user.departmentId,
            name: 'แผนกของคุณ'
          }]);
        }
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      
      // กรณีผิดพลาดแต่เป็นหัวหน้างาน สร้างแผนกเริ่มต้น
      if (session.user.departmentId) {
        setDepartments([{
          id: session.user.departmentId,
          name: session.user.department || 'แผนกของคุณ'
        }]);
      }
    }
  };

  // ดึงข้อมูลแผนกจาก API (สำหรับแอดมิน)
  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      
      if (data.success) {
        setDepartments(data.data || []);
      } else {
        console.error('Error fetching departments:', data.message);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // ดึงข้อมูลตำแหน่งจาก API
  const fetchPositions = async () => {
    try {
      const res = await fetch('/api/positions');
      const data = await res.json();
      
      if (data.success) {
        setPositions(data.data || []);
      } else {
        console.error('Error fetching positions:', data.message);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  // ดึงข้อมูลระดับตำแหน่งจาก API
  const fetchPositionLevels = async () => {
    try {
      const res = await fetch('/api/position-levels');
      const data = await res.json();
      
      if (data.success) {
        setPositionLevels(data.data || []);
      } else {
        console.error('Error fetching position levels:', data.message);
      }
    } catch (error) {
      console.error('Error fetching position levels:', error);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      // ตรวจสอบสิทธิ์ในการเข้าถึงหน้านี้
      const hasAccess = session.user.role === 'admin' || session.user.role === 'supervisor';
      
      if (!hasAccess) {
        alert('คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้');
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const res = await fetch(`/api/employees/${employeeId}`);
        const result = await res.json();
        
        // รองรับทั้งรูปแบบเก่าและรูปแบบใหม่
        const employee = result.data || result;
        
        if (employee && !result.error) {
          // แปลง hireDate ให้ถูกต้องป้องกัน Invalid time value
          let formattedHireDate = '';
          try {
            if (employee.hireDate) {
              const hireDate = new Date(employee.hireDate);
              formattedHireDate = hireDate.toISOString().split('T')[0];
            }
          } catch (error) {
            console.error('Error formatting hire date:', error);
          }
          
          // แปลง birthDate ให้ถูกต้อง
          let formattedBirthDate = '';
          try {
            if (employee.birthDate) {
              const birthDate = new Date(employee.birthDate);
              formattedBirthDate = birthDate.toISOString().split('T')[0];
            }
          } catch (error) {
            console.error('Error formatting birth date:', error);
          }
          
          setFormData({
            employeeId: employee.employeeId,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            position: employee.position || '',
            positionLevel: employee.positionLevel || '',
            positionTitle: employee.positionTitle || '',
            departmentId: employee.departmentId || '',
            teamId: employee.teamId || '',
            hireDate: formattedHireDate,
            role: employee.role,
            isActive: employee.isActive,
            image: employee.image || '',
            gender: employee.gender || 'male',
            birthDate: formattedBirthDate,
            phoneNumber: employee.phoneNumber || '',
          });
          
          // ตั้งค่าภาพตัวอย่างถ้ามีรูปภาพ
          if (employee.image) {
            setImagePreview(employee.image);
          }
        } else {
          setError(result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน');
        }
      } catch (error) {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    if (session && employeeId) {
      fetchEmployeeData();
    }
  }, [session, employeeId]);

  // อัปเดตชื่อตำแหน่งเมื่อมีการเลือกตำแหน่งและระดับตำแหน่ง
  useEffect(() => {
    if (formData.position && formData.positionLevel && positions.length > 0 && positionLevels.length > 0) {
      const selectedPosition = positions.find(pos => pos.code === formData.position);
      const selectedLevel = positionLevels.find(level => level.code === formData.positionLevel);
      
      if (selectedPosition && selectedLevel) {
        const positionTitle = `${selectedLevel.name} ${selectedPosition.name}`;
        setFormData(prev => ({
          ...prev,
          positionTitle
        }));
      }
    }
  }, [formData.position, formData.positionLevel, positions, positionLevels]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // จัดการการอัปโหลดรูปภาพ
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (JPEG, PNG, GIF, WEBP)');
      return;
    }

    // ตรวจสอบขนาดไฟล์ (6MB)
    const maxSize = 6 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('ขนาดไฟล์ต้องไม่เกิน 6 MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  // ลบรูปภาพที่เลือก
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({
      ...prev,
      image: '',
    }));
  };

  // อัปโหลดรูปภาพไปยัง API
  const uploadImage = async () => {
    if (!imageFile) return formData.image;

    try {
      setUploadingImage(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', imageFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();
      setUploadingImage(false);

      if (data.success) {
        return data.url;
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
        return formData.image;
      }
    } catch (error) {
      setUploadingImage(false);
      setError('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      console.error('Error uploading image:', error);
      return formData.image;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // อัปโหลดรูปภาพถ้ามี
      let imageUrl = formData.image;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const dataToSend = {
        ...formData,
        image: imageUrl,
      };
      
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      const data = await res.json();
      
      // รองรับทั้งรูปแบบเก่าและรูปแบบใหม่
      if (!data.error) {
        setSuccess(data.message || 'อัปเดตข้อมูลพนักงานเรียบร้อยแล้ว');
        setTimeout(() => {
          router.push('/employees');
        }, 2000);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลพนักงาน');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingPage message="กำลังโหลดข้อมูลพนักงาน..." />
      </div>
    );
  }

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'supervisor')) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FiEdit2 className="mr-2 text-purple-600 dark:text-purple-400" /> แก้ไขพนักงาน
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/employees/${employeeId}/change-password`}
            className="btn btn-outline btn-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center justify-center"
          >
            <FiLock className="mr-1.5 h-4 w-4" />
            <span>เปลี่ยนรหัสผ่าน</span>
          </Link>
          <Link
            href="/employees"
            className="btn btn-outline btn-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center justify-center"
          >
            <FiArrowLeft className="mr-1.5 h-4 w-4" />
            <span>กลับ</span>
          </Link>
        </div>
      </div>
      
      {error && <ErrorMessage message={error} type="error" />}
      
      {success && <ErrorMessage message={success} type="success" />}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/30 p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* รูปโปรไฟล์ */}
            <div className="col-span-1 md:col-span-2 flex flex-col items-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-200">รูปโปรไฟล์พนักงาน</h3>
              
              {imagePreview ? (
                <div className="relative w-40 h-40 mb-4">
                  <Image
                    src={imagePreview}
                    alt="รูปโปรไฟล์"
                    fill
                    className="object-cover rounded-full border-4 border-gray-200 dark:border-gray-700"
                    unoptimized={isMockImage(imagePreview)}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full inline-flex items-center justify-center"
                    title="ลบรูปภาพ"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ) : (
                <div className="w-40 h-40 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <FiUser className="w-20 h-20 text-gray-400 dark:text-gray-500" />
                </div>
              )}
              
              <div className="flex items-center justify-center w-full">
                <label className="btn btn-outline border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer inline-flex items-center justify-center">
                  <FiUpload className="mr-1.5 h-4 w-4" />
                  <span>{imageFile ? 'เปลี่ยนรูปภาพ' : 'อัปโหลดรูปภาพ'}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">รองรับไฟล์ JPG, PNG, GIF และ WEBP ขนาดไม่เกิน 6 MB</p>
            </div>
            
            <div>
              <label htmlFor="employeeId" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                รหัสพนักงาน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="employeeId"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                อีเมล <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label htmlFor="firstName" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                ชื่อ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label htmlFor="position" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                ตำแหน่ง <span className="text-red-500">*</span>
              </label>
              <select
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              >
                <option value="">-- เลือกตำแหน่ง --</option>
                {positions.map((position) => (
                  <option key={position.id} value={position.code}>
                    {position.name} ({position.code})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="positionLevel" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                ระดับตำแหน่ง <span className="text-red-500">*</span>
              </label>
              <select
                id="positionLevel"
                name="positionLevel"
                value={formData.positionLevel}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              >
                <option value="">-- เลือกระดับตำแหน่ง --</option>
                {positionLevels.map((level) => (
                  <option key={level.id} value={level.code}>
                    {level.name} ({level.code})
                  </option>
                ))}
              </select>
            </div>
            
            {formData.positionTitle && (
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="positionTitle" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                  ชื่อตำแหน่งที่แสดง
                </label>
                <input
                  type="text"
                  id="positionTitle"
                  name="positionTitle"
                  value={formData.positionTitle}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  สามารถปรับแต่งชื่อตำแหน่งที่แสดงได้ตามต้องการ
                </p>
              </div>
            )}
            
            <div>
              <label htmlFor="gender" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                เพศ <span className="text-red-500">*</span>
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              >
                <option value="male">ชาย</option>
                <option value="female">หญิง</option>
                <option value="other">อื่นๆ</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="birthDate" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                วันเกิด
              </label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div>
              <label htmlFor="phoneNumber" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="0812345678"
                pattern="[0-9]{9,10}"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div>
              <label htmlFor="departmentId" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                แผนก <span className="text-red-500">*</span>
              </label>
              <select
                id="departmentId"
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              >
                <option value="">-- เลือกแผนก --</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="role" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                บทบาท <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
                disabled={isSupervisor && formData.role === 'supervisor'}
              >
                <option value="permanent">พนักงานประจำ</option>
                <option value="temporary">พนักงานชั่วคราว</option>
                {!isSupervisor && (
                  <>
                    <option value="supervisor">หัวหน้างาน</option>
                    <option value="admin">ผู้ดูแลระบบ</option>
                  </>
                )}
                {isSupervisor && formData.role === 'supervisor' && (
                  <option value="supervisor">หัวหน้างาน</option>
                )}
                {isSupervisor && formData.role === 'admin' && (
                  <option value="admin">ผู้ดูแลระบบ</option>
                )}
              </select>
            </div>
            
            <div>
              <label htmlFor="teamId" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                ทีม {isSupervisor && <span className="text-red-500">*</span>}
              </label>
              <select
                id="teamId"
                name="teamId"
                value={formData.teamId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required={isSupervisor}
                disabled={isSupervisor && teams.length === 1}
              >
                <option value="">-- เลือกทีม --</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="hireDate" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                วันที่เริ่มงาน <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="hireDate"
                name="hireDate"
                value={formData.hireDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-gray-700 dark:text-gray-200">
                สถานะการทำงาน (ทำงานอยู่)
              </label>
            </div>
          </div>
          
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <LoadingButton
              type="submit"
              loading={submitting || uploadingImage}
              className="btn btn-primary w-full inline-flex items-center justify-center text-white"
            >
              <FiSave className="mr-1.5 h-4 w-4" />
              <span>{submitting || uploadingImage ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
} 