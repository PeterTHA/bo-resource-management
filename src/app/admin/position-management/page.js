'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiLayers, FiPlus, FiArrowLeft, FiRefreshCw, FiEdit, FiTrash2, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import Link from 'next/link';

export default function PositionManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [positions, setPositions] = useState([]);
  const [positionLevels, setPositionLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [session, router]);

  // โหลดข้อมูลตำแหน่งและระดับตำแหน่ง
  useEffect(() => {
    const fetchPositionData = async () => {
      if (session) {
        try {
          setLoading(true);
          const res = await fetch('/api/seed-positions');
          
          if (!res.ok) {
            const errorData = await res.json();
            setError(errorData.message || 'ไม่สามารถโหลดข้อมูลตำแหน่งได้');
            return;
          }
          
          const data = await res.json();
          
          if (data.success) {
            setPositions(data.data.positions || []);
            setPositionLevels(data.data.positionLevels || []);
          } else {
            setError(data.message || 'ไม่สามารถโหลดข้อมูลตำแหน่งได้');
          }
        } catch (error) {
          console.error('Error fetching position data:', error);
          setError('เกิดข้อผิดพลาดในการโหลดข้อมูลตำแหน่ง');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchPositionData();
  }, [session]);

  // ฟังก์ชันสำหรับเพิ่มข้อมูลตำแหน่งเริ่มต้น
  const handleSeedPositions = async () => {
    try {
      setSeedLoading(true);
      setError('');
      setSuccessMessage('');
      
      const res = await fetch('/api/seed-positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccessMessage(data.message || 'เพิ่มข้อมูลตำแหน่งเรียบร้อยแล้ว');
        // โหลดข้อมูลตำแหน่งใหม่
        const resGet = await fetch('/api/seed-positions');
        const dataGet = await resGet.json();
        
        if (dataGet.success) {
          setPositions(dataGet.data.positions || []);
          setPositionLevels(dataGet.data.positionLevels || []);
        }
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลตำแหน่ง');
      }
    } catch (error) {
      console.error('Error seeding positions:', error);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setSeedLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-lg text-gray-600 dark:text-gray-300">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (session?.user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
          <p>คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้</p>
          <Link href="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
            กลับไปยังหน้าแดชบอร์ด
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FiLayers className="mr-2 text-green-600 dark:text-green-400" /> จัดการตำแหน่ง
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={handleSeedPositions}
            className="btn bg-green-600 hover:bg-green-700 text-white flex items-center"
            disabled={seedLoading}
          >
            {seedLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            ) : (
              <FiRefreshCw className="mr-2" />
            )}
            เพิ่มข้อมูลตำแหน่งเริ่มต้น
          </button>
          <Link 
            href="/admin"
            className="btn btn-outline border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
          >
            <FiArrowLeft className="mr-2" />
            กลับ
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-800/50 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4">
          <p>{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                ตำแหน่ง
              </h2>
            </div>
            <div className="p-6">
              {positions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">รหัส</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">ชื่อ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">หมวดหมู่</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {positions.map((position) => (
                        <tr key={position.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{position.code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{position.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{position.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1">
                                <FiEdit className="h-5 w-5" />
                              </button>
                              <button className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1">
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
                  <p className="text-gray-600 dark:text-gray-400">ไม่พบข้อมูลตำแหน่ง</p>
                  <button
                    onClick={handleSeedPositions}
                    className="mt-2 btn bg-green-600 hover:bg-green-700 text-white"
                    disabled={seedLoading}
                  >
                    {seedLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    ) : (
                      <FiPlus className="mr-1" />
                    )}
                    เพิ่มข้อมูลเริ่มต้น
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                ระดับตำแหน่ง
              </h2>
            </div>
            <div className="p-6">
              {positionLevels.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">รหัส</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">ชื่อ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">ระดับ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {positionLevels.map((level) => (
                        <tr key={level.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{level.code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{level.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{level.level}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1">
                                <FiEdit className="h-5 w-5" />
                              </button>
                              <button className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1">
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
                  <p className="text-gray-600 dark:text-gray-400">ไม่พบข้อมูลระดับตำแหน่ง</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 