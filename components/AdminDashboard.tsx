
import React, { useMemo, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
<<<<<<< HEAD
  XAxis, YAxis, CartesianGrid, BarChart, Bar,
=======
  XAxis, YAxis, CartesianGrid, LabelList,
  AreaChart, Area
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
} from 'recharts';
import { Lead, LeadStatus, SystemAlert } from '../types';
import { 
  RefreshCw, TrendingUp, Target, 
<<<<<<< HEAD
  Activity, Crown, Filter, ChevronDown, UserCheck, AlertCircle, Clock
=======
  Activity, Crown, Cpu, Zap, Star, AlertCircle, Clock, Filter, ChevronDown, UserCheck
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
} from 'lucide-react';
import { EMPLOYEE_USERS } from '../constants';

interface AdminDashboardProps {
  allLeads: Lead[];
  isLoading: boolean;
  onRefresh: () => void;
  alerts: SystemAlert[];
  onAcknowledgeAlert: (id: string) => void;
  logs: any[];
  employeeStats: any[];
  alertThreshold: number;
  onUpdateThreshold: (val: number) => void;
}

const STATUS_COLORS = {
  [LeadStatus.BOOKED]: '#eb7c52',
  [LeadStatus.FOLLOW_UP]: '#fbbf24',
  [LeadStatus.DECLINED]: '#a855f7',
  [LeadStatus.BUSY]: '#6366f1',
<<<<<<< HEAD
  DEFAULT: '#e4e4e7'
=======
  DEFAULT: '#3f3f46'
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  allLeads, 
  onRefresh, 
  isLoading, 
<<<<<<< HEAD
=======
  alerts
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
}) => {
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('ALL');

  const stats = useMemo(() => {
<<<<<<< HEAD
    const today = new Date();
    const dayOfWeek = today.getDay(); 
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    const specialistPool = EMPLOYEE_USERS.filter(u => u.username !== 'Karthik');
=======
    // Filter out Karthik from the baseline data for specialists if needed
    const specialistPool = EMPLOYEE_USERS.filter(u => u.username !== 'Karthik');
    
    // Apply Specialist Filter
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
    const filteredLeads = selectedSpecialist === 'ALL' 
      ? allLeads 
      : allLeads.filter(l => String(l.employeeOwner || '').toLowerCase() === selectedSpecialist.toLowerCase());

    const calculateStats = (leads: Lead[]) => {
      const total = leads.length;
      const booked = leads.filter(l => l.Availability === LeadStatus.BOOKED).length;
      const declined = leads.filter(l => l.Availability === LeadStatus.DECLINED).length;
      const followUp = leads.filter(l => l.Availability === LeadStatus.FOLLOW_UP).length;
      const busy = leads.filter(l => l.Availability === LeadStatus.BUSY).length;
      return { total, booked, declined, followUp, busy };
    };

<<<<<<< HEAD
    const weeklyTrend = weekDates.map(date => {
      const dayLeads = filteredLeads.filter(l => (l.DateTime || l.lastUpdated || '').startsWith(date));
      const booked = dayLeads.filter(l => l.Availability === LeadStatus.BOOKED).length;
      const declined = dayLeads.filter(l => l.Availability === LeadStatus.DECLINED).length;
      const followup = dayLeads.filter(l => l.Availability === LeadStatus.FOLLOW_UP).length;
      const busy = dayLeads.filter(l => l.Availability === LeadStatus.BUSY).length;
      const total = dayLeads.length;

      return {
        date: new Date(date).toLocaleDateString([], { weekday: 'short' }),
        fullDate: date,
        booked,
        declined,
        followup,
        busy,
        total,
=======
    // 7-Day Daily Data with Date Labels
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const weeklyTrend = dates.map(date => {
      const dayLeads = filteredLeads.filter(l => (l.DateTime || l.lastUpdated || '').startsWith(date));
      return {
        date: new Date(date).toLocaleDateString([], { day: '2-digit', month: 'short' }),
        booked: dayLeads.filter(l => l.Availability === LeadStatus.BOOKED).length,
        rejected: dayLeads.filter(l => l.Availability === LeadStatus.DECLINED).length,
        followup: dayLeads.filter(l => l.Availability === LeadStatus.FOLLOW_UP).length,
        busy: dayLeads.filter(l => l.Availability === LeadStatus.BUSY).length,
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
      };
    });

    const global = calculateStats(filteredLeads);
<<<<<<< HEAD

    const getSpecialistDetailedData = (username: string) => {
      const uLeads = allLeads.filter(l => String(l.employeeOwner || '').toLowerCase() === username.toLowerCase());
      const s = calculateStats(uLeads);
      return {
        total: s.total,
        booked: s.booked,
        winRate: s.total > 0 ? Math.round((s.booked / s.total) * 100) : 0,
        chartData: [
          { name: 'Booked', value: s.booked, color: STATUS_COLORS[LeadStatus.BOOKED] },
          { name: 'Follow Up', value: s.followUp, color: STATUS_COLORS[LeadStatus.FOLLOW_UP] },
          { name: 'Declined', value: s.declined, color: STATUS_COLORS[LeadStatus.DECLINED] },
          { name: 'Busy', value: s.busy, color: STATUS_COLORS[LeadStatus.BUSY] },
        ].filter(d => d.value > 0)
      };
    };

    return { 
      global, 
      weeklyTrend, 
      specialistPool,
      specialistData: specialistPool.map(u => ({
        username: u.username,
        stats: getSpecialistDetailedData(u.username)
      }))
    };
  }, [allLeads, selectedSpecialist]);

  return (
    <div className="h-full bg-white overflow-y-auto custom-scrollbar p-10 stagger-item">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
        <div className="flex items-center gap-6 text-left w-full">
          <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-3xl flex items-center justify-center shadow-sm shrink-0">
            <Crown className="w-8 h-8 text-[#eb7c52]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Command Center</h2>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
               <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                 {selectedSpecialist === 'ALL' ? 'Current Week (Mon - Sun)' : `Isolated Intelligence: ${selectedSpecialist}`}
=======
    
    const pieData = [
      { name: 'Booked', value: global.booked, color: STATUS_COLORS[LeadStatus.BOOKED] },
      { name: 'Follow Up', value: global.followUp, color: STATUS_COLORS[LeadStatus.FOLLOW_UP] },
      { name: 'Rejected', value: global.declined, color: STATUS_COLORS[LeadStatus.DECLINED] },
      { name: 'Busy', value: global.busy, color: STATUS_COLORS[LeadStatus.BUSY] },
    ].filter(d => d.value > 0);

    return { global, pieData, weeklyTrend, specialistPool };
  }, [allLeads, selectedSpecialist]);

  const unacknowledgedAlerts = alerts.filter(a => !a.isAcknowledged);

  return (
    <div className="space-y-10 pb-32 stagger-item">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/[0.03] border border-white/10 rounded-[1.8rem] flex items-center justify-center shadow-2xl">
            <Crown className="w-8 h-8 text-[#eb7c52]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Command Center</h2>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                 {selectedSpecialist === 'ALL' ? 'Real-time Global Flux' : `Isolated Specialist View: ${selectedSpecialist}`}
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
               </p>
            </div>
          </div>
        </div>

<<<<<<< HEAD
        <div className="flex items-center gap-4 shrink-0">
          <div className="relative group">
             <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#eb7c52]" />
             <select 
               className="bg-white border border-zinc-200 rounded-xl py-4 pl-12 pr-12 text-[11px] font-black text-zinc-900 uppercase tracking-widest focus:outline-none focus:border-[#eb7c52] focus:ring-4 focus:ring-[#eb7c52]/5 transition-all appearance-none cursor-pointer min-w-[200px] shadow-sm"
=======
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
             <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#eb7c52]" />
             <select 
               className="bg-[#0c0c0c] border border-white/10 rounded-xl py-3.5 pl-10 pr-10 text-[10px] font-black text-white uppercase tracking-widest focus:outline-none focus:border-[#eb7c52] transition-all appearance-none cursor-pointer hover:border-white/20"
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
               value={selectedSpecialist}
               onChange={(e) => setSelectedSpecialist(e.target.value)}
             >
               <option value="ALL">All Units</option>
               {stats.specialistPool.map(user => (
                 <option key={user.username} value={user.username}>{user.username}</option>
               ))}
             </select>
<<<<<<< HEAD
             <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 pointer-events-none" />
=======
             <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
          </div>

          <button 
            onClick={onRefresh} 
            disabled={isLoading}
<<<<<<< HEAD
            className="bg-zinc-900 hover:bg-black p-4 rounded-xl text-white transition-all shadow-xl active:scale-90"
          >
            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
=======
            className="bg-white hover:bg-zinc-200 px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] text-black flex items-center gap-3 transition-all shadow-xl active:scale-95"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
          </button>
        </div>
      </div>

<<<<<<< HEAD
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatusMetric label="Booked" value={stats.global.booked} color={STATUS_COLORS[LeadStatus.BOOKED]} icon={<Target />} />
        <StatusMetric label="Declined" value={stats.global.declined} color={STATUS_COLORS[LeadStatus.DECLINED]} icon={<AlertCircle />} />
        <StatusMetric label="Follow Up" value={stats.global.followUp} color={STATUS_COLORS[LeadStatus.FOLLOW_UP]} icon={<Clock />} />
        <StatusMetric label="Busy" value={stats.global.busy} color={STATUS_COLORS[LeadStatus.BUSY]} icon={<Activity />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        <div className="xl:col-span-2 bg-zinc-50 border border-zinc-100 p-10 rounded-[2.5rem] shadow-sm">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">7-Day Insights</h3>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Status distribution per day (Mon - Sun)</p>
            </div>
            <div className="flex gap-4">
               <LegendItem color={STATUS_COLORS[LeadStatus.BOOKED]} label="Booked" />
               <LegendItem color={STATUS_COLORS[LeadStatus.FOLLOW_UP]} label="Follow" />
               <LegendItem color={STATUS_COLORS[LeadStatus.DECLINED]} label="Declined" />
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyTrend} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: '900' }} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ background: '#fff', border: '1px solid #f4f4f5', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'black', marginBottom: '8px', textTransform: 'uppercase', color: '#18181b' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-2xl">
                          <p className="text-[11px] font-black text-zinc-900 uppercase tracking-widest mb-3">{label} - {data.total} Units</p>
                          <div className="space-y-2">
                             <TooltipRow color={STATUS_COLORS[LeadStatus.BOOKED]} label="Booked" value={data.booked} />
                             <TooltipRow color={STATUS_COLORS[LeadStatus.FOLLOW_UP]} label="Follow Up" value={data.followup} />
                             <TooltipRow color={STATUS_COLORS[LeadStatus.DECLINED]} label="Declined" value={data.declined} />
                             <TooltipRow color={STATUS_COLORS[LeadStatus.BUSY]} label="Busy" value={data.busy} />
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="booked" fill={STATUS_COLORS[LeadStatus.BOOKED]} radius={[4, 4, 0, 0]} name="Booked" />
                <Bar dataKey="followup" fill={STATUS_COLORS[LeadStatus.FOLLOW_UP]} radius={[4, 4, 0, 0]} name="Follow Up" />
                <Bar dataKey="declined" fill={STATUS_COLORS[LeadStatus.DECLINED]} radius={[4, 4, 0, 0]} name="Declined" />
                <Bar dataKey="busy" fill={STATUS_COLORS[LeadStatus.BUSY]} radius={[4, 4, 0, 0]} name="Busy" />
              </BarChart>
=======
      {/* Main Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
        <StatusMetric label="Booked" value={stats.global.booked} sub="Conversion Goal" color={STATUS_COLORS[LeadStatus.BOOKED]} icon={<Target />} />
        <StatusMetric label="Rejected" value={stats.global.declined} sub="Disqualification" color={STATUS_COLORS[LeadStatus.DECLINED]} icon={<AlertCircle />} />
        <StatusMetric label="Follow Up" value={stats.global.followUp} sub="Queue Depth" color={STATUS_COLORS[LeadStatus.FOLLOW_UP]} icon={<Clock />} />
        <StatusMetric label="Busy" value={stats.global.busy} sub="Retry Cadence" color={STATUS_COLORS[LeadStatus.BUSY]} icon={<Activity />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 px-2">
        {/* Full-Width Velocity Area Chart */}
        <div className="xl:col-span-2 bg-[#080808] border border-white/5 p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-12">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white tracking-tighter leading-none">7-Day Yield Velocity</h3>
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Temporal performance distribution</p>
            </div>
            <div className="flex gap-4">
               <LegendItem color={STATUS_COLORS[LeadStatus.BOOKED]} label="Booked" />
               <LegendItem color={STATUS_COLORS[LeadStatus.FOLLOW_UP]} label="Followup" />
               <LegendItem color={STATUS_COLORS[LeadStatus.DECLINED]} label="Rejected" />
            </div>
          </div>
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weeklyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eb7c52" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#eb7c52" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 11, fontWeight: '900' }} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#000', border: '1px solid #222', borderRadius: '16px' }} />
                <Area type="monotone" dataKey="booked" stroke="#eb7c52" fillOpacity={1} fill="url(#colorB)" strokeWidth={3} stackId="1" />
                <Area type="monotone" dataKey="rejected" stroke="#a855f7" fillOpacity={0.1} fill="#a855f7" strokeWidth={2} stackId="1" />
                <Area type="monotone" dataKey="followup" stroke="#fbbf24" fillOpacity={0} fill="none" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
            </ResponsiveContainer>
          </div>
        </div>

<<<<<<< HEAD
        <div className="flex flex-col gap-6 max-h-[600px] overflow-y-auto custom-scrollbar">
          {stats.specialistData.map(specialist => (
            <EnhancedSpecialistCard 
              key={specialist.username}
              username={specialist.username} 
              stats={specialist.stats} 
              color={STATUS_COLORS[LeadStatus.BOOKED]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Fixed TypeScript error: EnhancedSpecialistCard props type by using React.FC which includes React-specific props like key
const EnhancedSpecialistCard: React.FC<{ username: string; stats: any; color: string }> = ({ username, stats, color }) => {
  return (
    <div className="bg-zinc-50 border border-zinc-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col flex-1 shrink-0">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center font-black text-sm text-zinc-900 shadow-sm">
            {username.charAt(0)}
          </div>
          <div className="text-left">
            <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter leading-none">{username}</h3>
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1">Operational Flow</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-white bg-zinc-900 px-3 py-1 rounded-lg shadow-lg">
            {stats.winRate}% WIN
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6 flex-1">
        <div className="relative w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stats.chartData} cx="50%" cy="50%" innerRadius={42} outerRadius={58} paddingAngle={4} dataKey="value" stroke="none">
                {stats.chartData.map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-zinc-900 tracking-tighter">{stats.booked}</span>
            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Units</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="TOTAL" value={stats.total} />
            <MiniStat label="BOOKED" value={stats.booked} color="#eb7c52" />
          </div>
          <div className="h-px bg-zinc-200 w-full"></div>
          <div className="space-y-2">
            {stats.chartData.length === 0 ? (
              <p className="text-[9px] font-black text-zinc-300 uppercase italic">Awaiting Sync...</p>
            ) : (
              stats.chartData.map((d: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-[10px] font-black">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }}></div>
                    <span className="text-zinc-500 uppercase tracking-widest">{d.name}</span>
                  </div>
                  <span className="text-zinc-900">{d.value}</span>
                </div>
              ))
            )}
=======
        {/* Intelligence Segmentation (Donut) */}
        <div className="bg-[#080808] border border-white/5 p-12 rounded-[2.5rem] shadow-2xl flex flex-col">
          <div className="flex justify-between items-start mb-12">
             <div className="space-y-1">
               <h3 className="text-xl font-black text-white tracking-tighter leading-none">Status Allocation</h3>
               <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Global unit segmentation</p>
             </div>
             <p className="text-[10px] font-black text-zinc-700 tracking-widest uppercase">Total: {stats.global.total}</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-12 flex-1">
             <div className="flex-1 space-y-6 w-full">
                {stats.pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl group cursor-pointer hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full" style={{ background: d.color }}></div>
                       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{d.name}</span>
                    </div>
                    <span className="text-sm font-black text-white">{d.value}</span>
                  </div>
                ))}
             </div>
             <div className="relative w-64 h-64 shrink-0">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={75} outerRadius={105} paddingAngle={4} dataKey="value" stroke="none">
                      {stats.pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#000', border: '1px solid #222', borderRadius: '16px' }} />
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-white">{stats.global.booked}</span>
                  <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em]">Success</span>
               </div>
             </div>
          </div>
        </div>

        {/* Specialist Comparison List */}
        <div className="bg-[#080808] border border-white/5 p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col">
          <div className="flex justify-between items-start mb-12">
             <div className="space-y-1">
               <h3 className="text-xl font-black text-white tracking-tighter leading-none">Personnel Yield Matrix</h3>
               <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Specialist benchmark report</p>
             </div>
             <UserCheck className="w-5 h-5 text-[#eb7c52]" />
          </div>
          <div className="flex-1 space-y-4">
            {stats.specialistPool.map(user => {
              const uLeads = allLeads.filter(l => String(l.employeeOwner || '').toLowerCase() === user.username.toLowerCase());
              const uBooked = uLeads.filter(l => l.Availability === LeadStatus.BOOKED).length;
              const uTotal = uLeads.length;
              const uRate = uTotal > 0 ? Math.round((uBooked / uTotal) * 100) : 0;
              return (
                <div key={user.username} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-[1.8rem] group hover:bg-[#eb7c52]/10 hover:border-[#eb7c52]/30 transition-all">
                  <div className="flex items-center gap-5">
                     <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center font-black text-white group-hover:bg-[#eb7c52] transition-colors">
                       {user.username.charAt(0)}
                     </div>
                     <div>
                        <p className="text-base font-black text-white uppercase">{user.username}</p>
                        <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Active Specialist</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-2xl font-black text-white tabular-nums group-hover:text-[#eb7c52] transition-colors">{uBooked}</p>
                     <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">{uRate}% Yield Rate</p>
                  </div>
                </div>
              );
            })}
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
          </div>
        </div>
      </div>
    </div>
  );
};

<<<<<<< HEAD
const TooltipRow = ({ color, label, value }: any) => (
  <div className="flex items-center justify-between gap-8 min-w-[140px]">
     <div className="flex items-center gap-2">
       <div className="w-2 h-2 rounded-full" style={{ background: color }}></div>
       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
     </div>
     <span className="text-[11px] font-black text-zinc-900">{value}</span>
  </div>
);

const MiniStat = ({ label, value, color }: any) => (
  <div className="text-left">
     <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>
     <p className="text-lg font-black text-zinc-900 tracking-tighter" style={color ? { color } : {}}>{value}</p>
  </div>
);

const LegendItem = ({ color, label }: any) => (
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 rounded-full" style={{ background: color }}></div>
    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
  </div>
);

const StatusMetric = ({ label, value, color, icon }: any) => (
  <div className="bg-zinc-50 border border-zinc-100 p-8 rounded-[2.5rem] flex flex-col items-center text-center hover:bg-zinc-100/50 transition-all shadow-sm">
     <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm" style={{ backgroundColor: `${color}10`, color: color }}>
       {React.cloneElement(icon, { size: 24 })}
     </div>
     <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-2">{label}</p>
     <p className="text-4xl font-black tracking-tighter text-zinc-900">{value}</p>
  </div>
);
=======
const LegendItem = ({ color, label }: any) => (
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 rounded-full" style={{ background: color }}></div>
    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{label}</span>
  </div>
);

const StatusMetric = ({ label, value, sub, color, icon }: any) => {
  return (
    <div className="bg-[#080808] border border-white/5 p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-2xl hover:bg-white/[0.01] transition-all group overflow-hidden relative">
       <div 
         className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-all group-hover:scale-110 shadow-2xl relative z-10"
         style={{ background: `${color}10`, border: `1px solid ${color}20`, color: color }}
       >
         {React.cloneElement(icon, { size: 28 })}
       </div>
       <div className="relative z-10 space-y-1">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-4">{label}</p>
          <p className="text-5xl font-black tracking-tighter leading-none text-white tabular-nums">{value}</p>
          <p className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.2em] pt-4 border-t border-white/[0.02] mt-4">{sub}</p>
       </div>
       <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[80px] opacity-[0.03] pointer-events-none" style={{ background: color }}></div>
    </div>
  );
};
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c

export default AdminDashboard;
