'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiSave, FiArrowLeft, FiUpload, FiX, FiCalendar, FiClock, FiFileText, FiUser, FiInfo, FiPaperclip } from 'react-icons/fi';
import { LoadingSpinner, LoadingPage } from '../../../components/ui/LoadingSpinner';
import ErrorMessage from '../../../components/ui/ErrorMessage';

export default function AddLeavePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    leaveType: 'ลาป่วย',
    startDate: '',
    endDate: '',
    leaveFormat: 'เต็มวัน', // รูปแบบการลา: เต็มวัน, ครึ่งวัน-เช้า, ครึ่งวัน-บ่าย
    reason: '',
  });
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [totalDays, setTotalDays] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // คำนวณจำนวนวันลาทั้งหมด
  const calculateTotalDays = useCallback(() => {
    if (!formData.startDate || !formData.endDate) return 0;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    // ถ้าวันที่สิ้นสุดน้อยกว่าวันที่เริ่ม ไม่คำนวณ
    if (end < start) return 0;
    
    // คำนวณจำนวนวัน
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // รวมวันเริ่มต้นและวันสิ้นสุด
    
    // ถ้าเป็นการลาครึ่งวัน
    if (formData.leaveFormat.includes('ครึ่งวัน')) {
      // กรณีลาครึ่งวันแต่กรอกหลายวัน ให้แสดงเฉพาะ 0.5 วัน
      return start.getTime() === end.getTime() ? 0.5 : diffDays;
    }
    
    return diffDays;
  }, [formData.startDate, formData.endDate, formData.leaveFormat]);

  useEffect(() => {
    setTotalDays(calculateTotalDays());
  }, [formData.startDate, formData.endDate, formData.leaveFormat, calculateTotalDays]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // ถ้าเปลี่ยนเป็นการลาครึ่งวัน ให้กำหนดวันสิ้นสุดเป็นวันเดียวกับวันเริ่มต้น
    if (name === 'leaveFormat' && value.includes('ครึ่งวัน') && formData.startDate) {
      setFormData((prev) => ({
        ...prev,
        endDate: prev.startDate,
      }));
    }
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFilesToUpload(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (filesToUpload.length === 0) return [];
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('type', 'leave');
      
      // เพิ่มไฟล์ทั้งหมดที่ต้องการอัปโหลด
      filesToUpload.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'อัปโหลดไฟล์ไม่สำเร็จ');
      }
      
      return result.files.map(file => file.url);
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
        setError('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }
      
      // คำนวณจำนวนวันลา
      calculateTotalDays();
      
      // อัปโหลดไฟล์ (ถ้ามี)
      let attachments = [];
      if (filesToUpload.length > 0) {
        try {
          attachments = await uploadFiles();
        } catch (error) {
          setError(`การอัปโหลดไฟล์ไม่สำเร็จ: ${error.message}`);
          return;
        }
      }
      
      // ส่งข้อมูลไปบันทึก
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaveType: formData.leaveType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          leaveFormat: formData.leaveFormat,
          totalDays: totalDays,
          attachments: attachments,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('บันทึกข้อมูลการลาเรียบร้อยแล้ว');
        // กลับไปที่หน้ารายการการลาหลังจาก 2 วินาที
        setTimeout(() => {
          router.push('/leaves');
        }, 2000);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลการลา');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-4">
        <LoadingPage message="กำลังโหลด..." />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FiCalendar className="mr-2 text-primary" /> ขอลางาน
        </h1>
        <Link
          href="/leaves"
          className="btn btn-outline btn-sm"
        >
          <FiArrowLeft className="mr-1.5" />
          <span>กลับ</span>
        </Link>
      </div>
      
      {error && <ErrorMessage message={error} />}
      {success && (
        <div className="alert alert-success mb-4">
          <FiInfo size={20} />
          <span>{success}</span>
        </div>
      )}
      
      <div className="card bg-base-100 shadow-xl overflow-hidden">
        <div className="card-body p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center text-base">
                    <FiInfo className="mr-2" />
                    ประเภทการลา
                  </span>
                </label>
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleChange}
                  required
                  className="select select-bordered w-full"
                >
                  <option value="ลาป่วย">ลาป่วย</option>
                  <option value="ลากิจ">ลากิจ</option>
                  <option value="ลาพักร้อน">ลาพักร้อน</option>
                  <option value="ลาคลอด">ลาคลอด</option>
                  <option value="ลาบวช">ลาบวช</option>
                  <option value="ลาไม่รับเงินเดือน">ลาไม่รับเงินเดือน</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center text-base">
                    <FiClock className="mr-2" />
                    รูปแบบการลา
                  </span>
                </label>
                <select
                  name="leaveFormat"
                  value={formData.leaveFormat}
                  onChange={handleChange}
                  required
                  className="select select-bordered w-full"
                >
                  <option value="เต็มวัน">เต็มวัน</option>
                  <option value="ครึ่งวัน-เช้า">ครึ่งวัน (เช้า)</option>
                  <option value="ครึ่งวัน-บ่าย">ครึ่งวัน (บ่าย)</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center text-base">
                    <FiCalendar className="mr-2" />
                    วันที่เริ่มต้น
                  </span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="input input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center text-base">
                    <FiCalendar className="mr-2" />
                    วันที่สิ้นสุด
                  </span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="input input-bordered w-full"
                  min={formData.startDate}
                  disabled={formData.leaveFormat.includes('ครึ่งวัน')}
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text flex items-center text-base">
                    <FiFileText className="mr-2" />
                    เหตุผลการลา
                  </span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  className="textarea textarea-bordered w-full"
                  rows="3"
                ></textarea>
              </div>

              <div className="md:col-span-2">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center text-base">
                      <FiPaperclip className="mr-2" />
                      เอกสารแนบ (ถ้ามี)
                    </span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <label className="btn btn-outline btn-sm">
                      <FiUpload className="mr-2" />
                      <span>เลือกไฟล์</span>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        multiple
                      />
                    </label>
                    <span className="text-sm text-gray-500">รองรับไฟล์ PDF, รูปภาพ, เอกสาร (.zip ไม่เกิน 5MB/ไฟล์)</span>
                  </div>
                </div>

                {filesToUpload.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">ไฟล์ที่เลือก ({filesToUpload.length})</h3>
                    <div className="rounded-lg bg-base-200 p-4 space-y-2">
                      {filesToUpload.map((file, index) => (
                        <div key={index} className="flex justify-between items-center p-2 rounded-md bg-base-100">
                          <div className="text-sm truncate">{file.name} ({(file.size / 1024).toFixed(1)} KB)</div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="btn btn-ghost btn-xs text-error"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 bg-base-200 rounded-lg p-4">
              <div className="font-semibold mb-1">จำนวนวันลาทั้งหมด: {totalDays} วัน</div>
              <div className="text-sm">หมายเหตุ: การนับวันลาจะนับทั้งวันเริ่มต้นและวันสิ้นสุด</div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                className="btn btn-primary w-full md:w-auto min-w-[200px]"
                disabled={loading || uploading}
              >
                {(loading || uploading) ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FiSave className="mr-2" />
                    <span>บันทึกข้อมูล</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 