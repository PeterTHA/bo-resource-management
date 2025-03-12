import mongoose from 'mongoose';

const LeaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'กรุณาระบุพนักงาน'],
    },
    leaveType: {
      type: String,
      enum: ['ลาป่วย', 'ลากิจ', 'ลาพักร้อน', 'ลาคลอด', 'อื่นๆ'],
      required: [true, 'กรุณาระบุประเภทการลา'],
    },
    startDate: {
      type: Date,
      required: [true, 'กรุณาระบุวันที่เริ่มลา'],
    },
    endDate: {
      type: Date,
      required: [true, 'กรุณาระบุวันที่สิ้นสุดการลา'],
    },
    reason: {
      type: String,
      required: [true, 'กรุณาระบุเหตุผลการลา'],
    },
    status: {
      type: String,
      enum: ['รออนุมัติ', 'อนุมัติ', 'ไม่อนุมัติ'],
      default: 'รออนุมัติ',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    approvedAt: {
      type: Date,
    },
    comment: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// คำนวณจำนวนวันลา
LeaveSchema.virtual('leaveDays').get(function () {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
});

// ตรวจสอบว่าวันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่ม
LeaveSchema.pre('save', function (next) {
  if (new Date(this.endDate) < new Date(this.startDate)) {
    throw new Error('วันที่สิ้นสุดการลาต้องมากกว่าหรือเท่ากับวันที่เริ่มลา');
  }
  next();
});

export default mongoose.models.Leave || mongoose.model('Leave', LeaveSchema); 