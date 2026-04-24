import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Zap, LogOut, Target, Clock, Keyboard, Wifi, Coffee, ListTodo, CheckCircle2 
} from 'lucide-react';

/**
 * SHARED COMPONENT: QuickStat
 */
const QuickStat = ({ icon, label, value, color }) => (
  <div className={`${color} p-6 rounded-2xl border border-slate-200 flex items-center gap-5 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group`}>
    <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
    <div className="text-left">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

const EmployeeTerminal = ({ user, onLogout }) => {
  const [status, setStatus] = useState('active');
  const [secondsActive, setSecondsActive] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ keys: 8420 });

  // 1. Fetch manager-assigned tasks
  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/tasks?employee_id=${user.id}`);
      setTasks(res.data);
    } catch (err) {
      console.error("Cloud Task Sync Failed");
    }
  }, [user.id]);

  useEffect(() => {
    fetchTasks();
    const i = setInterval(fetchTasks, 10000);
    return () => clearInterval(i);
  }, [fetchTasks]);

  const toggleTask = async (taskId, currentDone) => {
    try {
      await axios.patch('http://127.0.0.1:5000/api/tasks/toggle', { task_id: taskId, done: !currentDone });
      fetchTasks();
    } catch (err) {
      console.error("Task Update Failed");
    }
  };

  // 2. Automated Idle Detection (5 min)
  useEffect(() => {
    let idleTimer;
    const resetTimer = () => {
      if (status === 'idle') setStatus('active');
      clearTimeout(idleTimer);
      if (status !== 'on_break') idleTimer = setTimeout(() => setStatus('idle'), 300000);
    };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    resetTimer();
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      clearTimeout(idleTimer);
    };
  }, [status]);

  useEffect(() => {
    let timer;
    if (status === 'active') timer = setInterval(() => {
      setSecondsActive(prev => prev + 1);
      if (Math.random() > 0.8) setStats(s => ({ ...s, keys: s.keys + 1 }));
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  // 3. Automated Pulse Synchronization
  const sendHeartbeat = useCallback(async () => {
    try {
      await axios.post('http://127.0.0.1:5000/api/heartbeat', { 
        employee_id: user.id, 
        status: status, 
        metrics: stats 
      });
    } catch (err) {
      console.error("Uplink Handshake Interrupted");
    }
  }, [status, user.id, stats]);

  useEffect(() => {
    const interval = setInterval(sendHeartbeat, 10000);
    sendHeartbeat();
    return () => clearInterval(interval);
  }, [sendHeartbeat]);

  const progressPercent = Math.min(Math.round((secondsActive / 28800) * 100), 100);
  const formatTime = (s) => `${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor((s%3600)/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden">
      <nav className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm font-bold">W</div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">WorkPulse Terminal</h1>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
             <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-amber-400'} animate-pulse`}></div>
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{status}</span>
           </div>
           <div className="text-right border-l pl-6 border-slate-100">
             <p className="text-xs font-bold text-slate-900 leading-none">{user.name}</p>
             <p className="text-[10px] text-slate-400 mt-1 font-medium">Cluster Manager: {user.manager_id}</p>
           </div>
           <button onClick={onLogout} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><LogOut size={18} /></button>
        </div>
      </nav>
      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <QuickStat icon={<Target className="text-blue-600"/>} label="Daily Goal" value={`${progressPercent}%`} color="bg-white" />
           <QuickStat icon={<Clock className="text-slate-600"/>} label="Session Uptime" value={formatTime(secondsActive)} color="bg-white" />
           <QuickStat icon={<Keyboard className="text-amber-500"/>} label="Activity Score" value={stats.keys.toLocaleString()} color="bg-white" />
           <QuickStat icon={<Wifi className="text-emerald-500"/>} label="Cloud Uplink" value="STABLE" color="bg-white" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          <div className="lg:col-span-5 space-y-8">
             <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm flex flex-col items-center">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-10 tracking-widest">Neural Pulse</h3>
                <div className="text-6xl font-bold text-slate-900 mb-10">{progressPercent}%</div>
                <button onClick={() => setStatus(status === 'on_break' ? 'active' : 'on_break')} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase flex justify-center items-center gap-2 hover:bg-slate-200">
                   <Coffee size={16} /> {status === 'on_break' ? 'End Break' : 'Take Break'}
                </button>
             </div>
          </div>

          <div className="lg:col-span-7 space-y-8">
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <h3 className="text-sm font-bold text-slate-900 uppercase mb-6 flex items-center gap-2 tracking-widest"><ListTodo size={18} className="text-blue-600" /> Current Assignments</h3>
                <div className="space-y-3">
                   {tasks.length === 0 ? <p className="text-sm text-slate-400 italic">No missions deployed to your node by {user.manager_id}...</p> : tasks.map(task => (
                     <div key={task.id} onClick={() => toggleTask(task.id, task.done)} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:border-blue-200 transition-all text-left">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${task.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}`}>
                           {task.done && <CheckCircle2 size={12} />}
                        </div>
                        <span className={`text-sm font-medium ${task.done ? 'text-slate-300 line-through' : 'text-slate-600'}`}>{task.text}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeTerminal;