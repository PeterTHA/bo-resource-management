import { sql } from '@vercel/postgres';

/**
 * ฟังก์ชันสำหรับทดสอบการเชื่อมต่อกับ Vercel Postgres
 */
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW()`;
    console.log('Vercel Postgres connected:', result.rows[0]);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Vercel Postgres connection error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับสร้างตารางในฐานข้อมูล Vercel Postgres
 */
export async function createTables() {
  try {
    // สร้างตาราง employees
    await sql`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        position VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        hire_date DATE NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'employee',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // สร้างตาราง leaves
    await sql`
      CREATE TABLE IF NOT EXISTS leaves (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id),
        leave_type VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'รออนุมัติ',
        approved_by INTEGER REFERENCES employees(id),
        approved_at TIMESTAMP,
        comment TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // สร้างตาราง overtimes
    await sql`
      CREATE TABLE IF NOT EXISTS overtimes (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id),
        date DATE NOT NULL,
        start_time VARCHAR(10) NOT NULL,
        end_time VARCHAR(10) NOT NULL,
        total_hours NUMERIC(5,2) NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'รออนุมัติ',
        approved_by INTEGER REFERENCES employees(id),
        approved_at TIMESTAMP,
        comment TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    return { success: true, message: 'Tables created successfully' };
  } catch (error) {
    console.error('Error creating tables:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลพนักงานทั้งหมด
 */
export async function getEmployees() {
  try {
    const result = await sql`SELECT * FROM employees ORDER BY created_at DESC`;
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Error fetching employees:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลพนักงานตาม ID
 */
export async function getEmployeeById(id) {
  try {
    const result = await sql`SELECT * FROM employees WHERE id = ${id}`;
    if (result.rows.length === 0) {
      return { success: false, message: 'ไม่พบข้อมูลพนักงาน' };
    }
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error fetching employees:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลพนักงานตามอีเมล
 */
export async function getEmployeeByEmail(email) {
  try {
    const result = await sql`SELECT * FROM employees WHERE email = ${email}`;
    if (result.rows.length === 0) {
      return { success: false, message: 'ไม่พบข้อมูลพนักงาน' };
    }
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error fetching employee by email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับเพิ่มข้อมูลพนักงาน
 */
export async function createEmployee(employeeData) {
  try {
    const { 
      employee_id, 
      first_name, 
      last_name, 
      email, 
      password, 
      position, 
      department, 
      hire_date, 
      role = 'employee', 
      isActive = true 
    } = employeeData;

    const result = await sql`
      INSERT INTO employees (
        employee_id, first_name, last_name, email, password, position, department, hire_date, role, is_active
      ) VALUES (
        ${employee_id}, ${first_name}, ${last_name}, ${email}, ${password}, ${position}, ${department}, ${hire_date}, ${role}, ${is_active}
      )
      RETURNING *
    `;

    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error creating employees:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับอัปเดตข้อมูลพนักงาน
 */
export async function updateEmployee(id, employeeData) {
  try {
    const { 
      first_name, 
      last_name, 
      email, 
      position, 
      department, 
      role, 
      is_active 
    } = employeeData;

    const result = await sql`
      UPDATE employees
      SET 
        first_name = ${first_name},
        last_name = ${last_name},
        email = ${email},
        position = ${position},
        department = ${department},
        role = COALESCE(${role}, role),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return { success: false, message: 'ไม่พบข้อมูลพนักงาน' };
    }

    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error updating employees:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับลบข้อมูลพนักงาน
 */
export async function deleteEmployee(id) {
  try {
    const result = await sql`DELETE FROM employees WHERE id = ${id} RETURNING *`;
    
    if (result.rows.length === 0) {
      return { success: false, message: 'ไม่พบข้อมูลพนักงาน' };
    }

    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error deleting employees:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับเปลี่ยนรหัสผ่านพนักงาน
 */
export async function updateEmployeePassword(id, hashedPassword) {
  try {
    const result = await sql`
      UPDATE employees
      SET 
        password = ${hashedPassword},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return { success: false, message: 'ไม่พบข้อมูลพนักงาน' };
    }

    return { success: true, message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' };
  } catch (error) {
    console.error('Error updating employee password:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลการลาทั้งหมด
 */
export async function getLeaves(employeeId = null) {
  try {
    let result;
    
    if (employeeId {
      result = await sql`
        SELECT l.*, e.first_name, e.last_name, e.employee_id
        FROM leaves l
        JOIN employees e ON l.employee_id = e.id
        WHERE l.employee_id = ${employee_id}
        ORDER BY l.created_at DESC
      `;
    } else {
      result = await sql`
        SELECT l.*, e.first_name, e.last_name, e.employee_id
        FROM leaves l
        JOIN employees e ON l.employee_id = e.id
        ORDER BY l.created_at DESC
      `;
    }
    
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Error fetching leaves:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลการลาตาม ID
 */
export async function getLeaveById(id) {
  try {
    const result = await sql`
      SELECT l.*, e.first_name, e.last_name, e.employee_id
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      WHERE l.id = ${id}
    `;
    
    if (result.rows.length === 0) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error fetching leaves:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับเพิ่มข้อมูลการลา
 */
export async function createLeave(leaveData) {
  try {
    const {
      employee,
      leave_type,
      start_date,
      end_date,
      reason,
      status = 'รออนุมัติ'
    } = leaveData;
    
    const result = await sql`
      INSERT INTO leaves (
        employee_id, leave_type, start_date, end_date, reason, status
      ) VALUES (
        ${employee}, ${leave_type}, ${start_date}, ${end_date}, ${reason}, ${status}
      )
      RETURNING *
    `;
    
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error creating leaves:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับอัปเดตข้อมูลการลา
 */
export async function updateLeave(id, leaveData) {
  try {
    const {
      leave_type,
      start_date,
      end_date,
      reason,
      status,
      approvedBy,
      comment
    } = leaveData;
    
    let approvedAt = null;
    if (status === 'อนุมัติ' || status === 'ไม่อนุมัติ') {
      approvedAt = new Date();
    }
    
    const result = await sql`
      UPDATE leaves
      SET
        leave_type = COALESCE(${leave_type}, leave_type),
        start_date = COALESCE(${start_date}, start_date),
        end_date = COALESCE(${end_date}, end_date),
        reason = COALESCE(${reason}, reason),
        status = COALESCE(${status}, status),
        approved_by = COALESCE(${approvedBy}, approved_by),
        approved_at = COALESCE(${approvedAt}, approved_at),
        comment = COALESCE(${comment}, comment),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.rows.length === 0) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error updating leaves:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับลบข้อมูลการลา
 */
export async function deleteLeave(id) {
  try {
    const result = await sql`DELETE FROM leaves WHERE id = ${id} RETURNING *`;
    
    if (result.rows.length === 0) {
      return { success: false, message: 'ไม่พบข้อมูลการลา' };
    }
    
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error deleting leaves:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลการทำงานล่วงเวลาทั้งหมด
 */
export async function getOvertimes(employeeId = null) {
  try {
    let result;
    
    if (employeeId {
      result = await sql`
        SELECT o.*, e.first_name, e.last_name, e.employee_id
        FROM overtimes o
        JOIN employees e ON o.employee_id = e.id
        WHERE o.employee_id = ${employee_id}
        ORDER BY o.created_at DESC
      `;
    } else {
      result = await sql`
        SELECT o.*, e.first_name, e.last_name, e.employee_id
        FROM overtimes o
        JOIN employees e ON o.employee_id = e.id
        ORDER BY o.created_at DESC
      `;
    }
    
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Error fetching overtimes:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลการทำงานล่วงเวลาตาม ID
 */
export async function getOvertimeById(id) {
  try {
    const result = await sql`
      SELECT o.*, e.first_name, e.last_name, e.employee_id
      FROM overtimes o
      JOIN employees e ON o.employee_id = e.id
      WHERE o.id = ${id}
    `;
    
    if (result.rows.length === 0) {
      return { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' };
    }
    
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error fetching overtimes:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับเพิ่มข้อมูลการทำงานล่วงเวลา
 */
export async function createOvertime(overtimeData) {
  try {
    const {
      employee,
      date,
      start_time,
      end_time,
      total_hours,
      reason,
      status = 'รออนุมัติ'
    } = overtimeData;
    
    const result = await sql`
      INSERT INTO overtimes (
        employee_id, date, start_time, end_time, total_hours, reason, status
      ) VALUES (
        ${employee}, ${date}, ${start_time}, ${end_time}, ${total_hours}, ${reason}, ${status}
      )
      RETURNING *
    `;
    
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error creating overtimes:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับอัปเดตข้อมูลการทำงานล่วงเวลา
 */
export async function updateOvertime(id, overtimeData) {
  try {
    const {
      date,
      start_time,
      end_time,
      total_hours,
      reason,
      status,
      approvedBy,
      comment
    } = overtimeData;
    
    let approvedAt = null;
    if (status === 'อนุมัติ' || status === 'ไม่อนุมัติ') {
      approvedAt = new Date();
    }
    
    const result = await sql`
      UPDATE overtimes
      SET
        date = COALESCE(${date}, date),
        start_time = COALESCE(${start_time}, start_time),
        end_time = COALESCE(${end_time}, end_time),
        total_hours = COALESCE(${total_hours}, total_hours),
        reason = COALESCE(${reason}, reason),
        status = COALESCE(${status}, status),
        approved_by = COALESCE(${approvedBy}, approved_by),
        approved_at = COALESCE(${approvedAt}, approved_at),
        comment = COALESCE(${comment}, comment),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.rows.length === 0) {
      return { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' };
    }
    
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error updating overtimes:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ฟังก์ชันสำหรับลบข้อมูลการทำงานล่วงเวลา
 */
export async function deleteOvertime(id) {
  try {
    const result = await sql`DELETE FROM overtimes WHERE id = ${id} RETURNING *`;
    
    if (result.rows.length === 0) {
      return { success: false, message: 'ไม่พบข้อมูลการทำงานล่วงเวลา' };
    }
    
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error deleting overtimes:', error);
    return { success: false, error: error.message };
  }
} 