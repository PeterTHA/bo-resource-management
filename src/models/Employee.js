import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'กรุณาระบุรหัสพนักงาน'],
      unique: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, 'กรุณาระบุชื่อ'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'กรุณาระบุนามสกุล'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'กรุณาระบุอีเมล'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'กรุณาระบุอีเมลที่ถูกต้อง',
      ],
    },
    password: {
      type: String,
      required: [true, 'กรุณาระบุรหัสผ่าน'],
      minlength: [6, 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'],
      select: false,
    },
    position: {
      type: String,
      required: [true, 'กรุณาระบุตำแหน่ง'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'กรุณาระบุแผนก'],
      trim: true,
    },
    hireDate: {
      type: Date,
      required: [true, 'กรุณาระบุวันที่เริ่มงาน'],
    },
    role: {
      type: String,
      enum: ['employee', 'manager', 'admin'],
      default: 'employee',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// เข้ารหัสรหัสผ่านก่อนบันทึก
EmployeeSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ตรวจสอบรหัสผ่าน
EmployeeSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema); 