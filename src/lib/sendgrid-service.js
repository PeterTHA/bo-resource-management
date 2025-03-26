import sgMail from '@sendgrid/mail';

// ตั้งค่า API key สำหรับ SendGrid หากมีการกำหนดไว้
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid API initialized successfully');
} else {
  console.warn('SendGrid API key is missing. Email sending will be simulated.');
}

/**
 * ส่งอีเมลผ่าน SendGrid API
 * @param {Object} options - ข้อมูลสำหรับการส่งอีเมล
 * @returns {Promise<Object>} - ข้อมูลการส่งอีเมล
 */
export async function sendEmail(options) {
  const { to, subject, html, from = process.env.EMAIL_FROM || 'no-reply@resource-management.com' } = options;
  
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[EMAIL SIMULATION] Email would be sent to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${html.substring(0, 100)}...`);
    
    return {
      success: true,
      info: { simulated: true },
    };
  }
  
  try {
    const msg = {
      to,
      from,
      subject,
      html,
    };
    
    const response = await sgMail.send(msg);
    
    console.log('SendGrid email sent successfully:', response[0].statusCode);
    return {
      success: true,
      info: response[0],
    };
  } catch (error) {
    console.error('Error sending email with SendGrid:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * ส่งอีเมลยืนยันการสมัครสมาชิก
 * @param {Object} options - ข้อมูลสำหรับการส่งอีเมล
 * @returns {Promise<Object>} - ข้อมูลการส่งอีเมล
 */
export async function sendWelcomeEmail(options) {
  const { email, firstName, lastName, password, employeeId, role } = options;
  
  // สร้างเนื้อหาอีเมล
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #6d28d9;">ยินดีต้อนรับสู่ระบบจัดการทรัพยากรบุคคล</h2>
      <p>สวัสดี ${firstName} ${lastName},</p>
      <p>บัญชีของคุณได้ถูกสร้างเรียบร้อยแล้ว โปรดใช้ข้อมูลต่อไปนี้ในการเข้าสู่ระบบ:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>รหัสพนักงาน:</strong> ${employeeId || 'ไม่ระบุ'}</p>
        <p style="margin: 5px 0;"><strong>อีเมล:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>รหัสผ่าน:</strong> ${password}</p>
        <p style="margin: 5px 0;"><strong>บทบาท:</strong> ${role || 'employee'}</p>
      </div>
      <p>คุณสามารถเข้าสู่ระบบและเปลี่ยนรหัสผ่านได้ที่: <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" style="color: #6d28d9;">เข้าสู่ระบบ</a></p>
      <p>ขอแสดงความนับถือ,<br>ทีมระบบจัดการทรัพยากรบุคคล</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
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