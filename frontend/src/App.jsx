import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Users, Clock, Activity, AlertCircle, Search, Bell, User, 
  LogOut, CheckCircle2, MoreVertical, ChevronRight, TrendingUp, Mail, 
  BarChart2, Settings, Calendar, Briefcase, Lock, ArrowRight, ShieldCheck, 
  Cloud, Monitor, Eye, ArrowLeft, Filter, Zap, Globe, X, MousePointer2, 
  Keyboard, ChevronLeft, Target, Laptop, Wifi, Trophy, Download, Plus, 
  BarChart3, PieChart, RefreshCcw, ListTodo, DollarSign, Trash2, Send, BellRing,
  DatabaseZap, ServerCrash, Phone, Building2, UserCircle2, CalendarDays, 
  Info, History, ShieldAlert, CheckCircle, Hourglass, XCircle, Megaphone,
  FolderKanban, Layers, Gauge, ActivitySquare, Timer, Database, Terminal,
  LineChart, AreaChart, BoxSelect, Cpu, BarChart, Workflow, Maximize2, Settings2,
  ChevronDown, ListFilter, SlidersHorizontal, Mouse, PlusCircle
} from 'lucide-react';

/** * ============================================================================
 * SHARED UI COMPONENTS (Refined Scaling)
 * ============================================================================
 */

const QuickStat = ({ icon, label, value, color }) => (
  <div className={`${color} p-4 rounded-xl border border-slate-200 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer bg-white`}>
    <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
    <div className="text-left font-sans text-slate-900">
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-lg font-black">{value}</p>
    </div>
  </div>
);

const PerformanceRow = ({ name, value, color = "bg-blue-600" }) => (
  <div className="space-y-2 text-left font-sans">
    <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
      <span>{name}</span><span className={`${color.replace('bg-', 'text-')} font-black`}>{value}%</span>
    </div>
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-700 ease-out`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

const GoogleInput = ({ label, type = "text", value, onChange, placeholder, required = true, hint, icon: Icon }) => (
  <div className="relative w-full group text-left font-sans">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
      {Icon && <Icon size={16} />}
    </div>
    <input
      required={required} type={type} value={value} onChange={onChange} placeholder={placeholder}
      className={`peer w-full ${Icon ? 'pl-10' : 'px-3'} py-3 pt-4 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all placeholder-transparent font-medium`}
    />
    <label className={`absolute ${Icon ? 'left-10' : 'left-3'} top-3 text-slate-500 text-sm pointer-events-none transition-all 
      peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-blue-600 
      peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-[10px]`}>
      {label}
    </label>
    {hint && <p className="text-[9px] mt-1 text-slate-400 font-medium px-1 uppercase tracking-wider">{hint}</p>}
  </div>
);

/** * ============================================================================
 * EMPLOYEE SIDE CODE (Compact Dashboard)
 * ============================================================================
 */

const EmployeeTerminal = ({ user, onLogout }) => {
  const [status, setStatus] = useState('active');
  const [secondsActive, setSecondsActive] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ keys: 0 });
  const [activeTab, setActiveTab] = useState('Terminal');
  const [activityLogs, setActivityLogs] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ type: 'Casual Leave', reason: '', days: 1 });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveStatus, setLeaveStatus] = useState({ type: '', message: '' });

  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/tasks?employee_id=${user.id}`);
      setTasks(res.data);
    } catch (err) { console.error("WorkPulseTasks Sync Error"); }
  }, [user.id]);

  const fetchMyLeaves = useCallback(async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/leave/list?employee_id=${user.id}`);
      setLeaveRequests(res.data);
    } catch (err) { console.error("WorkPulseLeave Error"); }
  }, [user.id]);

  useEffect(() => {
    fetchTasks();
    fetchMyLeaves();
    const i = setInterval(() => { fetchTasks(); fetchMyLeaves(); }, 4000);
    return () => clearInterval(i);
  }, [fetchTasks, fetchMyLeaves]);

  useEffect(() => {
    const handleActivity = () => {
      setStats(prev => ({ ...prev, keys: prev.keys + 1 }));
      if (status === 'idle') setStatus('active');
    };
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    return () => {
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
    };
  }, [status]);

  useEffect(() => {
    let timer;
    if (status === 'active') timer = setInterval(() => {
      setSecondsActive(prev => prev + 1);
      if (secondsActive % 60 === 0 && secondsActive > 0) {
        setActivityLogs(prev => [`${new Date().toLocaleTimeString()}: Verified`, ...prev].slice(0, 10));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [status, secondsActive]);

  const sendHeartbeat = useCallback(async () => {
    try {
      await axios.post('http://127.0.0.1:5000/api/heartbeat', { 
        employee_id: user.id, status: status, metrics: stats 
      });
    } catch (err) { console.error("Pulse Failed"); }
  }, [status, user.id, stats]);

  useEffect(() => {
    const interval = setInterval(sendHeartbeat, 3000);
    sendHeartbeat();
    return () => clearInterval(interval);
  }, [sendHeartbeat]);

  const submitLeave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLeaveStatus({ type: '', message: '' });
    try {
      const payload = {
        id: `LV-${user.id}-${Date.now()}`,
        ...leaveForm,
        days: parseInt(leaveForm.days),
        employee_id: user.id,
        manager_id: user.manager_id,
        name: user.name,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };
      await axios.post('http://127.0.0.1:5000/api/leave/request', payload);
      setLeaveStatus({ type: 'success', message: 'Submitted to AWS.' });
      setLeaveForm({ type: 'Casual Leave', reason: '', days: 1 });
      fetchMyLeaves();
      setTimeout(() => setLeaveStatus({ type: '', message: '' }), 3000);
    } catch (err) { setLeaveStatus({ type: 'error', message: 'Uplink failed.' }); }
    finally { setIsSubmitting(false); }
  };

  const toggleTask = async (taskId, currentDone) => {
    try {
      await axios.patch('http://127.0.0.1:5000/api/tasks/toggle', { task_id: taskId, done: !currentDone });
      fetchTasks();
    } catch (err) { console.error("Task Error"); }
  };

  const formatTime = (s) => `${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor((s%3600)/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const progressPercent = Math.min(Math.round((secondsActive / 28800) * 100), 100);

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden text-left text-slate-900">
      <nav className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md font-black text-lg">W</div>
          <h1 className="text-base font-black leading-none uppercase tracking-tighter">WorkPulse</h1>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
           <button onClick={() => setActiveTab('Terminal')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === 'Terminal' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>Terminal</button>
           <button onClick={() => setActiveTab('Absence')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === 'Absence' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>Leave Hub</button>
           <button onClick={() => setActiveTab('Profile')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === 'Profile' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>Identity</button>
           <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
           <button onClick={onLogout} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"><LogOut size={16} /></button>
        </div>
      </nav>

      {activeTab === 'Terminal' && (
        <main className="flex-1 p-6 overflow-y-auto max-w-6xl mx-auto w-full space-y-6 animate-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-4 gap-4">
            <QuickStat icon={<Target size={18} className="text-blue-600"/>} label="Daily Goal" value={`${progressPercent}%`} color="bg-white" />
            <QuickStat icon={<Clock size={18} className="text-slate-600"/>} label="Uptime" value={formatTime(secondsActive)} color="bg-white" />
            <QuickStat icon={<Keyboard size={18} className="text-amber-500"/>} label="Index" value={stats.keys.toLocaleString()} color="bg-white" />
            <QuickStat icon={<Wifi size={18} className="text-emerald-500"/>} label="Handshake" value="ACTIVE" color="bg-white" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center relative overflow-hidden text-center">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Neural Pulse</h3>
                  <div className="text-6xl font-black text-slate-900 mb-2 tracking-tighter leading-none">{progressPercent}%</div>
                  <div className="w-16 h-1.5 bg-blue-600 rounded-full mb-8 shadow-sm"></div>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-200 shadow-inner">
                    <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></div>
                    <span className="text-[10px] font-black uppercase">{status}</span>
                  </div>
              </div>
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white text-left">
                <h3 className="text-[9px] font-black uppercase text-blue-400 mb-4 flex items-center gap-2 uppercase tracking-widest"><History size={12}/> Session Log</h3>
                <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2 text-[10px] font-mono text-slate-400">
                   {activityLogs.length === 0 ? <p className="italic">Initiating...</p> : activityLogs.map((log, i) => <div key={i} className="flex gap-3 border-l border-white/10 pl-3 py-0.5 animate-in slide-in-from-left-1">{log}</div>)}
                </div>
              </div>
            </div>
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-left">
                <h3 className="text-[10px] font-black uppercase text-slate-900 mb-6 flex items-center gap-3 font-black uppercase tracking-widest"><ListTodo size={18} className="text-blue-600" /> Current Missions</h3>
                <div className="space-y-3">
                  {tasks.length === 0 ? <p className="text-sm italic text-slate-300 py-10 text-center border-2 border-dashed rounded-2xl">Awaiting payload from Cluster Admin...</p> : tasks.map(task => (
                    <div key={task.id} onClick={() => !task.done && toggleTask(task.id, task.done)} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${task.done ? 'bg-slate-50 opacity-60' : 'bg-white shadow-sm hover:border-blue-400 cursor-pointer'}`}>
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${task.done ? 'bg-emerald-50 border-emerald-500 text-white' : 'bg-white border-slate-200'}`}>{task.done && <CheckCircle2 size={14} />}</div>
                          <span className={`font-bold text-sm ${task.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.text}</span>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        </main>
      )}

      {activeTab === 'Absence' && (
        <main className="flex-1 p-6 overflow-y-auto max-w-6xl mx-auto w-full animate-in slide-in-from-right-2 duration-300">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
              <div className="lg:col-span-5">
                 <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-left">
                    <h2 className="text-2xl font-black mb-6 uppercase italic tracking-tighter">Absence Protocol</h2>
                    {leaveStatus.message && <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-xs font-bold ${leaveStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600'}`}>{leaveStatus.message}</div>}
                    <form onSubmit={submitLeave} className="space-y-6">
                       <GoogleInput label="Category" icon={Layers} value={leaveForm.type} onChange={e => setLeaveForm({...leaveForm, type: e.target.value})} />
                       <GoogleInput label="Days" type="number" icon={Clock} value={leaveForm.days} onChange={e => setLeaveForm({...leaveForm, days: e.target.value})} />
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest uppercase">Justification</label>
                          <textarea required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none h-24 shadow-inner text-sm" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}></textarea>
                       </div>
                       <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all">{isSubmitting ? <RefreshCcw size={14} className="animate-spin" /> : 'Transmit to AWS'}</button>
                    </form>
                 </div>
              </div>
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col text-left">
                 <div className="p-6 border-b border-slate-50 font-black text-lg flex justify-between items-center">
                    <span>Registry</span><span className="text-[9px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase font-black tracking-widest">WorkPulseLeave</span>
                 </div>
                 <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                    {leaveRequests.length === 0 ? <p className="text-center py-20 text-slate-300 italic uppercase">No protocols found</p> : leaveRequests.map(req => (
                      <div key={req.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-left hover:bg-white hover:shadow-lg transition-all duration-300">
                         <div className="text-left">
                            <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{req.type} — {req.days} Day(s)</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 italic leading-relaxed">"{req.reason}"</p>
                         </div>
                         <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${req.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600'}`}>{req.status}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </main>
      )}

      {activeTab === 'Profile' && (
        <main className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full animate-in slide-in-from-right-2 duration-300">
          <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm text-left">
             <div className="flex items-center gap-8 mb-10 pb-10 border-b border-slate-100 text-left">
               <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-4xl shadow-xl">{user.id.charAt(0)}</div>
               <div className="text-left">
                 <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-1 italic uppercase text-left">{user.name}</h2>
                 <p className="text-sm font-black text-blue-600 uppercase tracking-[0.15em]">{user.position}</p>
                 <div className="flex items-center gap-3 mt-4 text-left">
                   <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg font-black text-[9px] text-slate-500 uppercase"><ShieldCheck size={14} className="text-emerald-500"/>{user.id}</div>
                   <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg font-black text-[9px] text-slate-500 uppercase"><Wifi size={14} className="text-blue-500"/>CONNECTED</div>
                 </div>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-10 text-left">
                <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3 uppercase">Section</label><div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 font-black text-slate-800 text-sm shadow-inner italic uppercase"><Building2 size={20} className="text-blue-600" /> {user.department}</div></div>
                <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3 uppercase">Cluster Admin</label><div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 font-black text-slate-800 text-sm shadow-inner italic uppercase"><UserCircle2 size={20} className="text-blue-600" /> {user.manager_id}</div></div>
             </div>
          </div>
        </main>
      )}
    </div>
  );
};

/** * ============================================================================
 * MANAGER SIDE CODE (Analytical Explorer Module - Snowflake Model)
 * ============================================================================
 */

const ManagerDashboard = ({ user, onLogout }) => {
  const [employees, setEmployees] = useState([]);
  const [taskForm, setTaskForm] = useState({ target: '', text: '' });
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // SNOWFLAKE ANALYTICS ENGINE STATES
  const [chartType, setChartType] = useState('Bar chart');
  const [xAxis, setXAxis] = useState('HOUR_SEGMENT');
  const [yAxis, setYAxis] = useState('ROW_ID');
  const [aggregate, setAggregate] = useState('Sum');
  const [groupBy, setGroupBy] = useState('None');
  const [sort, setSort] = useState('None');

  const [historicalData, setHistoricalData] = useState([
    { label: '08:00', value: 45 }, { label: '09:00', value: 72 }, { label: '10:00', value: 88 },
    { label: '11:00', value: 92 }, { label: '12:00', value: 65 }, { label: '13:00', value: 40 },
    { label: '14:00', value: 85 }, { label: '15:00', value: 95 }, { label: '16:00', value: 98 }
  ]);

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [projects, setProjects] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/admin/stats?manager_id=${user.id}`);
      setEmployees(res.data);
      const leaveRes = await axios.get(`http://127.0.0.1:5000/api/leave/list?manager_id=${user.id}`);
      setLeaveRequests(leaveRes.data.filter(req => req.status === 'Pending'));
      const projRes = await axios.get(`http://127.0.0.1:5000/api/projects`);
      setProjects(projRes.data);
    } catch (err) { console.error("Cloud Retrieval Error"); }
  }, [user.id]);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 5000);
    return () => clearInterval(i);
  }, [fetchData]);

  const deployTask = async (e) => {
    e.preventDefault();
    if (!taskForm.target || !taskForm.text) return;
    try {
      await axios.post('http://127.0.0.1:5000/api/tasks/assign', {
        employee_id: taskForm.target, manager_id: user.id, text: taskForm.text
      });
      setTaskForm({ ...taskForm, text: '' });
    } catch (err) { console.error("Deployment Error"); }
  };

  const handleLeaveAction = async (id, status) => {
    try {
      await axios.patch('http://127.0.0.1:5000/api/leave/action', { leave_id: id, status: status });
      fetchData();
    } catch (err) { console.error("Leave Protocol Error"); }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden text-left">
      {/* HUB SIDEBAR */}
      <aside className="w-64 bg-slate-900 h-full flex flex-col shrink-0 text-left">
        <div className="p-8 border-b border-white/5 text-white">
          <span className="text-2xl font-black flex items-center gap-3 tracking-tighter uppercase italic text-blue-400"><ShieldCheck size={28}/> Insightful</span>
          <p className="text-[9px] text-slate-500 font-bold uppercase mt-3 opacity-60">Admin Node: {user.id}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4 text-left">
           <button onClick={() => { setActiveTab('Overview'); setSelectedEmployee(null); }} className={`w-full p-3 rounded-xl flex items-center gap-4 text-[10px] font-black uppercase transition-all duration-200 ${activeTab === 'Overview' && !selectedEmployee ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><LayoutDashboard size={16}/> Overview</button>
           <button onClick={() => { setActiveTab('Tasks'); setSelectedEmployee(null); }} className={`w-full p-3 rounded-xl flex items-center gap-4 text-[10px] font-black uppercase transition-all duration-200 ${activeTab === 'Tasks' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><Send size={16}/> Missions</button>
           <button onClick={() => { setActiveTab('Leaves'); setSelectedEmployee(null); }} className={`w-full p-3 rounded-xl flex items-center gap-4 text-[10px] font-black uppercase transition-all duration-200 ${activeTab === 'Leaves' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><CalendarDays size={16}/> Absence Hub</button>
           <button onClick={() => { setActiveTab('Projects'); setSelectedEmployee(null); }} className={`w-full p-3 rounded-xl flex items-center gap-4 text-[10px] font-black uppercase transition-all duration-200 ${activeTab === 'Projects' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><FolderKanban size={16}/> Projects</button>
        </nav>
        <div className="p-6 border-t border-white/5 text-left"><button onClick={onLogout} className="w-full p-3 text-slate-500 font-black text-[9px] uppercase hover:text-rose-400 transition-colors flex items-center gap-3"><LogOut size={16}/> Terminate</button></div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col bg-white">
         {selectedEmployee ? (
           <div className="flex-1 flex flex-col bg-[#0F172A] text-slate-300 animate-in slide-in-from-bottom-2 duration-300">
              {/* SNOWFLAKE TOP HEADER */}
              <header className="h-14 border-b border-white/10 px-6 flex items-center justify-between shrink-0 bg-[#1E293B]/50 backdrop-blur-md">
                 <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedEmployee(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"><ArrowLeft size={16}/></button>
                    <div className="h-6 w-[1px] bg-white/10"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2"><Database size={12}/> Analysis Worksheet</span>
                    <span className="text-xs font-bold text-white tracking-tight">/ behavioral_sync / {selectedEmployee.name}</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <button className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded uppercase hover:bg-blue-700 transition-all flex items-center gap-2"><Download size={12}/> Export .CSV</button>
                 </div>
              </header>

              <div className="flex-1 flex overflow-hidden">
                 {/* SNOWFLAKE ANALYTICAL SIDEBAR */}
                 <aside className="w-72 border-r border-white/5 flex flex-col shrink-0 p-6 space-y-8 bg-[#111827] text-left">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest uppercase">Chart type</label>
                       <div className="relative">
                          <select value={chartType} onChange={e => setChartType(e.target.value)} className="w-full bg-[#1F2937] border border-white/10 p-2.5 rounded text-xs font-bold text-white appearance-none cursor-pointer outline-none hover:border-blue-500/50 transition-all">
                             <option>Bar chart</option><option>Line chart</option><option>Area chart</option><option>Pie chart</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                       </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest uppercase">X-axis</label>
                       <div className="relative">
                          <select value={xAxis} onChange={e => setXAxis(e.target.value)} className="w-full bg-[#1F2937] border border-white/10 p-2.5 rounded text-xs font-bold text-white appearance-none cursor-pointer outline-none">
                             <option>HOUR_SEGMENT</option><option>DESIGNATION</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                       </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest uppercase">Sort</label>
                       <div className="relative">
                          <select value={sort} onChange={e => setSort(e.target.value)} className="w-full bg-[#1F2937] border border-white/10 p-2.5 rounded text-xs font-bold text-white appearance-none cursor-pointer outline-none">
                             <option>None</option><option>Time Asc</option><option>Time Desc</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                       </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest uppercase">Y-axis</label>
                       <div className="relative">
                          <select value={yAxis} onChange={e => setYAxis(e.target.value)} className="w-full bg-[#1F2937] border border-white/10 p-2.5 rounded text-xs font-bold text-white appearance-none cursor-pointer outline-none">
                             <option>ROW_ID</option><option>ACTIVITY_SCORE</option><option>UPLINK_STABILITY</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                       </div>
                       <button className="w-full py-1 text-[10px] font-black uppercase text-blue-400 hover:text-blue-300 flex items-center justify-center gap-2"><Plus size={12}/> Add column</button>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5 text-left">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-left uppercase">Aggregate</label>
                       <div className="relative">
                          <select value={aggregate} onChange={e => setAggregate(e.target.value)} className="w-full bg-[#1F2937] border border-white/10 p-2.5 rounded text-xs font-bold text-white appearance-none cursor-pointer outline-none">
                             <option>Sum</option><option>Average</option><option>Median</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                       </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest uppercase">Group by</label>
                       <div className="relative">
                          <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="w-full bg-[#1F2937] border border-white/10 p-2.5 rounded text-xs font-bold text-white appearance-none cursor-pointer outline-none">
                             <option>None</option><option>DEPARTMENT</option><option>OPERATOR_KEY</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                       </div>
                    </div>
                 </aside>

                 {/* MAIN ANALYTICAL VIEWPORT */}
                 <div className="flex-1 p-12 flex flex-col bg-[#0F172A] relative overflow-hidden text-left">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                    
                    <div className="flex justify-between items-end mb-16 relative z-10 text-left">
                       <div className="text-left">
                          <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic text-left">{selectedEmployee.name}</h3>
                          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.4em] mt-2">Operator Activity Analysis Engine</p>
                       </div>
                       <div className="flex gap-8">
                          <div className="text-right px-6 border-r border-white/5">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest uppercase">Efficiency Rank</p>
                             <p className="text-xl font-black text-emerald-400 italic">OPTIMAL</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest uppercase">Region Sync</p>
                             <p className="text-xl font-black text-white italic uppercase">ap-south-2</p>
                          </div>
                       </div>
                    </div>

                    {/* DYNAMIC CHART VIEWPORT */}
                    <div className="flex-1 bg-black/20 rounded-[40px] border border-white/5 p-16 flex relative items-end justify-between gap-6 overflow-hidden">
                       <div className="absolute left-6 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {aggregate} of {yAxis}
                       </div>
                       <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest uppercase">
                          Measured by {xAxis}
                       </div>

                       <div className="absolute inset-0 grid grid-cols-1 grid-rows-5 pointer-events-none px-16 py-16">
                          {[1.0, 0.8, 0.6, 0.4, 0.2, 0.0].map(val => (
                             <div key={val} className="border-t border-white/5 relative"><span className="absolute -left-12 -top-2 text-[9px] font-mono text-slate-600">{val.toFixed(1)}</span></div>
                          ))}
                       </div>

                       {/* GRAPH RENDERERS */}
                       {chartType === 'Bar chart' && historicalData.map((d, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center group relative z-10">
                             <div className="w-full bg-[#3B82F6] rounded-t-sm shadow-[0_0_40px_rgba(59,130,246,0.1)] transition-all duration-700 hover:brightness-125 cursor-pointer relative" style={{ height: `${d.value}%` }}>
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-950 text-[9px] px-2 py-1 rounded font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-2xl z-50">SYNC VALUE: {d.value}.00</div>
                             </div>
                             <div className="absolute -bottom-16 rotate-90 origin-left text-[9px] font-bold text-slate-500 tracking-tighter whitespace-nowrap">NODE-TIME-{d.label.replace(':', '')}</div>
                          </div>
                       ))}

                       {chartType === 'Area chart' && (
                         <div className="absolute inset-16 flex items-end">
                            <svg className="w-full h-full overflow-visible">
                               <path 
                                  d={`M 0 400 ${historicalData.map((d, i) => `L ${i * (1000/8)} ${400 - (d.value * 3.5)}`).join(' ')} L 1000 400 Z`} 
                                  fill="url(#snow-gradient)" className="animate-in fade-in duration-1000"
                               />
                               <path d={`M 0 ${400 - (historicalData[0].value * 3.5)} ${historicalData.map((d, i) => `L ${i * (1000/8)} ${400 - (d.value * 3.5)}`).join(' ')}`} fill="none" stroke="#3b82f6" strokeWidth="4" />
                               <defs><linearGradient id="snow-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" /></linearGradient></defs>
                            </svg>
                         </div>
                       )}

                       {chartType === 'Line chart' && (
                         <div className="absolute inset-16 flex items-end">
                            <svg className="w-full h-full overflow-visible">
                               <polyline points={historicalData.map((d, i) => `${i * (1000/8)},${400 - (d.value * 3.5)}`).join(' ')} fill="none" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                               {historicalData.map((d, i) => (<circle key={i} cx={i * (1000/8)} cy={400 - (d.value * 3.5)} r="6" fill="#fff" stroke="#3b82f6" strokeWidth="2" />))}
                            </svg>
                         </div>
                       )}

                       {chartType === 'Pie chart' && (
                         <div className="flex-1 flex items-center justify-center h-full">
                            <div className="w-64 h-64 rounded-full border-[25px] border-blue-500/10 flex items-center justify-center relative">
                               <div className="absolute inset-0 rounded-full border-[25px] border-blue-500 border-r-transparent border-b-transparent -rotate-45"></div>
                               <div className="text-center"><p className="text-6xl font-black text-white italic tracking-tighter">84%</p><p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-widest uppercase">Aggregated Pattern</p></div>
                            </div>
                         </div>
                       )}
                    </div>

                    <div className="mt-12 flex justify-between items-center bg-white/5 border border-white/5 p-6 rounded-3xl text-left">
                       <div className="flex gap-10 text-left">
                          <div><p className="text-[9px] font-black text-slate-500 uppercase mb-1 uppercase">Measure: {aggregate}</p><p className="text-xl font-black text-white italic tracking-tight">Handshake Integrity Verified</p></div>
                          <div><p className="text-[9px] font-black text-slate-500 uppercase mb-1 uppercase">Pattern Match</p><p className="text-xl font-black text-blue-500 italic tracking-tight">High Consistency</p></div>
                       </div>
                       <div className="flex items-center gap-4 text-slate-500 text-[9px] font-black uppercase italic tracking-widest opacity-40">
                          <Database size={14}/> Integrated Snowflake Analytics Hub
                       </div>
                    </div>
                 </div>
              </div>
           </div>
         ) : (
           /* DEFAULT DASHBOARD VIEWS */
           <div className="p-8 space-y-8 animate-in fade-in duration-300 text-left">
             {activeTab === 'Overview' && (
               <div className="space-y-8 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                     <QuickStat icon={<Users size={20} className="text-blue-600"/>} label="Registered" value={employees.length} color="bg-white" />
                     <QuickStat icon={<Activity size={20} className="text-emerald-500"/>} label="Online Nodes" value={employees.filter(e => e.currentStatus === 'active').length} color="bg-white" />
                     <QuickStat icon={<Target size={20} className="text-amber-500"/>} label="Health" value="100%" color="bg-white" />
                  </div>
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                     <div className="p-8 border-b border-slate-100 font-black text-xl flex justify-between items-center text-slate-900 uppercase italic text-left">
                        <span>Identity Registry</span>
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full"><div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse text-left"></div><span className="text-[8px] font-black text-blue-600 uppercase uppercase tracking-widest">Live Cloud Sync</span></div>
                     </div>
                     <table className="w-full text-left">
                        <thead><tr className="bg-slate-50 text-[9px] uppercase font-black text-slate-400 border-b border-slate-100"><th className="p-5 pl-8 text-left uppercase">Identity</th><th className="p-5 text-center uppercase">Status</th><th className="p-5 text-center uppercase">Section</th><th className="p-5 text-right pr-10 uppercase">Pulse</th><th className="p-5 text-right pr-8 uppercase">Analytics</th></tr></thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium text-left">
                           {employees.length === 0 ? <tr><td colSpan="6" className="p-20 text-center text-slate-300 italic">No operators linked.</td></tr> : employees.map(emp => (
                             <tr key={emp.id} className="hover:bg-slate-50 transition-colors group text-left">
                               <td className="p-5 pl-8 text-left">
                                 <p className="font-black text-slate-900 text-sm uppercase italic text-left">{emp.id}</p>
                                 <p className="text-[10px] text-slate-400 uppercase font-black text-left">{emp.name}</p>
                               </td>
                               <td className="p-5 text-center"><span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${emp.currentStatus === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>{emp.currentStatus}</span></td>
                               <td className="p-5 text-center text-[9px] font-black uppercase text-slate-500 italic uppercase">{emp.department}</td>
                               <td className="p-5 text-right pr-10 font-mono text-[10px] text-slate-400 font-black tracking-tighter uppercase text-right">{emp.lastSeen}</td>
                               <td className="p-5 text-right pr-8">
                                 <button onClick={() => setSelectedEmployee(emp)} className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><ActivitySquare size={18}/></button>
                               </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
             )}

             {activeTab === 'Tasks' && (
                <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-left max-w-2xl mx-auto animate-in slide-in-from-bottom-4">
                   <h2 className="text-3xl font-black mb-10 tracking-tighter text-slate-900 uppercase italic text-left leading-none">Deploy mission protocol</h2>
                   <form onSubmit={deployTask} className="space-y-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 px-1 tracking-widest text-left">Target Node Designation</label>
                         <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 transition-all font-black text-slate-700 appearance-none shadow-inner text-sm italic" value={taskForm.target} onChange={e => setTaskForm({...taskForm, target: e.target.value})}>
                            <option value="">Select linked node...</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.id} — {e.name}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 px-1 tracking-widest uppercase text-left">Tactical Objective Payload</label>
                         <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl h-40 outline-none focus:ring-4 focus:ring-blue-50 transition-all font-bold text-slate-700 shadow-inner text-sm" placeholder="Specify instructions..." value={taskForm.text} onChange={e => setTaskForm({...taskForm, text: e.target.value})}></textarea>
                      </div>
                      <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-4 uppercase tracking-widest">
                         <Send size={20}/> Deploy mission
                      </button>
                   </form>
                </div>
             )}

             {activeTab === 'Leaves' && (
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-right-2 duration-300 text-left">
                  <div className="p-8 border-b border-slate-100 font-black text-xl flex justify-between items-center text-slate-900 uppercase italic">
                     <span>Absence Protocol Hub</span>
                     <span className="text-[9px] bg-amber-50 text-amber-600 px-3 py-1 rounded-full font-black uppercase tracking-widest uppercase">WorkPulseLeave Registry</span>
                  </div>
                  <div className="p-8 space-y-4 text-left">
                     {leaveRequests.length === 0 ? <p className="text-center py-20 text-slate-300 italic font-black uppercase">No protocols pending</p> : leaveRequests.map(req => (
                       <div key={req.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-left hover:bg-white hover:shadow-lg transition-all duration-300 text-left">
                          <div className="text-left">
                             <p className="text-[9px] font-black uppercase text-blue-500 uppercase">{req.type}</p>
                             <h4 className="text-lg font-black text-slate-900 tracking-tighter italic uppercase text-left">{req.name} — {req.days} Day(s)</h4>
                             <p className="text-[11px] text-slate-400 font-bold mt-1 italic text-left leading-relaxed">"{req.reason}"</p>
                          </div>
                          <div className="flex gap-3">
                             <button onClick={() => handleLeaveAction(req.id, 'Approved')} className="p-4 bg-emerald-500 text-white rounded-xl shadow-lg active:scale-90 transition-all"><CheckCircle size={20}/></button>
                             <button onClick={() => handleLeaveAction(req.id, 'Rejected')} className="p-4 bg-rose-500 text-white rounded-xl shadow-lg active:scale-90 transition-all"><XCircle size={20}/></button>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
             )}

             {activeTab === 'Projects' && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-right-2 duration-300 text-left">
                  {projects.length === 0 ? <p className="col-span-full text-center py-20 text-slate-300 font-black uppercase italic">No data in WorkPulseProjects</p> : projects.map(proj => (
                    <div key={proj.id} className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500 text-left">
                       <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-all text-left"><Layers size={80} /></div>
                       <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic mb-2 text-left">{proj.name}</h3>
                       <p className="text-[10px] text-slate-400 font-bold mb-6 italic leading-relaxed text-left uppercase font-sans">"{proj.description}"</p>
                       <div className="flex justify-between items-center pt-6 border-t border-slate-50 text-left">
                          <div><p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Priority</p><p className="text-[10px] font-black text-blue-600 uppercase text-left">{proj.priority || 'Normal'}</p></div>
                          <div className="text-right"><p className="text-[8px] font-black text-slate-300 uppercase tracking-widest text-right mb-0.5 uppercase">Completion</p><p className="text-[10px] font-black text-slate-900 text-right font-mono">{proj.completion || '0%'}</p></div>
                       </div>
                    </div>
                  ))}
               </div>
             )}
           </div>
         )}
      </main>
    </div>
  );
};

/** * ============================================================================
 * MAIN HUB (Authentication with Handshake Logic)
 * ============================================================================
 */

export default function App() {
  const [user, setUser] = useState(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [form, setForm] = useState({ id: '', password: '', name: '', manager_id: '', department: '', position: '', contact: '' });
  const [backendStatus, setBackendStatus] = useState('checking');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await axios.get('http://127.0.0.1:5000/');
        setBackendStatus('online');
      } catch (err) { setBackendStatus('offline'); }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const endpoint = isSigningUp ? 'signup' : 'login';
      const payload = { ...form, id: form.id.toUpperCase().trim(), manager_id: form.manager_id.toUpperCase().trim() };
      const res = await axios.post(`http://127.0.0.1:5000/api/auth/${endpoint}`, payload);
      if (res.data.status === 'success') {
        if (isSigningUp) {
          setSuccess('Identity created. Login to proceed.');
          setIsSigningUp(false);
          setForm(prev => ({ ...prev, password: '' }));
        } else { setUser(res.data.user); }
      }
    } catch (err) { setError(err.response?.data?.error || 'Cloud error.'); }
    finally { setLoading(false); }
  };

  if (user) {
    return user.role === 'manager' 
      ? <ManagerDashboard user={user} onLogout={() => setUser(null)} /> 
      : <EmployeeTerminal user={user} onLogout={() => setUser(null)} />;
  }

  return (
    <div className="min-h-screen w-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4 font-sans select-none overflow-hidden relative text-left">
      <div className={`w-full ${isSigningUp ? 'max-w-[700px]' : 'max-w-[400px]'} bg-white border border-slate-200 rounded-[40px] px-10 py-12 shadow-2xl z-10 relative animate-in fade-in zoom-in-95 duration-500 transition-all text-left text-slate-900`}>
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="flex items-center gap-1 mb-6 text-4xl font-black pointer-events-none tracking-tighter italic uppercase text-slate-900">
            <span className="text-blue-600">W</span><span className="text-rose-500">o</span><span className="text-amber-500">r</span><span className="text-blue-600">k</span>
            <span className="text-emerald-500 ml-1 font-sans not-italic uppercase font-black">P</span><span className="text-rose-500">u</span><span className="text-blue-600">l</span><span className="text-emerald-500">s</span><span className="text-amber-500">e</span>
          </div>
          <h2 className="text-2xl font-normal text-slate-900 mb-1 tracking-tight italic uppercase">{isSigningUp ? 'Identity Creation' : 'Terminal Uplink'}</h2>
          <p className="text-slate-400 text-sm font-normal text-center">{isSigningUp ? 'Establish node presence' : 'to continue node broadcast'}</p>
        </div>
        
        {success && <div className="mb-8 p-4 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-in zoom-in-95 shadow-sm uppercase"><CheckCircle size={16} /> {success}</div>}
        {error && <div className="mb-8 p-4 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold text-left animate-in zoom-in-95 shadow-sm uppercase"><AlertCircle size={14} className="inline mr-2" /> {error}</div>}
        
        <form onSubmit={handleAuth} className="space-y-6 text-left">
          {isSigningUp ? (
            <div className="grid grid-cols-2 gap-8 text-left">
              <div className="space-y-6 text-left">
                <GoogleInput label="Full Name" icon={UserCircle2} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                <GoogleInput label="Department" icon={Building2} value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
                <GoogleInput label="Position" icon={Briefcase} value={form.position} onChange={e => setForm({...form, position: e.target.value})} />
              </div>
              <div className="space-y-6 text-left">
                <GoogleInput label="Contact" icon={Phone} value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} />
                <GoogleInput label="Identity ID" icon={ShieldCheck} value={form.id} onChange={e => setForm({...form, id: e.target.value})} placeholder="EMP_001" hint="MGR_ for Admin" />
                {!form.id.toUpperCase().startsWith('MGR') && (
                  <GoogleInput label="Admin Key" icon={Lock} value={form.manager_id} onChange={e => setForm({...form, manager_id: e.target.value})} />
                )}
                <GoogleInput label="Secure Hash" icon={Lock} type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-left">
              <GoogleInput label="Identity ID" icon={ShieldCheck} value={form.id} onChange={e => setForm({...form, id: e.target.value})} placeholder="EMP_001" />
              <GoogleInput label="Secure Hash" icon={Lock} type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
          )}
          
          <div className="flex items-center justify-between pt-8 text-left">
            <button type="button" onClick={() => { setIsSigningUp(!isSigningUp); setError(''); setSuccess(''); }} className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline bg-transparent border-none cursor-pointer uppercase">
              {isSigningUp ? 'Sign in instead' : 'Establish Node'}
            </button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-black uppercase tracking-[0.3em] text-[10px] px-10 py-4 rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-widest">
              {loading ? <RefreshCcw className="animate-spin" size={16} /> : 'Handshake'}
            </button>
          </div>
        </form>
      </div>
      <div className="mt-12 text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] flex items-center gap-5 text-left uppercase font-black">
        <div className="flex items-center gap-3 text-left uppercase font-black">
          <div className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_emerald]' : 'bg-rose-50 animate-pulse'}`}></div>
          <span>Handshake: {backendStatus.toUpperCase()}</span>
        </div>
        <span className="opacity-10 text-xl font-normal text-left">/</span>
        <span className="text-left uppercase font-black">ap-south-2 Region</span>
      </div>
    </div>
  );
}