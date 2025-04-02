// แปลงวันที่เป็น Date object
const startDateTime = new Date(startDate);
const endDateTime = new Date(endDate);

// ต้องแน่ใจว่าใช้ UTC time ไม่ตัด timezone ทิ้ง
console.log('Start date from client:', startDate);
console.log('End date from client:', endDate);
console.log('Parsed start date:', startDateTime.toISOString());
console.log('Parsed end date:', endDateTime.toISOString());

// ตั้งเวลาให้ครอบคลุมทั้งวัน
startDateTime.setHours(0, 0, 0, 0);
endDateTime.setHours(23, 59, 59, 999);

console.log('Adjusted start date:', startDateTime.toISOString());
console.log('Adjusted end date:', endDateTime.toISOString()); 