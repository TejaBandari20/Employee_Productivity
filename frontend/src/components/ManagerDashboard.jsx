import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Users, Activity, Target, Send, LogOut, Eye, Search, Bell, ArrowLeft 
} from 'lucide-react';

/**
 * SHARED COMPONENT: QuickStat
 */
const QuickStat = ({ icon, label, value, color, dark = false }) => (
  <div className={`${color} p-6 rounded-2xl border border-slate-200 flex items-center gap-5 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group`}>
    <div className={`p-3 ${dark ? 'bg-white/10' : 'bg-slate-50'} rounded-xl`}>{icon}</div>
    <div className="text-left">
      <p className={`text-[10px] font-bold ${dark ? 'text-white/60' : 'text-slate-500'} uppercase tracking-wider mb-0.5`}>{label}</p>
      <p className={`text-xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
    </div>
  </div>
);

/**
 * SHARED COMPONENT: PerformanceRow
 */
const PerformanceRow = ({ name, value }) => (
  <div className="space-y-3 text-left">
    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
      <span>{name}</span><span className="text-blue-600">{value}%</span>
    </div>
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
      <div className="h-full rounded-full bg-blue-600 transition-all duration-1000 ease-out" style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

const ManagerDashboard = ({ user, onLogout }) => {
  const [employees, setEmployees] = useState([]);
  const [taskForm, setTaskForm] = useState({ target: '', text: '' });
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // FIX: Fetch everyone linked to this MGR_ID (Merged Registry)
  const fetchCluster = useCallback(async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/admin/stats?manager_id=${user.id}`);
      setEmployees(res.data);
    } catch (err) {
      console.error("Cluster Scan Failed");
    }
  }, [user.id]);

  useEffect(() => {
    fetchCluster();
    const i = setInterval(fetchCluster, 5000);
    return () => clearInterval(i);
  }, [fetchCluster]);

  const deployTask = async (e) => {
    e.preventDefault();
    if (!taskForm.target || !taskForm.text) return;
    try {
      await axios.post('http://127.0.0.1:5000/api/tasks/assign', {
        employee_id: taskForm.target,
        manager_id: user.id,
        text: taskForm.text
      });
      setTaskForm({ ...taskForm, text: '' });
    } catch (err) {
      console.error("Task Deployment Failed");
    }
  };

  if (selectedEmployee) return (
    <div className="flex-1 flex flex-col h-screen bg-[#F8FAFC] animate-in slide-in-from-right-10 duration-500 font-sans">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 gap-4 shadow-sm relative z-50">
        <button onClick={() => setSelectedEmployee(null)} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><ArrowLeft size={20}/></button>
        <h2 className="text-lg font-bold text-slate-900">Node: {selectedEmployee.id}</h2>
      </header>
      <main className="p-8 space-y-8 overflow-y-auto text-left">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex items-center gap-8">
           <div className="w-32 h-32 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-4xl shadow-xl">{selectedEmployee.id.charAt(0)}</div>
           <div className="flex-1">
             <h3 className="text-4xl font-bold text-slate-900">{selectedEmployee.name}</h3>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">STATUS: {selectedEmployee.currentStatus.toUpperCase()}</p>
           </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h4 className="font-bold text-sm uppercase text-slate-800 mb-8">Node Metrics</h4>
            <PerformanceRow name="Input Consistency" value={Math.floor(Math.random() * 20) + 75} />
            <div className="mt-6"><PerformanceRow name="Availability" value={98} /></div>
        </div>
      </main>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden text-left">
      <aside className="w-64 bg-slate-900 h-full flex flex-col shrink-0">
        <div className="p-8 border-b border-white/5 text-white">
          <span className="text-xl font-bold">WorkPulse Admin</span>
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">ID: {user.id}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
           <button onClick={() => setActiveTab('Overview')} className={`w-full p-3 rounded-xl flex items-center gap-3 text-sm font-bold transition-all ${activeTab === 'Overview' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><LayoutDashboard size={18}/> Overview</button>
           <button onClick={() => setActiveTab('Tasks')} className={`w-full p-3 rounded-xl flex items-center gap-3 text-sm font-bold transition-all ${activeTab === 'Tasks' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><Send size={18}/> Assignments</button>
        </nav>
        <div className="p-4 border-t border-white/5"><button onClick={onLogout} className="w-full p-4 text-slate-500 font-bold text-xs uppercase hover:text-rose-400 transition-colors"><LogOut size={16}/> TERMINATE</button></div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
         {activeTab === 'Overview' ? (
           <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <QuickStat icon={<Users className="text-blue-600"/>} label="Team Size" value={employees.length} color="bg-white" />
                 <QuickStat icon={<Activity className="text-emerald-500"/>} label="Active Now" value={employees.filter(e => e.currentStatus === 'active').length} color="bg-white" />
                 <QuickStat icon={<Target className="text-amber-500"/>} label="Cluster Health" value="100%" color="bg-white" />
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-slate-100 font-bold text-lg flex justify-between items-center">
                    <span>Employee Registry</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Manager: {user.id}</span>
                 </div>
                 <table className="w-full text-left">
                    <thead><tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400"><th className="p-4 pl-6">ID</th><th className="p-4">Name</th><th className="p-4">Status</th><th className="p-4 text-right pr-6">Last Pulse</th><th className="p-4 text-right">Action</th></tr></thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                       {employees.length === 0 ? <tr><td colSpan="5" className="p-12 text-center text-slate-400 italic">No operators linked to your Cluster ID.</td></tr> : employees.map(emp => (
                         <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                           <td className="p-4 pl-6 font-bold text-slate-700">{emp.id}</td>
                           <td className="p-4">{emp.name}</td>
                           <td><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${emp.currentStatus === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>{emp.currentStatus}</span></td>
                           <td className="p-4 pr-6 text-right font-mono text-xs text-slate-400">{emp.lastSeen}</td>
                           <td className="p-4 text-right">
                             <button onClick={() => setSelectedEmployee(emp)} className="p-2 bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all"><Eye size={16}/></button>
                           </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
         ) : (
           <div className="max-w-2xl bg-white p-10 rounded-2xl border border-slate-200 shadow-sm text-left">
              <h2 className="text-2xl font-bold mb-8 tracking-tight">Deploy Assignment</h2>
              <form onSubmit={deployTask} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2 px-1">Target Employee</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none" value={taskForm.target} onChange={e => setTaskForm({...taskForm, target: e.target.value})}>
                       <option value="">Select linked operator...</option>
                       {employees.map(e => <option key={e.id} value={e.id}>{e.id} ({e.name})</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2 px-1">Mission Objective</label>
                    <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl h-32 font-medium outline-none" placeholder="Describe the goal..." value={taskForm.text} onChange={e => setTaskForm({...taskForm, text: e.target.value})}></textarea>
                 </div>
                 <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95">
                    <Send size={18}/> Deploy to Node
                 </button>
              </form>
           </div>
         )}
      </main>
    </div>
  );
};

export default ManagerDashboard;