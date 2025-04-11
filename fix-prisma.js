const fs = require('fs');
const path = require('path');

// รายการชื่อโมเดลที่ต้องแก้ไข
const modelFixes = {
  'prisma.employee.': 'prisma.employees.',
  'prisma.project.': 'prisma.projects.',
  'prisma.team.': 'prisma.teams.',
  'prisma.position.': 'prisma.positions.',
  'prisma.department.': 'prisma.departments.',
  'prisma.leave.': 'prisma.leaves.',
  'prisma.overtime.': 'prisma.overtimes.',
  'prisma.projectActivityLog.': 'prisma.project_activity_logs.',
  'prisma.projectMember.': 'prisma.project_members.',
  'prisma.projectRole.': 'prisma.project_roles.',
  'prisma.positionLevel.': 'prisma.position_levels.',
  'prisma.workStatus.': 'prisma.work_statuses.',
  'prisma.leaveApproval.': 'prisma.leave_approvals.',
  'prisma.overtimeApproval.': 'prisma.overtime_approvals.',

  // แก้ไขปัญหาที่อาจเกิดจากการแทนที่ที่ไม่สมบูรณ์
  'prisma.leaves.pproval.': 'prisma.leave_approvals.',
  'prisma.overtimes.pproval.': 'prisma.overtime_approvals.',
  'prisma.work_statuses.!==': 'prisma.work_statuses !==',
  'prisma.work_statuses.': 'prisma.work_statuses'
};

// รายการชื่อฟิลด์ที่ต้องแก้ไขทั้งหมด
const fieldFixes = {
  'firstName': 'first_name',
  'lastName': 'last_name',
  'isActive': 'is_active',
  'employeeId': 'employee_id',
  'teamId': 'team_id',
  'departmentId': 'department_id',
  'positionLevel': 'position_level',
  'positionTitle': 'position_title',
  'birthDate': 'birth_date',
  'phoneNumber': 'phone_number',
  'hireDate': 'hire_date',
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  'startDate': 'start_date',
  'endDate': 'end_date',
  'createdById': 'created_by_id',
  'projectId': 'project_id',
  'roleId': 'role_id',
  'leaveId': 'leave_id',
  'leaveType': 'leave_type',
  'totalDays': 'total_days',
  'leaveFormat': 'leave_format',
  'overtimeId': 'overtime_id',
  'startTime': 'start_time',
  'endTime': 'end_time',
  'totalHours': 'total_hours'
};

// รายการชื่อความสัมพันธ์ที่ต้องแก้ไข
const relationFixes = {
  'department': 'departments',
  'teamData': 'teams',
  'createdBy': 'employees',
  'creator': 'employees',
  'projectMembers': 'project_members',
  'projectRoles': 'project_roles',
  'employee': 'employees',
  'project': 'projects',
  'team': 'teams',
  'leave': 'leaves',
  'overtime': 'overtimes'
};

// แก้ไขปัญหาเฉพาะในบางไฟล์หรือบางกรณี
const specialFixes = {
  // ตัวอย่าง: การแก้ไขในไฟล์เฉพาะ
  'src/app/api/leave-summary/route.js': [
    { pattern: /by: \['leaveType'\]/g, replacement: "by: ['leave_type']" },
    { pattern: /\(\{ leaveType \}\)/g, replacement: "({ leave_type })" },
  ],
  'src/app/api/work-status/route.js': [
    { pattern: /hasWorkStatusesModel \? prisma\.work_statuses : prisma\.work_statuses\./g, replacement: "hasWorkStatusesModel ? prisma.work_statuses : prisma.work_statuses" }
  ]
};

// ฟังก์ชันสำหรับค้นหาไฟล์ทั้งหมดในไดเร็กทอรี
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fileList = getAllFiles(filePath, fileList);
    } else if (filePath.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// ฟังก์ชันสำหรับแก้ไขเนื้อหาไฟล์
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // แก้ไขปัญหาเฉพาะในไฟล์นี้ก่อน (ถ้ามี)
    Object.keys(specialFixes).forEach(specificPath => {
      if (filePath.includes(specificPath)) {
        specialFixes[specificPath].forEach(fix => {
          if (fix.pattern.test(content)) {
            content = content.replace(fix.pattern, fix.replacement);
            hasChanges = true;
            console.log(`${filePath}: แก้ไขเฉพาะตามแบบแผน ${fix.pattern}`);
          }
        });
      }
    });
    
    // แก้ไขชื่อโมเดล
    for (const [oldModel, newModel] of Object.entries(modelFixes)) {
      if (content.includes(oldModel)) {
        content = content.replace(new RegExp(oldModel, 'g'), newModel);
        hasChanges = true;
        console.log(`${filePath}: แก้ไข ${oldModel} -> ${newModel}`);
      }
    }
    
    // แก้ไขชื่อฟิลด์ทั่วทั้งไฟล์
    for (const [oldField, newField] of Object.entries(fieldFixes)) {
      // แก้ไขแบบทั่วไปในส่วนต่างๆ ของโค้ด
      const regexPatterns = [
        // แก้ไขในส่วนของ select, where, include, data, orderBy, by, having
        new RegExp(`(select\\s*:\\s*{[^}]*?)${oldField}(\\s*:)`, 'g'),
        new RegExp(`(where\\s*:\\s*{[^}]*?)${oldField}(\\s*:)`, 'g'),
        new RegExp(`(include\\s*:\\s*{[^}]*?)${oldField}(\\s*:)`, 'g'),
        new RegExp(`(data\\s*:\\s*{[^}]*?)${oldField}(\\s*:)`, 'g'),
        new RegExp(`(orderBy\\s*:\\s*{\\s*)${oldField}(\\s*:)`, 'g'),
        new RegExp(`(by\\s*:\\s*\\[[^\\]]*?)${oldField}(\\s*[,\\]])`, 'g'),
        new RegExp(`(having\\s*:\\s*{[^}]*?)${oldField}(\\s*:)`, 'g'),
        new RegExp(`(group\\s*:\\s*{[^}]*?)${oldField}(\\s*:)`, 'g'),
        
        // แก้ไขในส่วนของการกำหนดค่าที่ส่งมาจาก request body
        new RegExp(`(const\\s*{[^}]*?)${oldField}(\\s*[,}])`, 'g'),
        
        // แก้ไขในกรณีใช้ dot notation
        new RegExp(`\\.${oldField}\\b`, 'g'),
        
        // แก้ไขอื่นๆ ที่อาจจะเป็นไปได้
        new RegExp(`\\b${oldField}\\s*:`, 'g'),
        new RegExp(`\\["${oldField}"\\]`, 'g'),
        new RegExp(`\\['${oldField}'\\]`, 'g'),
        
        // แก้ไขในส่วนของเงื่อนไข if และ parameter functions
        new RegExp(`\\(${oldField}\\s*[,)]`, 'g'),
        new RegExp(`if\\s*\\(\\s*${oldField}\\s*\\)`, 'g'),
        
        // แก้ไขในการใช้งาน searchParams.get
        new RegExp(`searchParams\\.get\\(['"]${oldField}['"]\\)`, 'g'),
        
        // แก้ไขในการนำเข้า JSON
        new RegExp(`JSON\\.parse[^}]*?"${oldField}"`, 'g'),
        
        // แก้ไขใน destructure objects
        new RegExp(`({\\s*[^}]*?)${oldField}(\\s*[,}])`, 'g')
      ];
      
      for (const pattern of regexPatterns) {
        if (pattern.test(content)) {
          // กรณีพิเศษตามรูปแบบ regex
          if (pattern.toString().includes('select\\s*:') || 
              pattern.toString().includes('where\\s*:') || 
              pattern.toString().includes('include\\s*:') || 
              pattern.toString().includes('data\\s*:') || 
              pattern.toString().includes('orderBy\\s*:') || 
              pattern.toString().includes('by\\s*:') || 
              pattern.toString().includes('having\\s*:') || 
              pattern.toString().includes('group\\s*:') || 
              pattern.toString().includes('const\\s*{')) {
            content = content.replace(pattern, `$1${newField}$2`);
          } else if (pattern.toString().includes('\\.')) {
            // แบบที่มี dot notation
            content = content.replace(pattern, `.${newField}`);
          } else if (pattern.toString().includes('\\b') && pattern.toString().includes('\\s*:')) {
            // แบบทั่วไปที่เป็นคำเต็ม
            content = content.replace(pattern, `${newField}:`);
          } else if (pattern.toString().includes('\\["')) {
            // แก้ไขในสไตล์ ["fieldName"]
            content = content.replace(pattern, `["${newField}"]`);
          } else if (pattern.toString().includes("\\'")) {
            // แก้ไขในสไตล์ ['fieldName']
            content = content.replace(pattern, `['${newField}']`);
          } else if (pattern.toString().includes('\\(') && pattern.toString().includes('[,)]')) {
            // แก้ไขในพารามิเตอร์ของฟังก์ชัน
            content = content.replace(pattern, `(${newField}$1`);
          } else if (pattern.toString().includes('if\\s*\\(')) {
            // แก้ไขในเงื่อนไข if
            content = content.replace(pattern, `if (${newField})`);
          } else if (pattern.toString().includes('searchParams')) {
            // แก้ไขใน searchParams.get
            content = content.replace(pattern, `searchParams.get('${newField}')`);
          } else if (pattern.toString().includes('JSON\\.parse')) {
            // แก้ไขใน JSON.parse
            content = content.replace(pattern, (match) => {
              return match.replace(`"${oldField}"`, `"${newField}"`);
            });
          } else if (pattern.toString().includes('{\\s*[^}]*?')) {
            // แก้ไขใน destructure objects
            content = content.replace(pattern, `$1${newField}$2`);
          } else {
            // กรณีอื่นๆ
            content = content.replace(pattern, (match) => {
              return match.replace(oldField, newField);
            });
          }
          
          hasChanges = true;
          console.log(`${filePath}: แก้ไข ${oldField} -> ${newField}`);
        }
      }
    }
    
    // แก้ไขชื่อความสัมพันธ์
    for (const [oldRelation, newRelation] of Object.entries(relationFixes)) {
      // ค้นหาและแก้ไขความสัมพันธ์ในรูปแบบต่างๆ
      const relationPatterns = [
        // ในบล็อก include
        new RegExp(`(include\\s*:\\s*{[^}]*?)${oldRelation}(\\s*:)`, 'g'),
        
        // ใน dot notation
        new RegExp(`\\.${oldRelation}\\b`, 'g'),
        
        // ชื่อฟิลด์ที่เป็นความสัมพันธ์
        new RegExp(`\\b${oldRelation}\\s*:`, 'g'),
        
        // ใน bracket notation
        new RegExp(`\\["${oldRelation}"\\]`, 'g'),
        new RegExp(`\\['${oldRelation}'\\]`, 'g')
      ];
      
      for (const pattern of relationPatterns) {
        if (pattern.test(content)) {
          if (pattern.toString().includes('include\\s*:')) {
            content = content.replace(pattern, `$1${newRelation}$2`);
          } else if (pattern.toString().includes('\\.')) {
            content = content.replace(pattern, `.${newRelation}`);
          } else if (pattern.toString().includes('\\b') && pattern.toString().includes('\\s*:')) {
            content = content.replace(pattern, `${newRelation}:`);
          } else if (pattern.toString().includes('\\["')) {
            content = content.replace(pattern, `["${newRelation}"]`);
          } else if (pattern.toString().includes("\\'")) {
            content = content.replace(pattern, `['${newRelation}']`);
          }
          
          hasChanges = true;
          console.log(`${filePath}: แก้ไข ${oldRelation} -> ${newRelation}`);
        }
      }
    }
    
    // แก้ไขปัญหา syntax errors และโค้ดที่ไม่ถูกต้อง
    const syntaxFixPatterns = [
      // แก้ไขปัญหา dot ต่อท้าย work_statuses
      { pattern: /hasWorkStatusesModel \? prisma\.work_statuses : prisma\.work_statuses\./g, replacement: "hasWorkStatusesModel ? prisma.work_statuses : prisma.work_statuses" },
      
      // แก้ไขปัญหา typeof ที่ไม่ถูกต้อง
      { pattern: /typeof prisma\.work_statuses\.!== 'undefined'/g, replacement: "typeof prisma.work_statuses !== 'undefined'" },
      { pattern: /typeof prisma\.work_statuses!== 'undefined'/g, replacement: "typeof prisma.work_statuses !== 'undefined'" },
      
      // แก้ไขการใช้ startDate และ endDate ที่อาจตกค้าง
      { pattern: /date: \{\s*gte: new Date\(startDate\)/g, replacement: "date: {\n      gte: new Date(start_date)" },
      { pattern: /date: \{\s*lte: new Date\(endDate\)/g, replacement: "date: {\n      lte: new Date(end_date)" },
      
      // แก้ไขปัญหาอื่นๆ ที่อาจเกิดขึ้น
      { pattern: /employees_(\w+)_employee_idToemployees/g, replacement: "employees_$1_employee_id_to_employees" },

      // แก้ไขปัญหา employee_id$1
      { pattern: /employee_id\$1/g, replacement: "employeeId" },
      
      // แก้ไขปัญหา start_date$1 และ end_date$1
      { pattern: /start_date\$1/g, replacement: "startDate" },
      { pattern: /end_date\$1/g, replacement: "endDate" },
      
      // แก้ไขปัญหา team_id$1
      { pattern: /team_id\$1/g, replacement: "teamId" },
      
      // แก้ไขปัญหา prisma.work_statusesfindMany
      { pattern: /prisma\.work_statusesfindMany/g, replacement: "prisma.work_statuses.findMany" },
      
      // แก้ไข ...overtimes ให้เป็น ...overtime
      { pattern: /\.\.\.overtimes/g, replacement: "...overtime" },
      
      // แก้ไข ...leaves ให้เป็น ...leave
      { pattern: /\.\.\.leaves/g, replacement: "...leave" }
    ];
    
    syntaxFixPatterns.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        hasChanges = true;
        console.log(`${filePath}: แก้ไขปัญหา syntax ตามแบบแผน ${fix.pattern}`);
      }
    });
    
    // บันทึกการเปลี่ยนแปลง
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`บันทึกการเปลี่ยนแปลงใน ${filePath}`);
    }
    
    return hasChanges;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
}

// ฟังก์ชันหลัก
function main() {
  // ค้นหาทั้งในโฟลเดอร์ api และ lib และ components
  const apiDir = path.join(__dirname, 'src/app/api');
  const libDir = path.join(__dirname, 'src/lib');
  const componentsDir = path.join(__dirname, 'src/components');
  
  const apiFiles = fs.existsSync(apiDir) ? getAllFiles(apiDir) : [];
  const libFiles = fs.existsSync(libDir) ? getAllFiles(libDir) : [];
  const componentFiles = fs.existsSync(componentsDir) ? getAllFiles(componentsDir) : [];
  
  const allFiles = [...apiFiles, ...libFiles, ...componentFiles];
  
  console.log(`พบไฟล์ทั้งหมด ${allFiles.length} ไฟล์`);
  
  let changedCount = 0;
  
  for (const file of allFiles) {
    const hasChanges = fixFile(file);
    if (hasChanges) {
      changedCount++;
    }
  }
  
  console.log(`แก้ไขแล้ว ${changedCount} ไฟล์`);
}

main();