import mongoose from 'mongoose';

// ใช้ Vercel Postgres แทน MongoDB ถ้ามีการตั้งค่า
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resource-management';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // เพิ่มเวลาในการเชื่อมต่อ
      connectTimeoutMS: 10000, // เพิ่มเวลาในการเชื่อมต่อ
    };

    try {
      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        console.log('Connected to MongoDB successfully');
        return mongoose;
      }).catch(error => {
        console.error('Failed to connect to MongoDB:', error);
        cached.promise = null;
        // ส่งคืนออบเจ็กต์เปล่าเมื่อไม่สามารถเชื่อมต่อได้
        return {
          connection: { 
            readyState: 0 
          },
          models: { 
            Employee: createDummyModel('Employee'),
            Leave: createDummyModel('Leave'),
            Overtime: createDummyModel('Overtime')
          }
        };
      });
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      cached.promise = null;
      // ส่งคืนออบเจ็กต์เปล่าเมื่อไม่สามารถเชื่อมต่อได้
      return {
        connection: { 
          readyState: 0 
        },
        models: { 
          Employee: createDummyModel('Employee'),
          Leave: createDummyModel('Leave'),
          Overtime: createDummyModel('Overtime')
        }
      };
    }
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    cached.promise = null;
    // ส่งคืนออบเจ็กต์เปล่าเมื่อไม่สามารถเชื่อมต่อได้
    return {
      connection: { 
        readyState: 0 
      },
      models: { 
        Employee: createDummyModel('Employee'),
        Leave: createDummyModel('Leave'),
        Overtime: createDummyModel('Overtime')
      }
    };
  }
}

// สร้างโมเดลเปล่าสำหรับกรณีที่ไม่สามารถเชื่อมต่อกับ MongoDB ได้
function createDummyModel(modelName) {
  return {
    find: () => ({ 
      select: () => ({ 
        populate: () => Promise.resolve([]) 
      }),
      populate: () => Promise.resolve([]),
      exec: () => Promise.resolve([])
    }),
    findById: () => ({ 
      select: () => Promise.resolve(null),
      exec: () => Promise.resolve(null)
    }),
    findOne: () => ({ 
      select: () => Promise.resolve(null),
      exec: () => Promise.resolve(null)
    }),
    create: () => Promise.resolve(null),
    findByIdAndUpdate: () => Promise.resolve(null),
    findByIdAndDelete: () => Promise.resolve(null),
    countDocuments: () => Promise.resolve(0)
  };
}

export default connectDB; 