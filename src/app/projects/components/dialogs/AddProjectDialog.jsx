'use client';

import { useState } from 'react';
import { FiPlus, FiAlertCircle, FiSearch, FiX, FiCheck, FiUser, FiFile, FiFileText, FiImage, FiArchive, FiPaperclip } from 'react-icons/fi';
import { BsFiletypePdf, BsFiletypeDocx, BsFiletypeXlsx, BsFiletypePpt, BsFiletypeCsv } from 'react-icons/bs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export default function AddProjectDialog({
  open,
  onOpenChange,
  isSaving,
  onAddProject,
  employees = [],
}) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    startDate: new Date(),
    endDate: null,
    priority: 'medium',
    status: 'active',
    members: [],
    jira_url: '',
    confluence_url: '',
    attachments: []
  });

  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('project');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date,
    });
  };

  // ฟังก์ชันจัดการเลือกสมาชิก
  const handleSelectMember = (employee) => {
    const isSelected = formData.members.some(member => member.id === employee.id);
    
    if (isSelected) {
      // ลบสมาชิกที่เลือกแล้ว
      setFormData({
        ...formData,
        members: formData.members.filter(member => member.id !== employee.id)
      });
    } else {
      // เพิ่มสมาชิกใหม่
      setFormData({
        ...formData,
        members: [...formData.members, employee]
      });
    }
  };

  const handleRemoveMember = (employeeId) => {
    setFormData({
      ...formData,
      members: formData.members.filter(member => member.id !== employeeId)
    });
  };

  // กรองรายชื่อพนักงานตามคำค้นหา
  const filteredEmployees = employees.filter(employee => {
    const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
    const position = employee.position_title ? employee.position_title.toLowerCase() : '';
    const searchTermLower = searchTerm.toLowerCase();
    
    return fullName.includes(searchTermLower) || 
           position.includes(searchTermLower) ||
           employee.email?.toLowerCase().includes(searchTermLower);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!formData.name || !formData.code) {
      setError('กรุณากรอกชื่อโปรเจคและรหัสโปรเจค');
      return;
    }

    // ตรวจสอบวันที่สิ้นสุดต้องมากกว่าวันที่เริ่ม
    if (formData.endDate && formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('วันที่สิ้นสุดต้องมากกว่าวันที่เริ่ม');
      return;
    }

    // ปรับแต่งข้อมูลให้ส่งสมาชิกโปรเจคไปด้วย
    const projectData = {
      ...formData,
      members: formData.members.map(member => ({
        employeeId: member.id,
        roleId: '1' // ค่าเริ่มต้นเป็น member
      }))
    };

    // เรียกใช้ฟังก์ชันเพิ่มโปรเจค
    const result = await onAddProject(projectData);

    // ถ้าสำเร็จให้รีเซ็ตฟอร์ม
    if (result && result.success) {
      setFormData({
        name: '',
        code: '',
        description: '',
        startDate: new Date(),
        endDate: null,
        priority: 'medium',
        status: 'active',
        members: [],
        jira_url: '',
        confluence_url: '',
        attachments: []
      });
      setActiveTab('project');
    }
  };

  // ฟังก์ชันแสดงไอคอนและสีตามประเภทไฟล์
  const getFileTypeDisplay = (fileType) => {
    const type = fileType.split('/')[1] || fileType;
    
    // กำหนดสีและป้ายกำกับตามประเภทไฟล์
    const fileTypes = {
      // เอกสาร
      'pdf': { label: 'PDF', color: 'bg-red-100 text-red-700', icon: <BsFiletypePdf className="h-5 w-5 text-red-600" /> },
      'vnd.openxmlformats-officedocument.spreadsheetml.sheet': { label: 'XLSX', color: 'bg-green-100 text-green-700', icon: <BsFiletypeXlsx className="h-5 w-5 text-green-600" /> },
      'vnd.ms-excel': { label: 'XLS', color: 'bg-green-100 text-green-700', icon: <BsFiletypeXlsx className="h-5 w-5 text-green-600" /> },
      'vnd.openxmlformats-officedocument.wordprocessingml.document': { label: 'DOCX', color: 'bg-blue-100 text-blue-700', icon: <BsFiletypeDocx className="h-5 w-5 text-blue-600" /> },
      'msword': { label: 'DOC', color: 'bg-blue-100 text-blue-700', icon: <BsFiletypeDocx className="h-5 w-5 text-blue-600" /> },
      'vnd.openxmlformats-officedocument.presentationml.presentation': { label: 'PPTX', color: 'bg-orange-100 text-orange-700', icon: <BsFiletypePpt className="h-5 w-5 text-orange-600" /> },
      'vnd.ms-powerpoint': { label: 'PPT', color: 'bg-orange-100 text-orange-700', icon: <BsFiletypePpt className="h-5 w-5 text-orange-600" /> },
      'csv': { label: 'CSV', color: 'bg-blue-100 text-blue-700', icon: <BsFiletypeCsv className="h-5 w-5 text-blue-600" /> },
      
      // รูปภาพ
      'jpeg': { label: 'JPEG', color: 'bg-purple-100 text-purple-700', icon: <FiImage className="h-5 w-5 text-purple-600" /> },
      'jpg': { label: 'JPG', color: 'bg-purple-100 text-purple-700', icon: <FiImage className="h-5 w-5 text-purple-600" /> },
      'png': { label: 'PNG', color: 'bg-purple-100 text-purple-700', icon: <FiImage className="h-5 w-5 text-purple-600" /> },
      'gif': { label: 'GIF', color: 'bg-purple-100 text-purple-700', icon: <FiImage className="h-5 w-5 text-purple-600" /> },
      'svg+xml': { label: 'SVG', color: 'bg-purple-100 text-purple-700', icon: <FiImage className="h-5 w-5 text-purple-600" /> },
      
      // ซิป
      'zip': { label: 'ZIP', color: 'bg-yellow-100 text-yellow-700', icon: <FiArchive className="h-5 w-5 text-yellow-600" /> },
      'x-zip-compressed': { label: 'ZIP', color: 'bg-yellow-100 text-yellow-700', icon: <FiArchive className="h-5 w-5 text-yellow-600" /> },
      'rar': { label: 'RAR', color: 'bg-yellow-100 text-yellow-700', icon: <FiArchive className="h-5 w-5 text-yellow-600" /> },
      'x-rar-compressed': { label: 'RAR', color: 'bg-yellow-100 text-yellow-700', icon: <FiArchive className="h-5 w-5 text-yellow-600" /> },
      
      // ค่าเริ่มต้น
      'default': { label: type.toUpperCase().substring(0, 4), color: 'bg-gray-100 text-gray-700', icon: <FiFileText className="h-5 w-5 text-gray-600" /> }
    };
    
    return fileTypes[type] || fileTypes['default'];
  };
  
  // ฟังก์ชันแสดงขนาดไฟล์ในรูปแบบที่อ่านง่าย
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };
  
  // ฟังก์ชันแสดงชื่อไฟล์แบบย่อตรงกลาง
  const formatFileName = (fileName) => {
    if (fileName.length <= 25) return fileName;
    
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) return fileName.substring(0, 22) + '...';
    
    const extension = fileName.substring(lastDotIndex);
    const baseName = fileName.substring(0, lastDotIndex);
    
    if (baseName.length <= 18) return fileName;
    
    return baseName.substring(0, 15) + '...' + extension;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>เพิ่มโปรเจคใหม่</DialogTitle>
          <DialogDescription>กรอกข้อมูลโปรเจคที่ต้องการสร้าง</DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 mb-4 border-b">
          <Button
            variant={activeTab === 'project' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('project')}
            className="rounded-none rounded-t-lg"
          >
            ข้อมูลโปรเจค
          </Button>
          <Button
            variant={activeTab === 'members' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('members')}
            className="rounded-none rounded-t-lg"
          >
            สมาชิกโปรเจค {formData.members.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {formData.members.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'attachments' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('attachments')}
            className="rounded-none rounded-t-lg"
          >
            ไฟล์แนบ {formData.attachments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {formData.attachments.length}
              </Badge>
            )}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded-md mb-4 flex items-center gap-2">
              <FiAlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex-1 overflow-auto pr-1">
            {activeTab === 'project' && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="projectCode" className="text-right">
                    รหัสโปรเจค <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="projectCode"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="รหัสโปรเจค เช่น PRJ001"
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="projectName" className="text-right">
                    ชื่อโปรเจค <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="projectName"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="ชื่อโปรเจค"
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">
                    รายละเอียด
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="รายละเอียดเพิ่มเติม"
                    className="col-span-3"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    วันที่เริ่ม <span className="text-red-500">*</span>
                  </Label>
                  <div className="col-span-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          {formData.startDate ? (
                            format(formData.startDate, 'dd MMMM yyyy', { locale: th })
                          ) : (
                            <span className="text-muted-foreground">เลือกวันที่เริ่ม</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.startDate}
                          onSelect={(date) => handleDateChange('startDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    วันที่สิ้นสุด
                  </Label>
                  <div className="col-span-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          {formData.endDate ? (
                            format(formData.endDate, 'dd MMMM yyyy', { locale: th })
                          ) : (
                            <span className="text-muted-foreground">เลือกวันที่สิ้นสุด (ถ้ามี)</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.endDate}
                          onSelect={(date) => handleDateChange('endDate', date)}
                          initialFocus
                          disabled={(date) => date < formData.startDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="priority" className="text-right">
                    ความสำคัญ
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleSelectChange('priority', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="เลือกระดับความสำคัญ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">ต่ำ</SelectItem>
                      <SelectItem value="medium">ปานกลาง</SelectItem>
                      <SelectItem value="high">สูง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    สถานะ
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="เลือกสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">กำลังดำเนินการ</SelectItem>
                      <SelectItem value="on-hold">ระงับชั่วคราว</SelectItem>
                      <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                      <SelectItem value="cancelled">ยกเลิก</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="jiraUrl" className="text-right">
                    Jira URL
                  </Label>
                  <Input
                    id="jiraUrl"
                    name="jira_url"
                    value={formData.jira_url}
                    onChange={handleChange}
                    placeholder="https://jira.example.com/project/PRJ-123"
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="confluenceUrl" className="text-right">
                    Confluence URL
                  </Label>
                  <Input
                    id="confluenceUrl"
                    name="confluence_url"
                    value={formData.confluence_url}
                    onChange={handleChange}
                    placeholder="https://confluence.example.com/spaces/PRJ"
                    className="col-span-3"
                  />
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="py-4">
                <div className="mb-4">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="ค้นหาพนักงานตามชื่อ, ตำแหน่ง หรืออีเมล"
                      className="pl-10 mb-2"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {formData.members.length > 0 && (
                    <div className="mb-4 border p-2 rounded-md">
                      <Label className="text-sm mb-2 block">สมาชิกที่เลือก ({formData.members.length} คน)</Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.members.map(member => (
                          <Badge key={member.id} variant="secondary" className="flex items-center gap-1 p-1 pl-2">
                            <span>{member.first_name} {member.last_name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 rounded-full hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <FiX className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <ScrollArea className="h-[280px] border rounded-md p-2">
                    <div className="space-y-2">
                      {filteredEmployees.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          ไม่พบพนักงานที่ตรงกับคำค้นหา
                        </div>
                      ) : (
                        filteredEmployees.map(employee => {
                          const isSelected = formData.members.some(member => member.id === employee.id);
                          return (
                            <div
                              key={employee.id}
                              className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                                isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                              }`}
                              onClick={() => handleSelectMember(employee)}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={employee.image} alt={`${employee.first_name} ${employee.last_name}`} />
                                  <AvatarFallback className="text-xs">
                                    {employee.first_name?.[0]}{employee.last_name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{employee.first_name} {employee.last_name}</p>
                                  <p className="text-xs text-muted-foreground">{employee.position_title || 'ไม่ระบุตำแหน่ง'}</p>
                                </div>
                              </div>
                              <Checkbox checked={isSelected} />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className="py-4">
                <div className="grid gap-4">
                  <div className="border rounded-md p-4">
                    <Label htmlFor="attachments" className="block mb-2 font-medium">
                      เพิ่มไฟล์แนบ
                    </Label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-4 pb-4">
                          <svg className="w-7 h-7 mb-1 text-muted-foreground" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                          </svg>
                          <p className="mb-1 text-sm text-muted-foreground">
                            <span className="font-semibold">คลิกเพื่อเลือกไฟล์</span> หรือลากและวางที่นี่
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            รองรับไฟล์ PDF, Word, Excel, รูปภาพ และอื่นๆ
                          </p>
                        </div>
                        <Input
                          id="attachments"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files).map(file => ({
                              name: file.name,
                              size: file.size,
                              type: file.type,
                              url: URL.createObjectURL(file)
                            }));
                            
                            setFormData({
                              ...formData,
                              attachments: [...formData.attachments, ...files]
                            });
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {formData.attachments.length > 0 ? (
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between mb-3 items-center">
                        <Label className="font-medium text-base">ไฟล์ที่แนบ ({formData.attachments.length})</Label>
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => setFormData({...formData, attachments: []})}
                        >
                          <FiX className="h-3 w-3 mr-1" /> ลบทั้งหมด
                        </Button>
                      </div>
                      <div className="max-h-[280px] overflow-y-auto pr-1">
                        <div className="space-y-2">
                          {formData.attachments.map((file, index) => {
                            const fileTypeInfo = getFileTypeDisplay(file.type);
                            return (
                              <div key={index} className="flex items-center justify-between border rounded-md p-2 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                                    {fileTypeInfo.icon}
                                  </div>
                                  <div className="overflow-hidden">
                                    <p className="text-sm font-medium">{formatFileName(file.name)}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(file.size)}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      attachments: formData.attachments.filter((_, i) => i !== index)
                                    });
                                  }}
                                >
                                  <FiX className="h-4 w-4" />
                                  <span className="sr-only">ลบไฟล์</span>
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 border rounded-md">
                      <p className="text-muted-foreground">ยังไม่มีไฟล์แนบ</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'กำลังบันทึก...' : 'เพิ่มโปรเจค'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 