import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['todo', 'in_progress', 'completed'], default: 'todo' },
  assignedDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
});

const WorkerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  role: {
    type: String,
    default: 'Staff/Worker', // e.g., 'Feeder', 'Cleaner', 'Packager', 'Supervisor'
  },
  hourlyRate: {
    type: Number,
    default: 4500,
  },
  tasks: [TaskSchema],
  attendance: [{
    date: { type: String }, // 'YYYY-MM-DD'
    status: { type: String, enum: ['present', 'absent', 'leave'], default: 'present' },
  }],
}, {
  timestamps: true,
});

const Worker = mongoose.models.Worker || mongoose.model('Worker', WorkerSchema);
export default Worker;
