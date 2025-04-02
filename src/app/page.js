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
    if (status === "loading") return;
    
    let targetPath = '/login';
    
    if (status === "authenticated") {
      targetPath = '/dashboard';
    }
    
    router.replace(targetPath);
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingPage message="กำลังนำทางไปยังหน้าที่เหมาะสม..." />
    </div>
  );
}
