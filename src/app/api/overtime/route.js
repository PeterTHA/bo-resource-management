import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { getOvertimes, createOvertime } from '../../../lib/db-prisma';

// GET - ดึงข้อมูลการทำงานล่วงเวลาทั้งหมด
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const summary = searchParams.get('summary') === 'true';
    
    // ดึงข้อมูลการทำงานล่วงเวลาจาก Prisma
    let result;
    
    // ถ้าเป็น admin หรือ manager สามารถดูข้อมูลการทำงานล่วงเวลาทั้งหมดได้
    // ถ้าเป็นพนักงานทั่วไป จะบันทึกโอทีให้คนอื่นไม่ได้
    if (session.user.role === 'permanent' || session.user.role === 'temporary') {
      result = await getOvertimes(session.user.id);
    } else if (employeeId) {
      result = await getOvertimes(employeeId);
    } else {
      result = await getOvertimes();
    }
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลการทำงานล่วงเวลา', connectionError: true },
        { status: 500 }
      );
    }
    
    // ถ้าต้องการสรุปข้อมูลตามเดือน
    if (summary && result.success) {
      const thaiMonthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      
      // กรอง overtime ตามวันที่ (ถ้ามีการระบุ)
      let filteredOvertimes = result.data;
      if (startDate && endDate) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        filteredOvertimes = filteredOvertimes.filter(ot => {
          const otDate = new Date(ot.date);
          return otDate >= startDateObj && otDate <= endDateObj;
        });
      }
      
      // เฉพาะรายการที่อนุมัติแล้ว และรวมถึงรายการที่กำลังรอการยกเลิก
      const approvedOvertimes = filteredOvertimes.filter(ot => 
        ot.status === 'อนุมัติ' && 
        (
          !ot.isCancelled || 
          ot.cancelStatus === 'รออนุมัติ' || 
          ot.cancelStatus === 'ไม่อนุมัติ'
        )
      );
      
      // สร้างข้อมูลเริ่มต้นสำหรับทุกเดือน
      const monthGroups = {};
      
      // ถ้ามีการระบุช่วงวันที่ ให้แสดงเฉพาะเดือนในช่วงนั้น
      if (startDate && endDate) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        const startMonth = startDateObj.getMonth();
        const startYear = startDateObj.getFullYear();
        const endMonth = endDateObj.getMonth();
        const endYear = endDateObj.getFullYear();
        
        // ครอบคลุมเฉพาะเดือนในช่วงที่ระบุ
        for (let year = startYear; year <= endYear; year++) {
          const monthStart = (year === startYear) ? startMonth : 0;
          const monthEnd = (year === endYear) ? endMonth : 11;
          
          for (let month = monthStart; month <= monthEnd; month++) {
            monthGroups[month] = {
              month: thaiMonthNames[month],
              count: 0,
              totalHours: 0.00
            };
          }
        }
      } else {
        // ถ้าไม่ระบุช่วงเวลา แสดงทุกเดือนในปีปัจจุบัน
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        
        for (let month = 0; month <= currentMonth; month++) {
          monthGroups[month] = {
            month: thaiMonthNames[month],
            count: 0,
            totalHours: 0.00
          };
        }
      }
      
      // เพิ่มข้อมูลการทำงานล่วงเวลาลงในเดือนที่เกี่ยวข้อง
      approvedOvertimes.forEach(ot => {
        const date = new Date(ot.date);
        const monthKey = date.getMonth();
        
        if (!monthGroups[monthKey]) {
          monthGroups[monthKey] = {
            month: thaiMonthNames[monthKey],
            count: 0,
            totalHours: 0.00
          };
        }
        
        monthGroups[monthKey].count += 1;
        monthGroups[monthKey].totalHours += parseFloat(ot.totalHours || 0);
      });
      
      // แปลงเป็น array และเรียงตามเดือน และกำหนดทศนิยม 2 ตำแหน่ง
      const monthlySummary = Object.keys(monthGroups)
        .map(key => {
          // คำนวณชั่วโมงรวมและแปลงเป็นทศนิยม 2 ตำแหน่ง
          const formattedHours = monthGroups[key].totalHours.toFixed(2);
          
          return {
            month: thaiMonthNames[key],
            count: monthGroups[key].count,
            totalHours: Number(formattedHours) // แปลงกลับเป็นตัวเลข
          };
        })
        .sort((a, b) => thaiMonthNames.indexOf(a.month) - thaiMonthNames.indexOf(b.month));
      
      return NextResponse.json({ 
        success: true, 
        data: {
          overtimes: result.data,
          monthlySummary
        }
      }, { status: 200 });
    }
    
    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/overtime:', error);
    return NextResponse.json(
      { success: false, message: error.message, connectionError: true },
      { status: 500 }
    );
  }
}

// POST - เพิ่มข้อมูลการทำงานล่วงเวลา
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // ถ้าเป็นพนักงานทั่วไป ให้ใช้ ID ของตัวเอง
    if (session.user.role === 'permanent' || session.user.role === 'temporary') {
      data.employeeId = session.user.id;
    } else if (data.employee) {
      // แปลงจาก employee เป็น employeeId ถ้ามีการส่ง employee มา
      data.employeeId = data.employee;
      delete data.employee;
    }
    
    // เพิ่มข้อมูลการทำงานล่วงเวลาใน Prisma
    const result = await createOvertime(data);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || result.error || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลการทำงานล่วงเวลา' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/overtime:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 