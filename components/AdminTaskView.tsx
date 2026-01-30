
import React, { useState, useEffect } from 'react';
import { EMPLOYEE_USERS } from '../constants';
import { TaskAssignment } from '../types';
import { Calendar, Target, UserPlus, Send, ListChecks, Clock } from 'lucide-react';

interface AdminTaskViewProps {
  onAssignTask: (task: Omit<TaskAssignment, 'id' | 'status' | 'createdAt'>) => void;
  tasks: TaskAssignment[];
}

const AdminTaskView: React.FC<AdminTaskViewProps> = ({ onAssignTask, tasks }) => {
  const [targetEmployee, setTargetEmployee] = useState(EMPLOYEE_USERS[0].username);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weeklyTarget, setWeeklyTarget] = useState(0);
  const [dailyTarget, setDailyTarget] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDuration(diffDays > 0 ? diffDays : 0);
    } else {
      setDuration(0);
    }
  }, [startDate, endDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || weeklyTarget <= 0 || duration <= 0) {
      alert("Please fill all fields correctly. Ensure end date is after start date.");
      return;
    }
    onAssignTask({
      employeeUsername: targetEmployee,
      startDate,
      endDate,
      weeklyTarget,
      dailyTarget: dailyTarget || Math.ceil(weeklyTarget / duration),
      daysPlanned: duration
    });
    // Reset
    setStartDate('');
    setEndDate('');
    setWeeklyTarget(0);
    setDailyTarget(0);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="glass-panel p-10 rounded-[3rem] border border-white/5 bg-black/40 shadow-2xl">
        <div className="flex items-center gap-4 mb-10">
           <div className="w-12 h-12 bg-[#ff6600]/10 rounded-2xl flex items-center justify-center border border-[#ff6600]/20">
              <UserPlus className="w-6 h-6 text-[#ff6600]" />
           </div>
           <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Deploy New Mission Mandate</h3>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">Personnel Assignment Protocol</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">Assigned Personnel</label>
            <select 
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-sm font-bold text-white focus:outline-none focus:border-[#ff6600]/50 transition-all"
              value={targetEmployee}
              onChange={(e) => setTargetEmployee(e.target.value)}
            >
              {EMPLOYEE_USERS.map(emp => (
                <option key={emp.username} value={emp.username} className="bg-[#0d0b09]">{emp.username}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">Mission Window Start</label>
            <input 
              type="date" 
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-sm font-bold text-white focus:outline-none focus:border-[#ff6600]/50 transition-all [color-scheme:dark]"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">Mission Window End</label>
            <input 
              type="date" 
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-sm font-bold text-white focus:outline-none focus:border-[#ff6600]/50 transition-all [color-scheme:dark]"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">Global Cycle Goal (Units)</label>
            <input 
              type="number" 
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-sm font-bold text-white focus:outline-none focus:border-[#ff6600]/50 transition-all placeholder:text-zinc-800"
              placeholder="e.g. 500"
              value={weeklyTarget || ''}
              onChange={(e) => setWeeklyTarget(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">Daily Flux Target (Optional)</label>
            <input 
              type="number" 
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-sm font-bold text-white focus:outline-none focus:border-[#ff6600]/50 transition-all placeholder:text-zinc-800"
              placeholder={duration > 0 ? `Calculated: ${Math.ceil(weeklyTarget / duration)}` : "e.g. 50"}
              value={dailyTarget || ''}
              onChange={(e) => setDailyTarget(Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col justify-end">
             <div className="bg-[#ff6600]/5 border border-[#ff6600]/10 rounded-2xl p-4 flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Calculated Cycle</span>
                <span className="text-sm font-black text-[#ff6600]">{duration} Days</span>
             </div>
            <button 
              type="submit"
              className="w-full bg-white text-black hover:bg-zinc-200 font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[11px] active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              Authorize Mission
            </button>
          </div>
        </form>
      </div>

      <div className="glass-panel p-10 rounded-[3rem] border border-white/5 bg-black/20 shadow-xl">
        <h3 className="text-xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tighter">
          <ListChecks className="w-6 h-6 text-emerald-500" /> Active Operations Logs
        </h3>
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="py-24 text-center text-zinc-700 font-black uppercase tracking-[0.4em] text-[11px] border-2 border-dashed border-white/5 rounded-[2.5rem]">
              System idle: no deployments detected
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col md:flex-row items-center justify-between gap-6 group">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center font-black text-xl text-white group-hover:bg-[#ff6600] transition-colors shadow-2xl">
                    {task.employeeUsername.charAt(0)}
                  </div>
                  <div>
                    <p className="text-lg font-black text-white tracking-tight">{task.employeeUsername}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                       <Clock className="w-3.5 h-3.5 text-zinc-600" />
                       <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{task.startDate} <span className="text-zinc-800 mx-1">→</span> {task.endDate}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-10">
                  <div className="text-center md:text-right">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Cycle Duration</p>
                    <p className="text-lg font-black text-white">{task.daysPlanned} Days</p>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Global Target</p>
                    <p className="text-lg font-black text-white">{task.weeklyTarget}</p>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Flux Rate</p>
                    <p className="text-lg font-black text-white">{task.dailyTarget}/Day</p>
                  </div>
                  <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg ${task.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#ff6600]/10 text-[#ff6600] border-[#ff6600]/20'}`}>
                    {task.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTaskView;
