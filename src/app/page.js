'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { LoadingPage } from '../components/ui/LoadingSpinner';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (isRedirecting) return;
    
    setIsRedirecting(true);
    
    console.log('หน้าแรก: สถานะ session =', status, 'กำลังเปลี่ยนเส้นทาง...');
    
    const targetPath = session ? '/dashboard' : '/login';
    
    setTimeout(() => {
      console.log(`หน้าแรก: กำลังนำทางไปยัง ${targetPath}`);
      router.push(targetPath);
    }, 100);
    
  }, [session, status, router, isRedirecting]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingPage message="กำลังนำทางไปยังหน้าที่เหมาะสม..." />
    </div>
  );
}
