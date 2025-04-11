/**
 * บริการสำหรับจัดการข้อมูลพนักงาน
 */

// ดึงข้อมูลพนักงานทั้งหมด
export async function fetchEmployees() {
  const res = await fetch('/api/employees', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch employees');
  }
  
  return res.json();
}

// ดึงข้อมูลพนักงานตาม ID
export async function fetchEmployeeById(id) {
  const res = await fetch(`/api/employees/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch employee');
  }
  
  return res.json();
}

// เพิ่มพนักงานใหม่
export async function createEmployee(employeeData) {
  const res = await fetch('/api/employees', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(employeeData)
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create employee');
  }
  
  return res.json();
}

// อัปเดตข้อมูลพนักงาน
export async function updateEmployee(id, employeeData) {
  const res = await fetch(`/api/employees/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(employeeData)
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update employee');
  }
  
  return res.json();
}

// ลบพนักงาน
export async function deleteEmployee(id) {
  const res = await fetch(`/api/employees/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to delete employee');
  }
  
  return res.json();
}

// อัปเดตรหัสผ่านพนักงาน
export async function updatePassword(id, passwordData) {
  const res = await fetch(`/api/employees/${id}/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(passwordData)
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update password');
  }
  
  return res.json();
}

// ดึงข้อมูลตำแหน่งทั้งหมด
export async function fetchPositions() {
  const res = await fetch('/api/positions', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch positions');
  }
  
  return res.json();
}

// ดึงข้อมูลระดับตำแหน่งทั้งหมด
export async function fetchPositionLevels() {
  const res = await fetch('/api/position-levels', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch position levels');
  }
  
  return res.json();
}

// ดึงข้อมูลแผนกทั้งหมด
export async function fetchDepartments() {
  const res = await fetch('/api/departments', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch departments');
  }
  
  return res.json();
}

// ดึงข้อมูลทีมทั้งหมด
export async function fetchTeams() {
  const res = await fetch('/api/teams', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch teams');
  }
  
  return res.json();
}

// ดึงข้อมูลบทบาททั้งหมด
export async function fetchRoles() {
  const res = await fetch('/api/roles', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch roles');
  }
  
  return res.json();
}

// อัปโหลดไฟล์
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to upload file');
  }
  
  return res.json();
} 