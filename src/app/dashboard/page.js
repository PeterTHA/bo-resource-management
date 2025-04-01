'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { TeamMembersCard } from '@/components/dashboard/TeamMembersCard';
import { LeaveSummaryCard } from '@/components/dashboard/LeaveSummaryCard';
import { OvertimeSummaryCard } from '@/components/dashboard/OvertimeSummaryCard';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { 
  FiUserPlus, 
  FiCalendar, 
  FiClock, 
  FiUser, 
  FiFileText, 
  FiSettings 
} from 'react-icons/fi';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const userSession = await getSession();
        if (!userSession) {
          return redirect('/login');
        }
        setSession(userSession);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="flex-1 space-y-5 p-6 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">แดชบอร์ด</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-1 lg:grid-cols-6">
        <div className="col-span-6 lg:col-span-2">
          <div className="grid gap-5">
            <TeamMembersCard />
          </div>
        </div>
        <div className="col-span-6 lg:col-span-4">
          <div className="grid gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <LeaveSummaryCard />
              <OvertimeSummaryCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
