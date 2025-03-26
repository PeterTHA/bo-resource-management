import nodemailer from 'nodemailer';

// โครงสร้างการเชื่อมต่อกับ SMTP server
let transporter;
let isTestAccount = false;

// ฟังก์ชันสำหรับตั้งค่า transporter
function initTransporter() {
  // ตรวจสอบว่ามีการตั้งค่าอีเมลหรือไม่
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || 
      !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email configuration is missing. Email sending will be simulated.');
    
    // ในโหมดพัฒนา ใช้ ethereal.email สำหรับการทดสอบ
    if (process.env.NODE_ENV === 'development') {
      return createTestAccount();
    }
    
    return null;
  }
  
  // สร้าง transporter โดยใช้การตั้งค่าจาก environment variables
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  
  // ทดสอบการเชื่อมต่อกับ SMTP server
  transporter.verify().then(() => {
    console.log('SMTP server connection verified successfully.');
  }).catch((error) => {
    console.error('Error verifying SMTP server connection:', error);
  });
  
  return transporter;
}

// สร้างบัญชีทดสอบใน ethereal.email
async function createTestAccount() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log('Created test email account:', testAccount.user);
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    isTestAccount = true;
    console.log('Using Ethereal.email for email testing');
    console.log(`Test email login: ${testAccount.web.username} / ${testAccount.web.password}`);
    console.log(`Test email web interface: ${testAccount.web.host}`);
    
    return transporter;
  } catch (error) {
    console.error('Error creating test email account:', error);
    return null;
  }
}

/**
 * ส่งอีเมลยืนยันการสมัครสมาชิก
 * @param {Object} options - ข้อมูลสำหรับการส่งอีเมล
 * @returns {Promise<Object>} - ข้อมูลการส่งอีเมล
 */
export async function sendWelcomeEmail(options) {
  const { email, firstName, lastName, password } = options;
  
  if (!transporter) {
    await initTransporter();
  }
  
  // ถ้าไม่สามารถสร้าง transporter ได้ จำลองการส่งอีเมล
  if (!transporter) {
    console.log(`[EMAIL SIMULATION] Welcome email would be sent to ${email} with password: ${password}`);
    return {
      success: true,
      info: { simulated: true },
      preview: null,
    };
  }
  
  try {
    // สร้างเนื้อหาอีเมล
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #6d28d9;">ยินดีต้อนรับสู่ระบบจัดการทรัพยากรบุคคล</h2>
        <p>สวัสดี ${firstName} ${lastName},</p>
        <p>บัญชีของคุณได้ถูกสร้างเรียบร้อยแล้ว โปรดใช้ข้อมูลต่อไปนี้ในการเข้าสู่ระบบ:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>อีเมล:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>รหัสผ่าน:</strong> ${password}</p>
        </div>
        <p>คุณสามารถเข้าสู่ระบบและเปลี่ยนรหัสผ่านได้ที่: <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" style="color: #6d28d9;">เข้าสู่ระบบ</a></p>
        <p>ขอแสดงความนับถือ,<br>ทีมระบบจัดการทรัพยากรบุคคล</p>
      </div>
    `;
    
    // ส่งอีเมล
    const info = await transporter.sendMail({
      from: `"ระบบจัดการทรัพยากรบุคคล" <${process.env.EMAIL_FROM || 'no-reply@example.com'}>`,
      to: email,
      subject: 'ยินดีต้อนรับสู่ระบบจัดการทรัพยากรบุคคล',
      html,
    });
    
    console.log('Email sent:', info.messageId);
    
    // หากใช้ ethereal.email ให้แสดง preview URL
    let previewUrl = null;
    if (isTestAccount) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('Email Preview URL:', previewUrl);
      }
    }
    
    return {
      success: true,
      info,
      preview: previewUrl,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * ส่งอีเมลแจ้งรหัสผ่านที่รีเซ็ต
 * @param {Object} options - ข้อมูลสำหรับการส่งอีเมล
 * @returns {Promise<Object>} - ข้อมูลการส่งอีเมล
 */
export async function sendPasswordResetEmail(options) {
  const { email, firstName, lastName, password, role, employeeId, resetBy = 'ผู้ดูแลระบบ' } = options;
  
  if (!transporter) {
    await initTransporter();
  }
  
  // ถ้าไม่สามารถสร้าง transporter ได้ จำลองการส่งอีเมล
  if (!transporter) {
    console.log(`[EMAIL SIMULATION] Password reset email would be sent to ${email} with new password: ${password}`);
    return {
      success: true,
      info: { simulated: true },
      preview: null,
    };
  }
  
  try {
    // สร้างเนื้อหาอีเมล
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #9333ea;">รหัสผ่านใหม่ของคุณ</h2>
        <p>สวัสดี ${firstName} ${lastName},</p>
        <p>รหัสผ่านของคุณได้ถูกรีเซ็ตแล้วโดย ${resetBy}</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>รหัสพนักงาน:</strong> ${employeeId || 'ไม่ระบุ'}</p>
          <p style="margin: 5px 0;"><strong>อีเมล:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>รหัสผ่านใหม่:</strong> ${password}</p>
        </div>
        <p>คุณสามารถเข้าสู่ระบบและเปลี่ยนรหัสผ่านได้ที่: <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" style="color: #9333ea;">เข้าสู่ระบบ</a></p>
        <p style="color: #ef4444; font-weight: bold;">หมายเหตุ: กรุณาเปลี่ยนรหัสผ่านของคุณหลังจากเข้าสู่ระบบเพื่อความปลอดภัย</p>
        <p>ขอแสดงความนับถือ,<br>ทีมระบบจัดการทรัพยากรบุคคล</p>
      </div>
    `;
    
    // ส่งอีเมล
    const info = await transporter.sendMail({
      from: `"ระบบจัดการทรัพยากรบุคคล" <${process.env.EMAIL_FROM || 'no-reply@example.com'}>`,
      to: email,
      subject: 'รหัสผ่านใหม่สำหรับระบบจัดการทรัพยากรบุคคล',
      html,
    });
    
    console.log('Email sent:', info.messageId);
    
    // หากใช้ ethereal.email ให้แสดง preview URL
    let previewUrl = null;
    if (isTestAccount) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('Email Preview URL:', previewUrl);
      }
    }
    
    return {
      success: true,
      info,
      preview: previewUrl,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// เริ่มต้นกำหนดค่า transporter เมื่อ import module นี้
initTransporter(); 