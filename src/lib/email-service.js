import nodemailer from 'nodemailer';

// โครงสร้างการเชื่อมต่อกับ email server
let transporter;
let isTestAccount = false;

// ฟังก์ชันตรวจสอบการตั้งค่าอีเมล
function checkEmailConfig() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return {
      configured: false,
      message: 'ไม่พบการตั้งค่าชื่อผู้ใช้หรือรหัสผ่านสำหรับอีเมล',
    };
  }
  
  if (process.env.EMAIL_PASS === 'YOUR_APP_PASSWORD_HERE' || 
      process.env.EMAIL_PASS === 'YOUR_GMAIL_APP_PASSWORD') {
    return {
      configured: false,
      message: 'กรุณาตั้งค่า App Password ที่ถูกต้องใน .env.local หรือ .env.development.local',
    };
  }
  
  return { configured: true };
}

// ฟังก์ชันสำหรับตั้งค่า transporter
function initTransporter() {
  // ตรวจสอบการตั้งค่าอีเมล
  const configCheck = checkEmailConfig();
  if (!configCheck.configured) {
    console.warn(`[EMAIL CONFIG WARNING] ${configCheck.message}`);
    console.warn('[EMAIL CONFIG WARNING] ระบบจะใช้ Ethereal.email สำหรับการทดสอบแทน');
    
    // ในโหมดพัฒนา ใช้ ethereal.email สำหรับการทดสอบ
    if (process.env.NODE_ENV === 'development') {
      return createTestAccount();
    }
    
    return null;
  }
  
  // ตรวจสอบว่ามีการตั้งค่าอีเมลแบบ Gmail หรือไม่
  if (process.env.EMAIL_PROVIDER === 'gmail' && 
      process.env.EMAIL_USER && 
      process.env.EMAIL_PASS) {
    
    console.log(`[EMAIL CONFIG] Initializing Gmail SMTP with ${process.env.EMAIL_USER}`);
    
    // สร้าง transporter สำหรับ Gmail
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT, 10) || 465,
      secure: process.env.EMAIL_SECURE === 'true' || true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // เพิ่ม debug: true ในโหมดพัฒนาเพื่อดูรายละเอียดการเชื่อมต่อ
      ...(process.env.NODE_ENV === 'development' ? { debug: true } : {})
    });
    
    // ทดสอบการเชื่อมต่อ
    console.log('[EMAIL CONFIG] Verifying Gmail SMTP connection...');
    transporter.verify()
      .then(() => {
        console.log('[EMAIL CONFIG] Gmail SMTP connection verified successfully.');
      })
      .catch((error) => {
        console.error('[EMAIL CONFIG ERROR] Gmail SMTP connection failed:', error.message);
        console.error('[EMAIL CONFIG INFO] Please make sure you are using App Password, not your regular password');
        console.error('[EMAIL CONFIG INFO] Learn more at: docs/gmail-app-password.md');
        
        // หากไม่สามารถเชื่อมต่อได้ ใช้ ethereal.email แทนในโหมดพัฒนา
        if (process.env.NODE_ENV === 'development') {
          console.log('[EMAIL CONFIG] Falling back to Ethereal.email for testing...');
          return createTestAccount();
        }
      });
    
    return transporter;
  }
  
  // ตรวจสอบว่ามีการตั้งค่าอีเมลแบบทั่วไปหรือไม่
  if (process.env.EMAIL_HOST && process.env.EMAIL_PORT && 
      process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    
    console.log(`[EMAIL CONFIG] Initializing SMTP with ${process.env.EMAIL_HOST}`);
    
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
      console.log('[EMAIL CONFIG] SMTP server connection verified successfully.');
    }).catch((error) => {
      console.error('[EMAIL CONFIG ERROR] SMTP server connection failed:', error.message);
    });
    
    return transporter;
  }
  
  console.warn('[EMAIL CONFIG WARNING] Email configuration is missing. Will use Ethereal.email for testing.');
  
  // ในโหมดพัฒนา ใช้ ethereal.email สำหรับการทดสอบ
  if (process.env.NODE_ENV === 'development') {
    return createTestAccount();
  }
  
  return null;
}

// สร้างบัญชีทดสอบใน ethereal.email
async function createTestAccount() {
  try {
    console.log('[EMAIL CONFIG] Creating test account on Ethereal.email...');
    const testAccount = await nodemailer.createTestAccount();
    console.log('[EMAIL CONFIG] Created test email account:', testAccount.user);
    
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
    console.log('[EMAIL CONFIG] Using Ethereal.email for email testing');
    console.log(`[EMAIL CONFIG] Test email login: ${testAccount.web.username} / ${testAccount.web.password}`);
    console.log(`[EMAIL CONFIG] Test email web interface: ${testAccount.web.host}`);
    
    return transporter;
  } catch (error) {
    console.error('[EMAIL CONFIG ERROR] Error creating test email account:', error.message);
    return null;
  }
}

/**
 * ส่งอีเมลทั่วไป
 * @param {Object} options - ข้อมูลสำหรับการส่งอีเมล
 * @returns {Promise<Object>} - ข้อมูลการส่งอีเมล
 */
export async function sendEmail(options) {
  const { to, subject, html, from = process.env.EMAIL_FROM || 'no-reply@resource-management.com' } = options;
  
  if (!transporter) {
    await initTransporter();
  }
  
  // ถ้าไม่สามารถสร้าง transporter ได้ จำลองการส่งอีเมล
  if (!transporter) {
    console.log(`[EMAIL SIMULATION] Email would be sent to: ${to}`);
    console.log(`[EMAIL SIMULATION] Subject: ${subject}`);
    console.log(`[EMAIL SIMULATION] Content: ${html.substring(0, 100)}...`);
    
    return {
      success: true,
      info: { simulated: true },
      preview: null,
      message: 'Email simulation (no actual email sent)'
    };
  }
  
  try {
    // ส่งอีเมล
    const info = await transporter.sendMail({
      from: `"ระบบจัดการทรัพยากรบุคคล" <${from}>`,
      to,
      subject,
      html,
    });
    
    console.log('[EMAIL SENT] Message ID:', info.messageId);
    
    // หากใช้ ethereal.email ให้แสดง preview URL
    let previewUrl = null;
    if (isTestAccount) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('[EMAIL PREVIEW] URL:', previewUrl);
      }
    }
    
    return {
      success: true,
      info,
      preview: previewUrl,
      message: 'Email sent successfully'
    };
  } catch (error) {
    console.error('[EMAIL ERROR] Failed to send email:', error.message);
    
    let errorMessage = 'ไม่สามารถส่งอีเมลได้';
    
    // ตรวจสอบข้อผิดพลาดเฉพาะ
    if (error.code === 'EAUTH') {
      errorMessage = 'รหัสผ่านไม่ถูกต้อง โปรดตรวจสอบ App Password';
      console.error('[EMAIL ERROR] Authentication failed. Make sure you are using App Password, not your regular password');
      console.error('[EMAIL ERROR] Learn more at: docs/gmail-app-password.md');
    } else if (error.code === 'ESOCKET') {
      errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์อีเมลได้';
    } else if (error.code === 'EENVELOPE') {
      errorMessage = 'ที่อยู่อีเมลไม่ถูกต้อง';
    }
    
    return {
      success: false,
      error: error.message,
      message: errorMessage,
      code: error.code
    };
  }
}

/**
 * ส่งอีเมลยืนยันการสมัครสมาชิก
 * @param {Object} options - ข้อมูลสำหรับการส่งอีเมล
 * @returns {Promise<Object>} - ข้อมูลการส่งอีเมล
 */
export async function sendWelcomeEmail(options) {
  const { to, name, firstName, lastName, password, position, department, team, employeeId, role } = options;
  
  // ตรวจสอบว่ามีอีเมลผู้รับหรือไม่
  if (!to) {
    console.error('[EMAIL ERROR] No recipient email address provided');
    return {
      success: false,
      message: 'ไม่ได้ระบุที่อยู่อีเมลผู้รับ',
      error: 'No recipients defined'
    };
  }
  
  console.log('Sending welcome email with data:', { 
    to, 
    firstName, 
    lastName, 
    employeeId, 
    position, 
    department, 
    role 
  });
  
  // สร้างเนื้อหาอีเมล
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #6d28d9;">ยินดีต้อนรับสู่ระบบจัดการทรัพยากรบุคคล</h2>
      <p>สวัสดี ${firstName || name || to},</p>
      <p>บัญชีของคุณได้ถูกสร้างเรียบร้อยแล้ว โปรดใช้ข้อมูลต่อไปนี้ในการเข้าสู่ระบบ:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>รหัสพนักงาน:</strong> ${employeeId || 'ไม่ระบุ'}</p>
        <p style="margin: 5px 0;"><strong>อีเมล:</strong> ${to}</p>
        <p style="margin: 5px 0;"><strong>รหัสผ่าน:</strong> ${password}</p>
        <p style="margin: 5px 0;"><strong>บทบาท:</strong> ${role === 'admin' ? 'ผู้ดูแลระบบ' : 
                                              role === 'supervisor' ? 'หัวหน้างาน' : 
                                              role === 'permanent' ? 'พนักงานประจำ' : 
                                              role === 'temporary' ? 'พนักงานชั่วคราว' : role || 'พนักงาน'}</p>
        ${position ? `<p style="margin: 5px 0;"><strong>ตำแหน่ง:</strong> ${position}</p>` : ''}
        ${department ? `<p style="margin: 5px 0;"><strong>แผนก:</strong> ${department}</p>` : ''}
        ${team ? `<p style="margin: 5px 0;"><strong>ทีม:</strong> ${team}</p>` : ''}
      </div>
      <p>คุณสามารถเข้าสู่ระบบและเปลี่ยนรหัสผ่านได้ที่: <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" style="color: #6d28d9;">เข้าสู่ระบบ</a></p>
      <p>ขอแสดงความนับถือ,<br>ทีมระบบจัดการทรัพยากรบุคคล</p>
    </div>
  `;
  
  return sendEmail({
    to,
    subject: 'ยินดีต้อนรับสู่ระบบจัดการทรัพยากรบุคคล',
    html,
  });
}

/**
 * ส่งอีเมลแจ้งรหัสผ่านที่รีเซ็ต
 * @param {Object} options - ข้อมูลสำหรับการส่งอีเมล
 * @returns {Promise<Object>} - ข้อมูลการส่งอีเมล
 */
export async function sendPasswordResetEmail(options) {
  const { email, firstName, lastName, password, role, employeeId, resetBy = 'ผู้ดูแลระบบ' } = options;
  
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
  
  return sendEmail({
    to: email,
    subject: 'รหัสผ่านใหม่สำหรับระบบจัดการทรัพยากรบุคคล',
    html,
  });
}

// เริ่มต้นกำหนดค่า transporter เมื่อ import module นี้
initTransporter(); 