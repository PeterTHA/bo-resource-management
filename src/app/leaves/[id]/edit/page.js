'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiSave, FiArrowLeft, FiUpload, FiX, FiCalendar, FiClock, FiFileText, FiUser, FiInfo, FiPaperclip, FiDownload } from 'react-icons/fi';
import { LoadingPage, LoadingButton } from '../../../../components/ui/LoadingSpinner';
import ErrorMessage from '../../../../components/ui/ErrorMessage';

// เช็คว่าเป็นไฟล์รูปภาพหรือไม่
const isImageFile = (fileName) => {
  if (!fileName) return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return imageExtensions.includes(extension);
};

export default function EditLeavePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [leave, setLeave] = useState(null);
  const [formData, setFormData] = useState({
    employee: '',
    leaveType: 'ลาป่วย',
    startDate: '',
    endDate: '',
    leaveFormat: 'เต็มวัน',
    reason: '',
  });
  const [attachments, setAttachments] = useState([]);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [totalDays, setTotalDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // ดึงข้อมูลการลาที่ต้องการแก้ไข
  useEffect(() => {
    const fetchLeaveDetails = async () => {
      if (!params?.id || !session) return;

      try {
        setLoading(true);
        const res = await fetch(`/api/leaves/${params.id}`);
        const data = await res.json();

        if (data.success) {
          const leaveData = data.data;
          setLeave(leaveData);
          
          // ถ้าผู้ใช้ไม่ใช่เจ้าของหรือไม่ใช่แอดมิน หรือการลาไม่ได้อยู่ในสถานะรออนุมัติ ให้ redirect ไปหน้ารายละเอียด
          if ((session.user.id !== leaveData.employeeId && session.user.role !== 'admin') || leaveData.status !== 'รออนุมัติ') {
            router.push(`/leaves/${params.id}`);
            return;
          }

          // กำหนดค่าเริ่มต้นให้ฟอร์ม
          setFormData({
            employee: leaveData.employeeId,
            leaveType: leaveData.leaveType,
            startDate: new Date(leaveData.startDate).toISOString().split('T')[0],
            endDate: new Date(leaveData.endDate).toISOString().split('T')[0],
            leaveFormat: leaveData.leaveFormat,
            reason: leaveData.reason,
          });
          
          // กำหนดไฟล์แนบ
          if (leaveData.attachments && leaveData.attachments.length > 0) {
            setAttachments(leaveData.attachments.map(url => ({ url, name: url.split('/').pop() })));
          }
          
          // คำนวณจำนวนวันลา
          setTotalDays(leaveData.totalDays);
        } else {
          setError(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลการลา');
        }
      } catch (error) {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveDetails();
  }, [params?.id, session, router]);

  // คำนวณจำนวนวันลา
  const calculateDays = useCallback(() => {
    if (!formData.startDate || !formData.endDate) {
      setTotalDays(0);
      return;
    }
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    // ต้องตรวจสอบว่าวันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด
    if (start > end) {
      setError('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด');
      setTotalDays(0);
      return;
    }
    
    // คำนวณจำนวนวันลาตามรูปแบบการลา
    if (formData.leaveFormat.includes('ครึ่งวัน')) {
      setTotalDays(0.5);
    } else {
      // คำนวณจำนวนวัน (รวมวันเริ่มต้นและวันสิ้นสุด)
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setTotalDays(diffDays);
    }
  }, [formData.startDate, formData.endDate, formData.leaveFormat]);

  useEffect(() => {
    calculateDays();
  }, [formData.startDate, formData.endDate, formData.leaveFormat, calculateDays]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // รีเซ็ตข้อความแสดงข้อผิดพลาด
    setError('');
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFilesToUpload(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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
      setSubmitting(true);
      setError('');
      setSuccess('');
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
        setError('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }
      
      // คำนวณจำนวนวันลา
      calculateDays();
      
      // อัปโหลดไฟล์ (ถ้ามี)
      let uploadedFileUrls = [];
      if (filesToUpload.length > 0) {
        try {
          uploadedFileUrls = await uploadFiles();
        } catch (error) {
          setError(`การอัปโหลดไฟล์ไม่สำเร็จ: ${error.message}`);
          return;
        }
      }
      
      // รวมรายการไฟล์ทั้งหมด (ไฟล์เดิมและไฟล์ใหม่)
      const allAttachments = [
        ...attachments.map(att => att.url),
        ...uploadedFileUrls
      ];
      
      // ส่งข้อมูลไปบันทึก
      const response = await fetch(`/api/leaves/${params.id}`, {
        method: 'PUT',
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
          attachments: allAttachments,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess('บันทึกข้อมูลการลาเรียบร้อยแล้ว');
        
        // รอสักครู่แล้วนำทางไปหน้ารายละเอียดการลา
        setTimeout(() => {
          router.push(`/leaves/${params.id}`);
        }, 1500);
      } else {
        setError(result.message || 'บันทึกข้อมูลไม่สำเร็จ');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return <LoadingPage message="กำลังโหลดข้อมูล..." />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FiCalendar className="mr-2 text-primary" /> แก้ไขการลางาน
        </h1>
        <Link
          href={`/leaves/${params.id}`}
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
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingPage message="กำลังโหลดข้อมูล..." />
            </div>
          ) : (
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
                    required
                    className="input input-bordered w-full cursor-pointer"
                    onClick={(e) => e.target.showPicker()}
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
                    onChange={handleInputChange}
                    required
                    className="input input-bordered w-full cursor-pointer"
                    min={formData.startDate}
                    disabled={formData.leaveFormat.includes('ครึ่งวัน')}
                    onClick={(e) => !formData.leaveFormat.includes('ครึ่งวัน') && e.target.showPicker()}
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
                    onChange={handleInputChange}
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

                  {attachments.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold mb-2">ไฟล์แนบที่มีอยู่ ({attachments.length})</h3>
                      <div className="rounded-lg bg-base-200 p-4 space-y-2">
                        {attachments.map((attachment, index) => (
                          <div key={index} className="flex justify-between items-center p-2 rounded-md bg-base-100">
                            <div className="text-sm truncate">{attachment.name}</div>
                            <div className="flex items-center gap-2">
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost btn-xs text-primary"
                                title="ดาวน์โหลด"
                                download
                              >
                                <FiDownload size={16} />
                              </a>
                              <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="btn btn-ghost btn-xs text-error"
                                title="ลบ"
                              >
                                <FiX size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                  disabled={submitting || uploading}
                >
                  {(submitting || uploading) ? (
                    <LoadingButton loading={true} />
                  ) : (
                    <>
                      <FiSave className="mr-2" />
                      <span>บันทึกข้อมูล</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 