import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { NotificationContext } from '../context/NotificationContext';
import { Plus, Calendar, Loader, Check, AlertTriangle, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { formatSriLankanPhoneInput, isValidSriLankanPhone, normalizeSriLankanPhone, PHONE_FORMAT_ERROR, PHONE_PLACEHOLDER } from '../utils/phone';

const AdminWorkers = () => {
  const { showToast } = useContext(NotificationContext);
  
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('directory');

  // Staff CRUD Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Add/Edit Form states
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Feeder',
    zone: 'Poultry Barn Alpha',
    hourlyRate: '4500'
  });

  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Task assignment state
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '' });

  // Attendance log date
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  // Predefined physical zones
  const physicalZones = [
    'Poultry Barn Alpha',
    'Poultry Barn Beta',
    'Solar Dried Dome 1',
    'Solar Dried Dome 2',
    'Hygienic Packing Station',
    'Coastal Logistics Center'
  ];

  const fetchWorkers = async () => {
    try {
      const { data } = await axios.get('/api/workers');
      setWorkers(data);
      if (data.length > 0 && !selectedWorkerId) {
        setSelectedWorkerId(data[0]._id);
      }
    } catch (err) {
      showToast('Could not load staff registry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  // Helper to split serialized role & physical zone
  const parseWorkerRoleAndZone = (roleStr) => {
    if (!roleStr) return { role: 'Feeder', zone: 'Poultry Barn Alpha' };
    const parts = roleStr.split(' | ');
    return {
      role: parts[0] || 'Feeder',
      zone: parts[1] || 'Poultry Barn Alpha'
    };
  };

  // Validation Logic
  const validateField = (name, value, isEditing = false) => {
    let err = '';
    switch (name) {
      case 'name':
        if (!value.trim()) err = 'Name is required';
        else if (value.length < 2 || value.length > 60) err = 'Name must be between 2 and 60 characters';
        break;
      case 'email':
        if (!isEditing) {
          if (!value.trim()) err = 'Email is required';
          else if (!/\S+@\S+\.\S+/.test(value)) err = 'Invalid email address format';
          else {
            const duplicate = workers.some(w => w.email?.toLowerCase() === value.toLowerCase());
            if (duplicate) err = 'Email address is already registered';
          }
        }
        break;
      case 'password':
        if (!isEditing) {
          if (!value) err = 'Password is required';
          else if (value.length < 8) err = 'Password must be at least 8 characters';
        }
        break;
      case 'phone':
        if (!value.trim()) err = 'Contact phone is required';
        else if (!isValidSriLankanPhone(value)) err = PHONE_FORMAT_ERROR;
        break;
      case 'hourlyRate':
        const wage = Number(value);
        if (!value) err = 'Hourly wage is required';
        else if (isNaN(wage) || wage <= 0) err = 'Wage must be greater than 0';
        break;
      default:
        break;
    }
    return err;
  };

  const handleFormChange = (e) => {
    const { name } = e.target;
    const value = name === 'phone' ? formatSriLankanPhoneInput(e.target.value) : e.target.value;
    setForm(prev => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const err = validateField(name, value, !!selectedWorker);
      setErrors(prev => ({ ...prev, [name]: err }));
    }
  };

  const handleInputBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, value, !!selectedWorker);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  // Create Worker
  const handleAddWorker = async (e) => {
    e.preventDefault();

    const allErrors = {
      name: validateField('name', form.name),
      email: validateField('email', form.email),
      password: validateField('password', form.password),
      phone: validateField('phone', form.phone),
      hourlyRate: validateField('hourlyRate', form.hourlyRate)
    };

    setErrors(allErrors);
    setTouched({ name: true, email: true, password: true, phone: true, hourlyRate: true });

    if (Object.values(allErrors).some(err => err !== '')) {
      showToast('Please clear roster validation errors.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Serialize role & zone inside role string
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: normalizeSriLankanPhone(form.phone),
        role: `${form.role} | ${form.zone}`,
        hourlyRate: Number(form.hourlyRate)
      };

      await axios.post('/api/workers', payload);
      showToast('Worker registered successfully!', 'success');
      setIsAddOpen(false);
      fetchWorkers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to register worker.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Worker Modal trigger
  const handleOpenEdit = (w) => {
    setSelectedWorker(w);
    const parsed = parseWorkerRoleAndZone(w.role);
    setForm({
      name: w.name,
      email: w.email,
      password: '',
      phone: w.phone || '',
      role: parsed.role,
      zone: parsed.zone,
      hourlyRate: w.hourlyRate.toString()
    });
    setErrors({});
    setTouched({});
    setIsEditOpen(true);
  };

  const handleEditWorker = async (e) => {
    e.preventDefault();

    const allErrors = {
      name: validateField('name', form.name, true),
      phone: validateField('phone', form.phone, true),
      hourlyRate: validateField('hourlyRate', form.hourlyRate, true)
    };

    setErrors(allErrors);
    setTouched({ name: true, phone: true, hourlyRate: true });

    if (Object.values(allErrors).some(err => err !== '')) {
      showToast('Please clear validation warnings.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        phone: normalizeSriLankanPhone(form.phone),
        role: `${form.role} | ${form.zone}`,
        hourlyRate: Number(form.hourlyRate)
      };

      await axios.put(`/api/workers/${selectedWorker._id}`, payload);
      showToast('Staff member details updated.', 'success');
      setIsEditOpen(false);
      setSelectedWorker(null);
      fetchWorkers();
    } catch (err) {
      showToast('Failed to update worker details.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Deactivate Soft-Delete Modal triggers
  const handleOpenDeactivate = (w) => {
    setSelectedWorker(w);
    setIsDeactivateOpen(true);
  };

  const confirmDeactivateWorker = async () => {
    if (!selectedWorker) return;
    const isActivating = selectedWorker.status === 'inactive';
    const newStatus = isActivating ? 'active' : 'inactive';

    try {
      await axios.put(`/api/workers/${selectedWorker._id}`, { status: newStatus });
      showToast(`Worker "${selectedWorker.name}" account access locked (Inactive).`, 'success');
      setIsDeactivateOpen(false);
      setSelectedWorker(null);
      fetchWorkers();
    } catch (err) {
      showToast('Failed to update access status.', 'error');
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!selectedWorkerId || !newTask.title.trim()) return;

    try {
      await axios.post(`/api/workers/${selectedWorkerId}/tasks`, newTask);
      showToast('Task assigned successfully!', 'success');
      setNewTask({ title: '', description: '', dueDate: '' });
      fetchWorkers();
    } catch (err) {
      showToast('Failed to assign task.', 'error');
    }
  };

  const handleUpdateTaskStatus = async (workerId, taskId, newStatus) => {
    try {
      await axios.put(`/api/workers/${workerId}/tasks/${taskId}`, { status: newStatus });
      showToast(`Task status set to: ${newStatus}`, 'success');
      fetchWorkers();
    } catch (err) {
      showToast('Failed to update task status.', 'error');
    }
  };

  const handleLogAttendance = async (workerId, status) => {
    try {
      await axios.post(`/api/workers/${workerId}/attendance`, {
        date: attendanceDate,
        status: status
      });
      showToast('Attendance logged', 'success');
      fetchWorkers();
    } catch (err) {
      showToast('Failed to log attendance.', 'error');
    }
  };

  const activeWorker = workers.find(w => w._id === selectedWorkerId);

  const getAttendanceStatusForDate = (worker, date) => {
    const log = worker.attendance?.find(a => a.date === date);
    return log ? log.status : 'unlogged';
  };

  const getInputClass = (fieldName) => {
    const baseClass = "w-full border outline-none rounded py-2 px-3 text-gray-800 input-field text-xs ";
    if (!touched[fieldName]) return baseClass + "border-gray-200 focus:border-[#2F4B3C]";
    return errors[fieldName] ? baseClass + "input-invalid" : baseClass + "input-valid";
  };

  return (
    <div className="space-y-6 text-left font-sans print:hidden">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-serif font-semibold text-[#2F4B3C]">Staff & Sourcing Roster</h2>
          <p className="text-[10px] text-gray-400 font-light">Manage physical sourcing zones, Chore task sheets, and daily attendance logs.</p>
        </div>
        <button
          onClick={() => {
            setSelectedWorker(null);
            setForm({ name: '', email: '', password: '', phone: '', role: 'Feeder', zone: 'Poultry Barn Alpha', hourlyRate: '4500' });
            setErrors({});
            setTouched({});
            setIsAddOpen(true);
          }}
          className="bg-[#2F4B3C] hover:bg-[#A65D3D] text-white font-bold text-[10px] uppercase tracking-widest py-3 px-5 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm select-none"
        >
          <Plus className="w-4 h-4" /> Add Staff Profile
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="border-b border-gray-200/80 flex gap-6 text-[10px] uppercase tracking-widest font-bold select-none">
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3.5 cursor-pointer transition-colors ${
            activeTab === 'directory' ? 'text-[#2F4B3C] border-b border-[#2F4B3C] font-black' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Staff Directory
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3.5 cursor-pointer transition-colors ${
            activeTab === 'tasks' ? 'text-[#2F4B3C] border-b border-[#2F4B3C] font-black' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Task Kanban Board
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3.5 cursor-pointer transition-colors ${
            activeTab === 'attendance' ? 'text-[#2F4B3C] border-b border-[#2F4B3C] font-black' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Attendance Log
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-gray-400 text-xs"><Loader className="w-5 h-5 animate-spin" /></div>
      ) : workers.length === 0 ? (
        <div className="bg-white rounded p-12 text-center text-gray-400 border border-gray-150/60 text-xs font-light">
          No worker records registered in database.
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB 1: Directory */}
          {activeTab === 'directory' && (
            <div className="bg-white border border-gray-200/80 rounded overflow-hidden shadow-sm">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-150/60 text-gray-400 font-bold uppercase tracking-wider text-[9px] bg-gray-50/50">
                      <th className="p-4">Staff Member</th>
                      <th className="p-4">Role & Sourcing Zone</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Wages</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((w) => {
                      const parsed = parseWorkerRoleAndZone(w.role);
                      return (
                        <tr key={w._id} className="border-b border-gray-50 hover:bg-[#F6EFE3]/30 transition-colors group">
                          <td className="p-4 font-bold text-gray-900">{w.name}</td>
                          <td className="p-4">
                            <span className="bg-[#2F4B3C]/5 text-[#2F4B3C] border border-[#2F4B3C]/10 font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-wider">
                              {parsed.role}
                            </span>
                            <span className="text-[9px] text-[#A65D3D] font-bold block pt-1">{parsed.zone}</span>
                          </td>
                          <td className="p-4 text-gray-500 font-light">{w.email}</td>
                          <td className="p-4 text-gray-500 font-light">{w.phone || 'N/A'}</td>
                          <td className="p-4 font-bold text-gray-800">{formatPrice(w.hourlyRate)}/hr</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 border rounded text-[8px] font-bold uppercase tracking-wider ${
                              w.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                            }`}>
                              {w.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {/* Hover controls */}
                            <div className="flex justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                              <button
                                onClick={() => handleOpenEdit(w)}
                                className="text-[#2F4B3C] hover:text-[#A65D3D] p-1 cursor-pointer"
                                title="Edit Role/Zone/Wage"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenDeactivate(w)}
                                className="text-red-500 hover:text-red-750 p-1 cursor-pointer"
                                title={w.status === 'inactive' ? 'Unlock Account' : 'Lock Account'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Task Kanban */}
          {activeTab === 'tasks' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-xs font-sans">
              
              <div className="lg:col-span-4 space-y-6">
                {/* Select Staff */}
                <div className="bg-white border border-gray-150/60 rounded p-5 shadow-sm space-y-3">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Employee Profile</label>
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="w-full bg-white border border-gray-200 outline-none rounded py-2 px-3 text-xs font-bold text-gray-700 cursor-pointer"
                  >
                    {workers.map(w => (
                      <option key={w._id} value={w._id}>{w.name} — {parseWorkerRoleAndZone(w.role).role}</option>
                    ))}
                  </select>
                </div>

                {/* Create Task */}
                <div className="bg-white border border-gray-150/60 rounded p-5 shadow-sm space-y-4">
                  <h4 className="font-serif text-xs font-semibold text-[#2F4B3C] border-b border-gray-50 pb-2">Assign Sourcing Chore</h4>
                  <form onSubmit={handleAssignTask} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-400 font-bold block uppercase">Task Description</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Gather Barn B eggs, Clean dome net"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        className="w-full border border-gray-200 focus:border-[#2F4B3C] outline-none rounded py-1.5 px-3 text-gray-800 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-400 font-bold block uppercase">Instructions / Details</label>
                      <input
                        type="text"
                        placeholder="Details..."
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        className="w-full border border-gray-200 focus:border-[#2F4B3C] outline-none rounded py-1.5 px-3 text-gray-800 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-400 font-bold block uppercase">Due Date</label>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                        className="w-full border border-gray-200 focus:border-[#2F4B3C] outline-none rounded py-1.5 px-3 text-gray-800 text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#2F4B3C] hover:bg-[#A65D3D] text-white font-bold py-2 rounded text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Assign Task
                    </button>
                  </form>
                </div>
              </div>

              {/* Kanban columns */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                
                {/* To Do */}
                <div className="bg-[#F6EFE3]/50 border border-gray-150/60 rounded p-4 space-y-4">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">To Do ({activeWorker?.tasks?.filter(t => t.status === 'todo').length || 0})</span>
                  
                  <div className="space-y-3">
                    {activeWorker?.tasks?.filter(t => t.status === 'todo').map(task => (
                      <div key={task._id} className="bg-white border border-gray-150/60 rounded p-4 shadow-sm space-y-3">
                        <h4 className="font-bold text-gray-900 leading-tight text-xs">{task.title}</h4>
                        {task.description && <p className="text-[10px] text-gray-400 font-light leading-relaxed">"{task.description}"</p>}
                        <button
                          onClick={() => handleUpdateTaskStatus(activeWorker._id, task._id, 'in_progress')}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded border border-amber-200 transition-colors text-[9px] cursor-pointer"
                        >
                          Start Task &rarr;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* In Progress */}
                <div className="bg-[#F6EFE3]/50 border border-gray-150/60 rounded p-4 space-y-4">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">In Progress ({activeWorker?.tasks?.filter(t => t.status === 'in_progress').length || 0})</span>
                  
                  <div className="space-y-3">
                    {activeWorker?.tasks?.filter(t => t.status === 'in_progress').map(task => (
                      <div key={task._id} className="bg-white border border-gray-150/60 rounded p-4 shadow-sm space-y-3">
                        <h4 className="font-bold text-gray-900 leading-tight text-xs">{task.title}</h4>
                        {task.description && <p className="text-[10px] text-gray-400 font-light leading-relaxed">"{task.description}"</p>}
                        <button
                          onClick={() => handleUpdateTaskStatus(activeWorker._id, task._id, 'completed')}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded border border-emerald-200 transition-colors text-[9px] cursor-pointer"
                        >
                          Complete ✓
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Completed */}
                <div className="bg-[#F6EFE3]/50 border border-gray-150/60 rounded p-4 space-y-4">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Completed ({activeWorker?.tasks?.filter(t => t.status === 'completed').length || 0})</span>
                  
                  <div className="space-y-3">
                    {activeWorker?.tasks?.filter(t => t.status === 'completed').map(task => (
                      <div key={task._id} className="bg-white border border-gray-150/60 rounded p-4 opacity-75 shadow-sm space-y-2">
                        <h4 className="font-bold text-gray-500 line-through leading-tight text-xs">{task.title}</h4>
                        <span className="text-[8px] bg-emerald-50 text-emerald-850 font-bold px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">Completed</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: Attendance Check */}
          {activeTab === 'attendance' && (
            <div className="bg-white border border-gray-200/80 rounded p-6 shadow-sm space-y-6 select-none">
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="text-sm font-serif font-semibold text-[#2F4B3C] flex items-center gap-2">
                  <Calendar className="w-4.5 h-4.5 text-[#A65D3D]" /> Daily Attendance Check
                </h3>
                
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-gray-505">Roster Date:</span>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="border border-gray-200 focus:border-[#2F4B3C] outline-none rounded py-1.5 px-3 text-xs bg-white cursor-pointer"
                  />
                </div>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-150/60 text-gray-400 font-bold uppercase tracking-wider text-[9px] bg-gray-50/50">
                      <th className="p-4">Employee</th>
                      <th className="p-4">Sourcing Role</th>
                      <th className="p-4">Log Status</th>
                      <th className="p-4 text-right">Check Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((w) => {
                      const status = getAttendanceStatusForDate(w, attendanceDate);
                      return (
                        <tr key={w._id} className="border-b border-gray-50 hover:bg-[#F6EFE3]/30 transition-colors">
                          <td className="p-4 font-bold text-gray-900">{w.name}</td>
                          <td className="p-4 text-gray-500 font-light">{parseWorkerRoleAndZone(w.role).role}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 border rounded text-[8px] font-bold uppercase tracking-wider ${
                              status === 'present' ? 'bg-emerald-50 text-emerald-850 border-emerald-100' :
                              status === 'absent' ? 'bg-rose-50 text-rose-800 border-rose-100' :
                              status === 'leave' ? 'bg-amber-50 text-amber-800 border-amber-100' :
                              'bg-gray-50 text-gray-500 border-gray-200'
                            }`}>
                              {status === 'unlogged' ? 'unlogged' : status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-1 shrink-0">
                            <button
                              onClick={() => handleLogAttendance(w._id, 'present')}
                              className={`p-1.5 border rounded cursor-pointer inline-flex ${status === 'present' ? 'bg-emerald-700 text-white border-emerald-600' : 'bg-white hover:bg-emerald-50 text-gray-400 border-gray-200'}`}
                              title="Mark Present"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleLogAttendance(w._id, 'absent')}
                              className={`p-1.5 border rounded cursor-pointer inline-flex ${status === 'absent' ? 'bg-rose-700 text-white border-rose-600' : 'bg-white hover:bg-rose-50 text-gray-400 border-gray-200'}`}
                              title="Mark Absent"
                            >
                              ✕
                            </button>
                            <button
                              onClick={() => handleLogAttendance(w._id, 'leave')}
                              className={`px-2.5 py-1 border rounded cursor-pointer inline-flex text-[9px] font-bold tracking-wider ${status === 'leave' ? 'bg-amber-600 text-white border-amber-500' : 'bg-white hover:bg-amber-50 text-gray-400 border-gray-200'}`}
                              title="Mark Leave"
                            >
                              L
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ADD WORKER MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm select-none">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-gray-150/60 shadow-2xl relative animate-fade-in-up">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-serif text-sm font-bold text-[#2F4B3C]">Register Staff Member</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={handleAddWorker} className="space-y-4 text-xs text-gray-650 select-text">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  onBlur={handleInputBlur}
                  className={getInputClass('name')}
                />
                {touched.name && errors.name && (
                  <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.name}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    onBlur={handleInputBlur}
                    className={getInputClass('email')}
                  />
                  {touched.email && errors.email && (
                    <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.email}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleFormChange}
                    onBlur={handleInputBlur}
                    className={getInputClass('password')}
                  />
                  {touched.password && errors.password && (
                    <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.password}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder={PHONE_PLACEHOLDER}
                    value={form.phone}
                    onChange={handleFormChange}
                    onBlur={handleInputBlur}
                    className={getInputClass('phone')}
                  />
                  {touched.phone && errors.phone && (
                    <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.phone}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Hourly Wage (LKR)</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={form.hourlyRate}
                    onChange={handleFormChange}
                    onBlur={handleInputBlur}
                    className={getInputClass('hourlyRate')}
                  />
                  {touched.hourlyRate && errors.hourlyRate && (
                    <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.hourlyRate}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-505 uppercase block tracking-wider">Sourcing Role</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleFormChange}
                    className="w-full border border-gray-200 outline-none rounded py-2 px-3 text-gray-800 text-xs bg-white cursor-pointer font-bold"
                  >
                    <option value="Poultry Supervisor">Poultry Supervisor</option>
                    <option value="Hygienic Packer">Hygienic Packer</option>
                    <option value="Dome Fish Curator">Dome Fish Curator</option>
                    <option value="Feeder">Feeder</option>
                    <option value="Delivery Dispatcher">Delivery Dispatcher</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-505 uppercase block tracking-wider">Physical Zone</label>
                  <select
                    name="zone"
                    value={form.zone}
                    onChange={handleFormChange}
                    className="w-full border border-gray-200 outline-none rounded py-2 px-3 text-gray-800 text-xs bg-white cursor-pointer font-bold"
                  >
                    {physicalZones.map((z, idx) => (
                      <option key={idx} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 select-none">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-750 font-bold py-2 px-4 rounded uppercase text-[9px] tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || Object.values(errors).some(e => e !== '')}
                  className="bg-[#2F4B3C] disabled:bg-gray-300 disabled:text-gray-500 hover:bg-[#A65D3D] text-white font-bold py-2 px-4 rounded transition-colors uppercase text-[9px] tracking-wider"
                >
                  {submitting ? 'Registering...' : 'Register Staff'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EDIT WORKER MODAL */}
      {isEditOpen && selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm select-none">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-gray-150/60 shadow-2xl relative animate-fade-in-up">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-serif text-sm font-bold text-[#2F4B3C]">Edit Staff details</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-650 cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={handleEditWorker} className="space-y-4 text-xs text-gray-650 select-text">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  onBlur={handleInputBlur}
                  className={getInputClass('name')}
                />
                {touched.name && errors.name && (
                  <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.name}
                  </span>
                )}
              </div>

              <div className="space-y-1 select-none">
                <label className="text-[9px] font-bold text-gray-500 uppercase block tracking-wider">Email (Locked)</label>
                <div className="font-mono font-bold text-gray-400 bg-gray-50 border border-gray-100 rounded py-2 px-3 text-[11px]">
                  {form.email}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder={PHONE_PLACEHOLDER}
                    value={form.phone}
                    onChange={handleFormChange}
                    onBlur={handleInputBlur}
                    className={getInputClass('phone')}
                  />
                  {touched.phone && errors.phone && (
                    <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.phone}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Hourly Wage (LKR)</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={form.hourlyRate}
                    onChange={handleFormChange}
                    onBlur={handleInputBlur}
                    className={getInputClass('hourlyRate')}
                  />
                  {touched.hourlyRate && errors.hourlyRate && (
                    <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.hourlyRate}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-505 uppercase block tracking-wider">Sourcing Role</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleFormChange}
                    className="w-full border border-gray-200 outline-none rounded py-2 px-3 text-gray-800 text-xs bg-white cursor-pointer font-bold"
                  >
                    <option value="Poultry Supervisor">Poultry Supervisor</option>
                    <option value="Hygienic Packer">Hygienic Packer</option>
                    <option value="Dome Fish Curator">Dome Fish Curator</option>
                    <option value="Feeder">Feeder</option>
                    <option value="Delivery Dispatcher">Delivery Dispatcher</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-550 uppercase block tracking-wider">Physical Zone</label>
                  <select
                    name="zone"
                    value={form.zone}
                    onChange={handleFormChange}
                    className="w-full border border-gray-200 outline-none rounded py-2 px-3 text-gray-800 text-xs bg-white cursor-pointer font-bold"
                  >
                    {physicalZones.map((z, idx) => (
                      <option key={idx} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 select-none">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-755 font-bold py-2 px-4 rounded uppercase text-[9px] tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || Object.values(errors).some(e => e !== '')}
                  className="bg-[#2F4B3C] disabled:bg-gray-300 disabled:text-gray-500 hover:bg-[#A65D3D] text-white font-bold py-2 px-4 rounded uppercase text-[9px] tracking-wider cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Updates'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DEACTIVATE LOCK WORKER MODAL */}
      {isDeactivateOpen && selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
          <div className="bg-white rounded-xl border border-gray-200 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif text-sm font-bold text-[#2F4B3C] flex items-center gap-1.5">
              <ShieldAlert className="w-4.5 h-4.5 text-[#A65D3D]" /> Access Lock Confirmation
            </h3>
            
            <p className="text-xs text-gray-500 font-light leading-relaxed">
              Are you sure you want to {selectedWorker.status === 'inactive' ? 'unlock' : 'lock'} access credentials for worker **{selectedWorker.name}**?
              {selectedWorker.status === 'inactive' ? ' Unlocking will restore their portal access and shift tracking.' : ' Locking suspends all shift chore logins immediately but retains history.'}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setIsDeactivateOpen(false); setSelectedWorker(null); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded uppercase text-[9px] tracking-wider cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={confirmDeactivateWorker}
                className="bg-[#2F4B3C] hover:bg-[#A65D3D] text-white font-bold py-2 px-4 rounded uppercase text-[9px] tracking-wider cursor-pointer"
              >
                {selectedWorker.status === 'inactive' ? 'Restore Portal Access' : 'Lock Credentials'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminWorkers;
