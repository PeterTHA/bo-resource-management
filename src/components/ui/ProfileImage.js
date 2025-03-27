'use client';

import { useState } from 'react';
import Image from 'next/image';
import ImageModal from './ImageModal';

// เพิ่มฟังก์ชันตรวจสอบว่าเป็นรูปภาพจาก mock-images หรือไม่
const isMockImage = (src) => {
  return src && typeof src === 'string' && (src.startsWith('/mock-images/') || src.startsWith('./mock-images/'));
};

export default function ProfileImage({ 
  src, 
  alt, 
  size = 'md', 
  className = '',
  fallbackText = '',
  clickable = true,
  withBorder = true
}) {
  const [showModal, setShowModal] = useState(false);
  
  // กำหนดขนาดต่างๆ
  const sizeClasses = {
    xs: 'w-8 h-8 text-xs',
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-base',
    lg: 'w-24 h-24 text-xl',
    xl: 'w-32 h-32 text-2xl',
  };
  
  // สร้าง initials จากชื่อที่ส่งมา
  const getInitials = () => {
    if (!fallbackText) return '';
    
    const parts = fallbackText.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`;
    }
    return fallbackText.charAt(0);
  };
  
  const borderClass = withBorder ? 'ring ring-primary ring-offset-base-100 ring-offset-2' : '';
  
  return (
    <>
      {src ? (
        <div 
          className={`relative ${sizeClasses[size]} rounded-full overflow-hidden ${borderClass} ${className} ${clickable ? 'cursor-pointer transition-transform hover:scale-105' : ''}`}
          onClick={clickable ? () => setShowModal(true) : undefined}
        >
          <Image
            src={src}
            alt={alt || 'รูปโปรไฟล์'}
            fill
            sizes={`(max-width: 768px) ${parseInt(sizeClasses[size])}px, ${parseInt(sizeClasses[size])}px`}
            className="object-cover"
            unoptimized={isMockImage(src)}
          />
        </div>
      ) : (
        <div 
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center bg-primary text-primary-content font-semibold ${borderClass} ${className}`}
        >
          {getInitials()}
        </div>
      )}
      
      <ImageModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        imageSrc={src}
        alt={alt}
      />
    </>
  );
} 