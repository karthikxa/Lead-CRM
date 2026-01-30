
import React, { useMemo, useState } from 'react';
import { Lead, LeadStatus, TaskAssignment, ActivityLog } from '../types';
import { 
  ChevronRight, ChevronLeft, Info,
  Target, Calendar, Clock, MessageSquare, Filter, UserCheck
} from 'lucide-react';
import { EMPLOYEE_USERS } from '../constants';

interface OperationsViewProps {
  leads: Lead[];
  tasks: TaskAssignment[];
  logs: ActivityLog[];
  isAdmin: boolean;
  currentUser?: string;
}

const OperationsView: React.FC<OperationsViewProps> = ({ leads, tasks, isAdmin, currentUser }) => {
  const employeesToDisplay = isAdmin ? EMPLOYEE_USERS.map(u => u.username) : [currentUser || ''];

  return (
    <div className="space-y-20 pb-40 animate-in fade-in duration-1000">
      {employeesToDisplay.map(emp => (
        <EmployeeOperationsSection 
          key={emp} 
          username={emp} 
          leads={leads.filter(l => l.employeeOwner === emp)} 
          tasks={tasks.filter(t => t.employeeUsername === emp)}
        />
      ))}
    </div>
  );
};

const EmployeeOperationsSection: React.FC<{ 
  username: string; 
  leads: Lead[]; 
  tasks: TaskAssignment[]; 
}> = ({ username, leads, tasks }) => {
  const activeTask = tasks.find(t => t.status === 'ACTIVE');
  
  const filteredLeads = useMemo(() => {
    return leads
      .filter(l => l.Availability !== LeadStatus.UNASSIGNED && l.Summary && l.Summary.trim() !== "")
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }, [leads]);

  const progressPercent = useMemo(() => {
    if (!activeTask || activeTask.weeklyTarget === 0) return 0;
    const processedCount = leads.filter(l => 
      l.Availability !== LeadStatus.UNASSIGNED && 
      l.Summary && 
      l.Summary.trim() !== ""
    ).length;
    return Math.min(Math.round((processedCount / activeTask.weeklyTarget) * 100), 100);
  }, [leads, activeTask]);

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end px-6">
        <div>
           <p className="text-[#ff6600] font-black uppercase text-[11px] tracking-[0.4em] mb-2">Platform Hub</p>
           <h2 className="text-4xl font-black text-white tracking-tighter">{username}'s Neural Flux</h2>
        </div>
        <div className="flex items-center gap-4 bg-zinc-900/50 p-2.5 rounded-[1.5rem] border border-white/5">
           <div className="w-10 h-10 rounded-xl bg-[#ff6600]/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-[#ff6600]" />
           </div>
           <div className="pr-4">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Global Status</p>
              <p className="text-[11px] font-black text-[#ff6600]">Synchronized</p>
           </div>
        </div>
      </div>

      <div className="glass-panel rounded-[4rem] p-14 relative overflow-hidden group">
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-20">
            <div className="space-y-12 text-center md:text-left">
               <div className="space-y-3">
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                     <Clock className="w-4 h-4 text-[#ff6600]" />
                     <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">Operational Phase Monitor</p>
                  </div>
                  <h3 className="text-5xl font-black text-white tracking-tighter leading-none">Yield Cycle Target</h3>
               </div>
               <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                  <div className="metric-pill px-10 py-6 flex items-center gap-6 shadow-2xl">
                     <Target className="w-7 h-7 text-[#ff6600]" />
                     <div className="text-left">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Weekly Pool</p>
                        <p className="text-3xl font-black text-white tracking-tighter">{activeTask?.weeklyTarget || '0'}</p>
                     </div>
                  </div>
                  <div className="metric-pill px-10 py-6 flex items-center gap-6 shadow-2xl">
                     <Calendar className="w-7 h-7 text-zinc-700" />
                     <div className="text-left">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Target End</p>
                        <p className="text-xs font-black text-white/80 uppercase tracking-widest">
                           {activeTask?.endDate ? new Date(activeTask.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '---'}
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="relative w-64 h-64 flex items-center justify-center">
               <svg className="w-full h-full transform -rotate-90">
                  <circle cx="128" cy="128" r="110" stroke="rgba(255,255,255,0.02)" strokeWidth="22" fill="transparent" />
                  <circle cx="128" cy="128" r="110" stroke="#ff6600" strokeWidth="22" fill="transparent" strokeDasharray={691} strokeDashoffset={691 - (691 * progressPercent) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" style={{ filter: 'drop-shadow(0 0 15px rgba(255, 102, 0, 0.5))' }} />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-6xl font-black text-white tracking-tighter leading-none">{progressPercent}%</span>
                  <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em] mt-3">Target Yield</span>
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-80 h-80 bg-[#ff6600]/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
      </div>

      <div className="space-y-10">
         <div className="flex items-center justify-between px-8">
            <div className="space-y-1">
               <h4 className="text-2xl font-black text-white tracking-tighter">Personnel Transaction Log</h4>
               <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">Recent Lead Intelligence Feed</p>
            </div>
            <div className="flex gap-4">
               <button className="p-4 rounded-[1.5rem] bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-500 transition-all"><ChevronLeft className="w-6 h-6" /></button>
               <button className="p-4 rounded-[1.5rem] bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-500 transition-all"><ChevronRight className="w-6 h-6" /></button>
            </div>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 p-1">
            {filteredLeads.length === 0 ? (
              <div className="col-span-full py-48 text-center text-zinc-800 font-black uppercase tracking-[0.4em] text-sm">
                 Transactional flux pending...
              </div>
            ) : (
              filteredLeads.map(lead => (
                <div key={lead.id} className="p-12 bg-[#0d0b09] hover:bg-[#13110f] rounded-[3.5rem] transition-all duration-500 border border-white/5 hover:border-[#ff6600]/30 group flex flex-col justify-between min-h-[260px]">
                   <div className="space-y-8">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-5">
                            <div className={`w-3.5 h-3.5 rounded-full status-dot-glow ${getStatusColor(lead.Availability)} shadow-[0_0_12px_currentColor]`}></div>
                            <p className="text-xl font-black text-white tracking-tighter">{lead.Company}</p>
                         </div>
                         <MessageSquare className="w-4.5 h-4.5 text-zinc-800 group-hover:text-[#ff6600] transition-colors" />
                      </div>
                      <p className="text-base font-medium text-zinc-500 italic leading-relaxed line-clamp-3">"{lead.Summary || 'Personnel log summary unavailable.'}"</p>
                   </div>
                   <div className="flex items-center justify-between mt-12 pt-10 border-t border-white/5">
                      <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em]">{new Date(lead.lastUpdated).toLocaleDateString([], { day: '2-digit', month: 'short' })}</p>
                      <p className={`text-[12px] font-black uppercase tracking-tighter ${getStatusTextColor(lead.Availability)}`}>{lead.Availability}</p>
                   </div>
                </div>
              ))
            )}
         </div>
      </div>
    </div>
  );
};

const getStatusColor = (status: LeadStatus) => {
  switch(status) {
    case LeadStatus.BOOKED: return 'text-emerald-500 bg-emerald-500';
    case LeadStatus.DECLINED: return 'text-rose-500 bg-rose-500';
    case LeadStatus.FOLLOW_UP: return 'text-amber-500 bg-amber-500';
    case LeadStatus.BUSY: return 'text-zinc-600 bg-zinc-600';
    default: return 'text-zinc-900 bg-zinc-900';
  }
};

const getStatusTextColor = (status: LeadStatus) => {
  switch(status) {
    case LeadStatus.BOOKED: return 'text-emerald-500';
    case LeadStatus.DECLINED: return 'text-rose-500';
    case LeadStatus.FOLLOW_UP: return 'text-amber-500';
    case LeadStatus.BUSY: return 'text-zinc-600';
    default: return 'text-zinc-800';
  }
};

export default OperationsView;
