
import React, { useMemo, useState } from 'react';
import { Lead, LeadStatus, TaskAssignment } from '../types';
import { 
  Calendar, CheckCircle2, Target,
  PhoneCall, Mail, ChevronLeft, Inbox, Clock,
  XCircle, UserPlus, Timer, Layout, Check,
  ArrowRight, AlertCircle, BarChart3, TrendingUp
} from 'lucide-react';

interface TaskIntelligenceAgentProps {
  leads: Lead[];
  tasks: TaskAssignment[];
  onAcceptTask?: (taskId: string) => void;
}

const TaskIntelligenceAgent: React.FC<TaskIntelligenceAgentProps> = ({ leads, tasks, onAcceptTask }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [view, setView] = useState<'LIST' | 'DETAIL'>('LIST');

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setView('DETAIL');
  };

  const activeTask = useMemo(() => {
    return tasks.find(t => t.id === selectedTaskId);
  }, [tasks, selectedTaskId]);

  const taskMetrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const processedCycle = leads.filter(l => l.Availability !== LeadStatus.UNASSIGNED && l.Summary && l.Summary.trim() !== "").length;
    const processedToday = leads.filter(l => {
      const isProcessed = l.Availability !== LeadStatus.UNASSIGNED && l.Summary && l.Summary.trim() !== "";
      const isToday = l.lastUpdated?.startsWith(today);
      return isProcessed && isToday;
    }).length;

    const dailyTarget = activeTask?.dailyTarget || 0;
    const weeklyTarget = activeTask?.weeklyTarget || 0;

    return {
      processedCycle,
      processedToday,
      todayRemainder: Math.max(0, dailyTarget - processedToday),
      weeklyGoalDelta: Math.max(0, weeklyTarget - processedCycle),
      weeklyProgress: weeklyTarget > 0 ? Math.min(100, Math.round((processedCycle / weeklyTarget) * 100)) : 0
    };
  }, [leads, activeTask]);

  if (view === 'DETAIL' && activeTask) {
    return (
      <div className="animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl bg-black/60">
          <div className="p-8 md:p-10 border-b border-white/5 bg-gradient-to-r from-[#ff6600]/10 to-transparent">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="space-y-4">
                <button 
                  onClick={() => setView('LIST')} 
                  className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-all mb-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Operational Inbox</span>
                </button>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Mission Dossier: Cycle Active</h2>
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${activeTask.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-[#ff6600]/10 text-[#ff6600] border-[#ff6600]/20'}`}>
                      {activeTask.status === 'ACTIVE' ? 'Link Established' : 'Authorize Deployment'}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Window: {activeTask.startDate} to {activeTask.endDate} ({activeTask.daysPlanned} Days)
                  </p>
                </div>
              </div>

              {activeTask.status === 'PENDING' && onAcceptTask && (
                <button 
                  onClick={() => onAcceptTask(activeTask.id)}
                  className="bg-[#ff6600] hover:bg-[#ff8c33] text-white font-black px-10 py-5 rounded-2xl flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,102,0,0.3)]"
                >
                  Establish Data Link
                </button>
              )}
            </div>
          </div>

          <div className="p-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TaskMetricCard 
                label="Weekly Goal Delta" 
                value={taskMetrics.weeklyGoalDelta} 
                sub="UNITS TO TARGET" 
                icon={<Target className="w-5 h-5" />} 
                color="zinc"
              />
              <TaskMetricCard 
                label="Today's Remainder" 
                value={taskMetrics.todayRemainder} 
                sub="UNITS REMAINING" 
                icon={<Timer className="w-5 h-5" />} 
                color="rose"
                isAlert={taskMetrics.todayRemainder > 0}
              />
              <TaskMetricCard 
                label="Cycle Yield" 
                value={`${taskMetrics.weeklyProgress}%`} 
                sub="PROGRESS STATUS" 
                icon={<TrendingUp className="w-5 h-5" />} 
                color="orange"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-6 border-t border-white/5">
              <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-600 flex items-center gap-3">
                  <div className="w-1.5 h-3 bg-[#ff6600] rounded-full"></div> Phase Progression
                </h4>
                <div className="bg-black/40 rounded-[2rem] p-8 border border-white/5 space-y-8">
                   <div className="space-y-3">
                      <div className="flex justify-between items-end">
                         <p className="text-white text-sm font-black tracking-tight">Mission Cycle Completion</p>
                         <p className="text-[#ff6600] text-lg font-black tracking-tighter">
                           {taskMetrics.processedCycle} / {activeTask.weeklyTarget}
                         </p>
                      </div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                         <div 
                           className="h-full bg-gradient-to-r from-[#ff6600] to-orange-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,102,0,0.3)]"
                           style={{ width: `${taskMetrics.weeklyProgress}%` }}
                         ></div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/5 group hover:bg-[#ff6600]/5 transition-all">
                         <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Cycle Duration</p>
                         <p className="text-2xl font-black text-white">{activeTask.daysPlanned} Days</p>
                      </div>
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/5 group hover:bg-emerald-500/5 transition-all">
                         <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Daily Flow Rate</p>
                         <p className="text-2xl font-black text-white">{activeTask.dailyTarget} Units</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-6">
                 <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-600 flex items-center gap-3">
                  <div className="w-1.5 h-3 bg-emerald-500 rounded-full"></div> Operational Mandate
                </h4>
                <div className="bg-black/40 rounded-[2rem] p-8 border border-white/5 h-full flex flex-col justify-between">
                   <p className="text-zinc-400 text-sm font-medium leading-relaxed italic">
                     "Platform deployment requires clearing {activeTask.dailyTarget} lead units daily for the next {activeTask.daysPlanned} days. Ensure summary logs are transactional and high-fidelity. Maintain sync velocity throughout the window."
                   </p>
                   <div className="flex items-center gap-4 pt-6 mt-6 border-t border-white/5">
                      <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-white text-[10px] border border-white/10 shadow-lg">K</div>
                      <div>
                         <p className="text-[11px] font-black text-white">Karthik (System Admin)</p>
                         <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Global Ops Command</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-left-8 duration-500">
      <div className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl flex flex-col min-h-[700px] bg-black/40">
        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-xl">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[#ff6600]/10 flex items-center justify-center border border-[#ff6600]/20 shadow-[0_0_20px_rgba(255,102,0,0.1)]">
              <Inbox className="w-7 h-7 text-[#ff6600]" />
            </div>
            <div>
              <h4 className="text-xl font-black text-white tracking-tighter uppercase">Operational Inbox</h4>
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mt-1">Pending deployments to authorize</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-[#ff6600]/10 text-[#ff6600] text-[10px] font-black px-6 py-2.5 rounded-full uppercase tracking-widest border border-[#ff6600]/20 shadow-lg shadow-[#ff6600]/5">
              {tasks.length} Deployment Links
            </span>
          </div>
        </div>

        <div className="flex-1">
          {tasks.length === 0 ? (
            <div className="py-56 flex flex-col items-center justify-center space-y-8">
              <div className="w-24 h-24 rounded-full bg-white/[0.02] flex items-center justify-center border border-white/5 animate-pulse shadow-inner">
                <Mail className="w-12 h-12 text-zinc-800" />
              </div>
              <div className="text-center space-y-3">
                <p className="text-sm font-black uppercase tracking-[0.4em] text-zinc-700">Inbox Depleted</p>
                <p className="text-[10px] font-bold text-zinc-800 uppercase tracking-[0.2em]">Awaiting Command Deployment</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {tasks.map((task) => {
                const isPending = task.status === 'PENDING';
                return (
                  <button
                    key={task.id}
                    onClick={() => handleSelectTask(task.id)}
                    className="w-full group relative flex items-start gap-8 p-12 transition-all hover:bg-[#ff6600]/[0.02] text-left overflow-hidden"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-[#ff6600] transform transition-transform duration-500 ${selectedTaskId === task.id ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'}`}></div>
                    
                    <div className="mt-2 shrink-0">
                      <div className={`w-4 h-4 rounded-full border-2 transition-all duration-500 ${isPending ? 'bg-[#ff6600] border-[#ff6600]/40 animate-pulse shadow-[0_0_15px_rgba(255,102,0,0.6)]' : 'bg-emerald-500/20 border-emerald-500/40'}`}></div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-4">
                      <div className="flex justify-between items-start">
                        <h5 className={`text-2xl font-black tracking-tight leading-tight transition-colors ${isPending ? 'text-white' : 'text-zinc-500'}`}>
                          Karthik: New Task Assignment
                        </h5>
                        <div className="flex items-center gap-3 text-[11px] font-black text-zinc-700 uppercase tracking-widest mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}
                        </div>
                      </div>

                      <p className="text-[15px] font-bold text-zinc-400 tracking-tight leading-relaxed transition-colors group-hover:text-zinc-200">
                        Assigning {task.dailyTarget} leads daily for the next {task.daysPlanned} days
                      </p>

                      <div className="flex items-center gap-8 pt-2">
                         <div className="flex flex-col">
                           <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Total Target</span>
                           <span className="text-[12px] font-black text-white bg-white/5 border border-white/5 px-3 py-1 rounded-xl">{task.weeklyTarget} UNITS</span>
                         </div>
                         <div className="flex flex-col">
                           <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Window Duration</span>
                           <span className="text-[12px] font-black text-[#ff6600] bg-[#ff6600]/5 border border-[#ff6600]/10 px-3 py-1 rounded-xl">{task.daysPlanned} DAYS</span>
                         </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center h-full self-center transition-all transform translate-x-12 opacity-0 group-hover:opacity-100 group-hover:translate-x-0">
                       <div className="w-14 h-14 rounded-full border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600] bg-[#ff6600]/10 shadow-2xl">
                         <ArrowRight className="w-7 h-7" />
                       </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TaskMetricCard = ({ label, value, sub, icon, color, isAlert = false }: { label: string; value: string | number; sub: string; icon: React.ReactNode; color: string; isAlert?: boolean }) => {
  const colorMap = {
    orange: 'text-[#ff6600] border-[#ff6600]/20 bg-[#ff6600]/5',
    rose: 'text-rose-500 border-rose-500/20 bg-rose-500/5',
    zinc: 'text-white border-white/10 bg-white/5'
  };
  
  const styles = colorMap[color as keyof typeof colorMap] || colorMap.zinc;

  return (
    <div className={`p-10 rounded-[2.5rem] border transition-all flex flex-col items-center justify-center gap-4 relative overflow-hidden group shadow-2xl backdrop-blur-md ${styles} ${isAlert ? 'ring-2 ring-rose-500/30' : 'hover:bg-white/[0.04]'}`}>
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="p-4 bg-black/60 rounded-2xl border border-white/10 mb-4 group-hover:scale-110 transition-transform shadow-xl">
           <span className="transition-transform duration-500">{icon}</span>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-2">{label}</p>
        <p className="text-6xl font-black tracking-tighter leading-none mb-4 group-hover:scale-105 transition-transform duration-500">{value}</p>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{sub}</p>
      </div>
      
      {isAlert && (
        <div className="absolute top-6 right-6 flex items-center gap-2">
           <span className="text-[9px] font-black uppercase text-rose-500 tracking-widest animate-pulse">Required</span>
           <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
        </div>
      )}

      <div className="absolute bottom-0 right-0 w-32 h-32 bg-current opacity-[0.03] rounded-full translate-x-10 translate-y-10"></div>
    </div>
  );
};

export default TaskIntelligenceAgent;
