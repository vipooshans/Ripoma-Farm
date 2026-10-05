import Worker from '../models/Worker.js';
import Admin, { DEFAULT_ROLE_PERMISSIONS } from '../models/Admin.js';
import { jsonDb } from '../utils/jsonDb.js';
import bcrypt from 'bcryptjs';

// Map display role titles to system admin roles
const normalizeAdminRole = (roleTitle) => {
  const lower = (roleTitle || '').toLowerCase();
  if (lower.includes('super')) return 'super_admin';
  if (lower.includes('order')) return 'order_manager';
  if (lower.includes('supervisor')) return 'supervisor';
  if (lower.includes('farmhand') || lower.includes('feeder') || lower.includes('cleaner') || lower.includes('poultry')) return 'farmhand';
  if (lower.includes('fish') || lower.includes('fisher')) return 'fisher';
  if (lower.includes('pack')) return 'packer';
  return 'admin';
};

// @desc    Get all workers
// @route   GET /api/workers
// @access  Private/Admin
export const getWorkers = async (req, res) => {
  try {
    let workers = [];
    if (global.dbConnected) {
      workers = await Worker.find({});
    } else {
      workers = jsonDb.find('workers');
    }
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create/Add a worker (Adds worker registry + Admin credentials)
// @route   POST /api/workers
// @access  Private/Admin
export const addWorker = async (req, res) => {
  const { name, email, password, phone, role, hourlyRate } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Enforce Admin/Worker Password Policy: Min 10 characters
    if (password.length < 10) {
      return res.status(400).json({ message: 'Worker/Admin dashboard password must be at least 10 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const systemRole = normalizeAdminRole(role);
    const assignedPermissions = DEFAULT_ROLE_PERMISSIONS[systemRole] || DEFAULT_ROLE_PERMISSIONS.admin;

    // 1. Create Admin/Worker credential in admins table
    let adminRecord = null;
    let userId = null;

    if (global.dbConnected) {
      const adminExists = await Admin.findOne({ email: cleanEmail });
      if (adminExists) {
        return res.status(400).json({ message: 'An administrative account with this email already exists' });
      }

      adminRecord = await Admin.create({
        name: name.trim(),
        email: cleanEmail,
        password, // Pre-save hook hashes with bcrypt
        role: systemRole,
        permissions: assignedPermissions,
        two_factor_enabled: true,
        status: 'active',
        phone: phone || ''
      });
      userId = adminRecord._id;

      // 2. Create the Worker operational registry
      const worker = await Worker.create({
        userId,
        name: name.trim(),
        email: cleanEmail,
        phone: phone || '',
        role: role || 'Staff/Worker',
        hourlyRate: Number(hourlyRate || 4500),
        tasks: [],
        attendance: [],
      });

      return res.status(201).json(worker);
    } else {
      const adminExists = jsonDb.findOne('admins', a => a.email?.toLowerCase() === cleanEmail);
      if (adminExists) {
        return res.status(400).json({ message: 'An administrative account with this email already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      adminRecord = jsonDb.create('admins', {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: systemRole,
        permissions: assignedPermissions,
        two_factor_enabled: true,
        two_factor_secret: 'RIPOMA-SECURE-2FA-FARM',
        status: 'active',
        phone: phone || '',
        failedLoginAttempts: 0,
        lockoutUntil: null,
        loginHistory: []
      });
      userId = adminRecord._id;

      const worker = jsonDb.create('workers', {
        userId,
        name: name.trim(),
        email: cleanEmail,
        phone: phone || '',
        status: 'active',
        role: role || 'Staff/Worker',
        hourlyRate: Number(hourlyRate || 4500),
        tasks: [],
        attendance: [],
      });

      return res.status(201).json(worker);
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update worker details
// @route   PUT /api/workers/:id
// @access  Private/Admin
export const updateWorker = async (req, res) => {
  const { id } = req.params;
  const { name, phone, role, status, hourlyRate } = req.body;

  try {
    if (global.dbConnected) {
      const worker = await Worker.findById(id);
      if (worker) {
        worker.name = name || worker.name;
        worker.phone = phone !== undefined ? phone : worker.phone;
        worker.role = role || worker.role;
        worker.status = status || worker.status;
        worker.hourlyRate = hourlyRate !== undefined ? Number(hourlyRate) : worker.hourlyRate;

        await worker.save();

        // Sync with Admin record if linked
        if (worker.userId) {
          const systemRole = normalizeAdminRole(worker.role);
          await Admin.findByIdAndUpdate(worker.userId, {
            name: worker.name,
            phone: worker.phone,
            status: worker.status,
            role: systemRole,
            permissions: DEFAULT_ROLE_PERMISSIONS[systemRole] || DEFAULT_ROLE_PERMISSIONS.admin
          });
        }

        res.json(worker);
      } else {
        res.status(404).json({ message: 'Worker registry not found' });
      }
    } else {
      const worker = jsonDb.findById('workers', id);
      if (worker) {
        const updated = jsonDb.findByIdAndUpdate('workers', id, {
          name: name || worker.name,
          phone: phone !== undefined ? phone : worker.phone,
          role: role || worker.role,
          status: status || worker.status,
          hourlyRate: hourlyRate !== undefined ? Number(hourlyRate) : worker.hourlyRate,
        });

        if (worker.userId) {
          const systemRole = normalizeAdminRole(updated.role);
          jsonDb.findByIdAndUpdate('admins', worker.userId, {
            name: updated.name,
            phone: updated.phone,
            status: updated.status,
            role: systemRole,
            permissions: DEFAULT_ROLE_PERMISSIONS[systemRole] || DEFAULT_ROLE_PERMISSIONS.admin
          });
        }

        res.json(updated);
      } else {
        res.status(404).json({ message: 'Worker registry not found' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign a task to worker
// @route   POST /api/workers/:id/tasks
// @access  Private/Admin
export const assignTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, dueDate } = req.body;

  try {
    if (global.dbConnected) {
      const worker = await Worker.findById(id);
      if (worker) {
        worker.tasks.push({
          title,
          description: description || '',
          dueDate: dueDate ? new Date(dueDate) : null,
          status: 'todo',
        });
        await worker.save();
        res.status(201).json(worker);
      } else {
        res.status(404).json({ message: 'Worker not found' });
      }
    } else {
      const worker = jsonDb.findById('workers', id);
      if (worker) {
        const task = {
          _id: Math.random().toString(36).substring(2, 11),
          title,
          description: description || '',
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          status: 'todo',
          assignedDate: new Date().toISOString()
        };
        const updatedTasks = [...(worker.tasks || []), task];
        const updated = jsonDb.findByIdAndUpdate('workers', id, { tasks: updatedTasks });
        res.status(201).json(updated);
      } else {
        res.status(404).json({ message: 'Worker not found' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task status
// @route   PUT /api/workers/:id/tasks/:taskId
// @access  Private/WorkerOrAdmin
export const updateTaskStatus = async (req, res) => {
  const { id, taskId } = req.params;
  const { status } = req.body; // 'todo', 'in_progress', 'completed'

  try {
    if (global.dbConnected) {
      const worker = await Worker.findById(id);
      if (worker) {
        const task = worker.tasks.id(taskId);
        if (task) {
          task.status = status;
          await worker.save();
          res.json(worker);
        } else {
          res.status(404).json({ message: 'Task not found' });
        }
      } else {
        res.status(404).json({ message: 'Worker not found' });
      }
    } else {
      const worker = jsonDb.findById('workers', id);
      if (worker) {
        const updatedTasks = [...(worker.tasks || [])];
        const idx = updatedTasks.findIndex(t => t._id === taskId);
        if (idx !== -1) {
          updatedTasks[idx].status = status;
          const updated = jsonDb.findByIdAndUpdate('workers', id, { tasks: updatedTasks });
          res.json(updated);
        } else {
          res.status(404).json({ message: 'Task not found' });
        }
      } else {
        res.status(404).json({ message: 'Worker not found' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Log attendance
// @route   POST /api/workers/:id/attendance
// @access  Private/Admin
export const logAttendance = async (req, res) => {
  const { id } = req.params;
  const { date, status } = req.body; // date format: 'YYYY-MM-DD', status: 'present' | 'absent' | 'leave'

  try {
    if (global.dbConnected) {
      const worker = await Worker.findById(id);
      if (worker) {
        const existingIdx = worker.attendance.findIndex(a => a.date === date);
        if (existingIdx !== -1) {
          worker.attendance[existingIdx].status = status;
        } else {
          worker.attendance.push({ date, status });
        }
        await worker.save();
        res.json(worker);
      } else {
        res.status(404).json({ message: 'Worker not found' });
      }
    } else {
      const worker = jsonDb.findById('workers', id);
      if (worker) {
        const updatedAttendance = [...(worker.attendance || [])];
        const existingIdx = updatedAttendance.findIndex(a => a.date === date);
        if (existingIdx !== -1) {
          updatedAttendance[existingIdx].status = status;
        } else {
          updatedAttendance.push({ date, status });
        }
        const updated = jsonDb.findByIdAndUpdate('workers', id, { attendance: updatedAttendance });
        res.json(updated);
      } else {
        res.status(404).json({ message: 'Worker not found' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
