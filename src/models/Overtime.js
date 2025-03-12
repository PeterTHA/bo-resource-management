import mongoose from 'mongoose';

const OvertimeSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'กรุณาระบุพนักงาน'],
    },
    date: {
      type: Date,
      required: [true, 'กรุณาระบุวันที่ทำงานล่วงเวลา'],
    },
    startTime: {
      type: String,
      required: [true, 'กรุณาระบุเวลาเริ่มทำงานล่วงเวลา'],
    },
    endTime: {
      type: String,
      required: [true, 'กรุณาระบุเวลาสิ้นสุดการทำงานล่วงเวลา'],
    },
    totalHours: {
      type: Number,
      required: [true, 'กรุณาระบุจำนวนชั่วโมงทำงานล่วงเวลา'],
    },
    reason: {
      type: String,
      required: [true, 'กรุณาระบุเหตุผลการทำงานล่วงเวลา'],
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

// คำนวณจำนวนชั่วโมงทำงานล่วงเวลา
OvertimeSchema.pre('save', function (next) {
  const startTime = this.startTime.split(':');
  const endTime = this.endTime.split(':');
  
  const startHour = parseInt(startTime[0]);
  const startMinute = parseInt(startTime[1]);
  const endHour = parseInt(endTime[0]);
  const endMinute = parseInt(endTime[1]);
  
  let hours = endHour - startHour;
  let minutes = endMinute - startMinute;
  
  if (minutes < 0) {
    hours -= 1;
    minutes += 60;
  }
  
  this.totalHours = parseFloat((hours + minutes / 60).toFixed(2));
  next();
});

export default mongoose.models.Overtime || mongoose.model('Overtime', OvertimeSchema); 