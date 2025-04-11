'use client';

import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

export default function AddMemberDialog({
  open,
  onOpenChange,
  selectedProject,
  employees,
  teams,
  onAddMember,
}) {
  const [searchMember, setSearchMember] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [loadingEmployeeId, setLoadingEmployeeId] = useState(null);

  const handleAddMember = async (employeeId) => {
    if (!selectedProject) return;
    
    // ตรวจสอบว่าพนักงานอยู่ในโปรเจคแล้วหรือไม่
    const isAlreadyMember = selectedProject.members?.some(member => member.employeeId === employeeId);
    if (isAlreadyMember) {
      toast.error('พนักงานนี้เป็นสมาชิกในโปรเจคอยู่แล้ว');
      return;
    }
    
    try {
      setAddMemberLoading(true);
      setLoadingEmployeeId(employeeId);
      await onAddMember(employeeId);
      setSearchMember('');
    } catch (err) {
      console.error('Error adding member:', err);
    } finally {
      setAddMemberLoading(false);
      setLoadingEmployeeId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>เพิ่มสมาชิก</DialogTitle>
          <DialogDescription>
            เลือกพนักงานที่ต้องการเพิ่มเป็นสมาชิกในโปรเจค
          </DialogDescription>
        </DialogHeader>
        
        <Command className="rounded-lg border shadow-md">
          <CommandInput 
            placeholder="ค้นหาพนักงาน..." 
            value={searchMember}
            onValueChange={setSearchMember}
          />
          <CommandList>
            <CommandEmpty>ไม่พบพนักงานที่ค้นหา</CommandEmpty>
            {teams.map(team => {
              // กรองพนักงานตามทีม
              const teamEmployees = employees
                .filter(emp => 
                  emp.team?.id === team.id && 
                  (!selectedProject || !selectedProject.members?.some(m => m.employeeId === emp.id)) &&
                  (emp.firstName?.toLowerCase().includes(searchMember.toLowerCase()) || 
                   emp.lastName?.toLowerCase().includes(searchMember.toLowerCase()))
                );
              
              // แสดงเฉพาะทีมที่มีพนักงาน
              if (teamEmployees.length === 0) return null;
              
              return (
                <CommandGroup key={team.id} heading={team.name}>
                  {teamEmployees.map(employee => (
                    <CommandItem 
                      key={employee.id}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={employee.image} 
                              alt={`${employee.firstName} ${employee.lastName}`} 
                            />
                            <AvatarFallback>
                              {employee.firstName?.charAt(0)}
                              {employee.lastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p>{employee.firstName} {employee.lastName}</p>
                            <p className="text-sm text-gray-500">
                              {employee.position || 'ไม่ระบุตำแหน่ง'}
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddMember(employee.id);
                          }}
                          disabled={addMemberLoading && loadingEmployeeId === employee.id}
                        >
                          {addMemberLoading && loadingEmployeeId === employee.id ? (
                            <div className="w-4 h-4 mr-2">
                              <Skeleton className="h-4 w-4 rounded-full" />
                            </div>
                          ) : (
                            <FiPlus className="mr-1" />
                          )}
                          เพิ่ม
                        </Button>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
            
            {/* พนักงานที่ไม่อยู่ในทีมใด */}
            {(() => {
              const noTeamEmployees = employees
                .filter(emp => 
                  !emp.team?.id && 
                  (!selectedProject || !selectedProject.members?.some(m => m.employeeId === emp.id)) &&
                  (emp.firstName?.toLowerCase().includes(searchMember.toLowerCase()) || 
                   emp.lastName?.toLowerCase().includes(searchMember.toLowerCase()))
                );
              
              if (noTeamEmployees.length === 0) return null;
              
              return (
                <CommandGroup heading="ไม่มีทีม">
                  {noTeamEmployees.map(employee => (
                    <CommandItem 
                      key={employee.id}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={employee.image} 
                              alt={`${employee.firstName} ${employee.lastName}`} 
                            />
                            <AvatarFallback>
                              {employee.firstName?.charAt(0)}
                              {employee.lastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p>{employee.firstName} {employee.lastName}</p>
                            <p className="text-sm text-gray-500">
                              {employee.position || 'ไม่ระบุตำแหน่ง'}
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddMember(employee.id);
                          }}
                          disabled={addMemberLoading && loadingEmployeeId === employee.id}
                        >
                          {addMemberLoading && loadingEmployeeId === employee.id ? (
                            <div className="w-4 h-4 mr-2">
                              <Skeleton className="h-4 w-4 rounded-full" />
                            </div>
                          ) : (
                            <FiPlus className="mr-1" />
                          )}
                          เพิ่ม
                        </Button>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })()}
          </CommandList>
        </Command>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            onOpenChange(false);
            setSearchMember('');
          }}>
            ปิด
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 