'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { LoadingPage } from '../components/ui/LoadingSpinner';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingPage message="กำลังนำทางไปยังหน้าที่เหมาะสม..." />
    </div>
  );
}
