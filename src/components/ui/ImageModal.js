'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiX } from 'react-icons/fi';

// เพิ่มฟังก์ชันตรวจสอบว่าเป็นรูปภาพจาก mock-images หรือไม่
const isMockImage = (src) => {
  return src && typeof src === 'string' && (src.startsWith('/mock-images/') || src.startsWith('./mock-images/'));
};

export default function ImageModal({ isOpen, onClose, imageSrc, alt }) {
  // เพิ่ม CSS ที่ป้องกันการเลื่อนของ body เมื่อเปิด modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup เมื่อ component unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ปิด Modal เมื่อกดปุ่ม ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative max-w-screen-lg max-h-screen overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-2 top-2 p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 z-10"
          onClick={onClose}
        >
          <FiX size={20} />
        </button>
        <div className="bg-white p-1 rounded shadow-lg">
          <div className="relative">
            <Image
              src={imageSrc}
              alt={alt || "รูปภาพ"}
              width={800}
              height={600}
              className="max-h-[80vh] w-auto object-contain rounded"
              unoptimized={isMockImage(imageSrc)}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 