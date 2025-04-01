'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export function TeamMembersCard() {
  const [teamMembers, setTeamMembers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch('/api/team-members');
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message);
        }
        
        setTeamMembers(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  const getWorkStatusColor = (status) => {
    switch (status) {
      case 'OFFICE':
        return 'bg-green-500';
      case 'WFH':
        return 'bg-blue-500';
      case 'MIXED':
        return 'bg-yellow-500';
      case 'OUTSIDE':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getWorkStatusText = (status) => {
    switch (status) {
      case 'OFFICE':
        return 'ทำงานที่ออฟฟิศ';
      case 'WFH':
        return 'ทำงานที่บ้าน';
      case 'MIXED':
        return 'ทำงานผสม';
      case 'OUTSIDE':
        return 'ทำงานนอกสถานที่';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="สมาชิกในทีม" />
        <CardContent className="p-5 pt-0">
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="สมาชิกในทีม" />
        <CardContent className="p-5 pt-0">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="สมาชิกในทีม" />
      <CardContent className="p-5 pt-0">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center space-x-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex-shrink-0">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={`${member.firstName} ${member.lastName}`}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <span className="text-sm font-medium text-muted-foreground">
                        {member.firstName[0]}{member.lastName[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="truncate text-sm font-medium">
                      {member.firstName} {member.lastName}
                    </h3>
                    {member.workStatuses[0] && (
                      <Badge className={`${getWorkStatusColor(member.workStatuses[0].status)} px-2 py-0.5 text-xs`}>
                        {getWorkStatusText(member.workStatuses[0].status)}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1">
                    <p className="truncate text-sm text-muted-foreground">
                      {member.positionTitle}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.department} • {member.teamName}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 