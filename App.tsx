
import React, { useState, useCallback, useEffect } from 'react';
import { User, Lead, LeadStatus, AppView, SystemAlert } from './types';
<<<<<<< HEAD
import { fetchAllState, loginUser, submitLead, updateTask } from './services/leadService';
=======
import { fetchActiveData, loginUser, appendToDB, fetchAnalyticsData, fetchTasksData } from './services/leadService';
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
import EmployeeDashboard from './components/EmployeeDashboard';
import LeadAnalytics from './components/LeadAnalytics';
import TaskSummaryView from './components/TaskSummaryView';
import AdminDashboard from './components/AdminDashboard';
<<<<<<< HEAD
import DatabaseInspector from './components/DatabaseInspector';
import { 
  Loader2, Database as DbIcon, ListChecks, 
  ShieldCheck, BellRing, Lock as LockIcon, ArrowRight,
  LayoutDashboard, TrendingUp, LogOut as EndSessionIcon,
  ChevronLeft, ChevronRight, Zap, User as UserIcon, FileCode
=======
import AnomaliesView from './components/AnomaliesView';
import { 
  Loader2, Database, ListChecks, 
  ShieldCheck, BellRing, Lock as LockIcon, ArrowRight,
  LayoutDashboard, TrendingUp, LogOut as EndSessionIcon,
  ChevronLeft, ChevronRight, Zap, User as UserIcon, Terminal, Activity
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
} from 'lucide-react';

export default function App() {
  const [isSplashing, setIsSplashing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeLeads, setActiveLeads] = useState<Lead[]>([]);
  const [dbLeads, setDbLeads] = useState<Lead[]>([]);
  const [taskLeads, setTaskLeads] = useState<Lead[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('DASHBOARD');
<<<<<<< HEAD
=======
  const [alertThreshold, setAlertThreshold] = useState(60);
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'alert' | 'info' | 'warning' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'alert' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  useEffect(() => {
<<<<<<< HEAD
    const timer = setTimeout(() => setIsSplashing(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const mapLeadData = useCallback((l: any): Lead => {
    return {
      ...l,
      Availability: (l.Availability || LeadStatus.UNASSIGNED) as LeadStatus,
      lastUpdated: l.lastUpdated || new Date().toISOString()
    } as Lead;
  }, []);

  const updateAppState = useCallback((data: any) => {
    if (!data) return;
    if (data.dashboard) setActiveLeads(data.dashboard.map(mapLeadData));
    if (data.tasks) setTaskLeads(data.tasks.map(mapLeadData));
    if (data.analytics) setDbLeads(data.analytics.map(mapLeadData));
  }, [mapLeadData]);

  const syncAll = useCallback(async (username: string) => {
    setIsLoading(true);
    try {
      const res = await fetchAllState(username);
      if (res.status === "SUCCESS" && res.data) {
        updateAppState(res.data);
=======
    const timer = setTimeout(() => setIsSplashing(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const mapLeadData = useCallback((l: any, idx: number, currentUser: string): Lead => {
    const id = l.id || (l.Sno ? `L-SNO-${l.Sno}` : `L-TMP-${idx}-${Date.now()}`);
    const rawStatus = String(l.Availability || l.availability || '').toLowerCase().trim();
    let availability = LeadStatus.UNASSIGNED;
    if (rawStatus.includes('booked')) availability = LeadStatus.BOOKED;
    else if (rawStatus.includes('decline')) availability = LeadStatus.DECLINED;
    else if (rawStatus.includes('follow')) availability = LeadStatus.FOLLOW_UP;
    else if (rawStatus.includes('busy')) availability = LeadStatus.BUSY;

    return {
      ...l,
      id,
      Sno: l.Sno || l.sno || idx + 1,
      Company: l.Company || l.company || "Unknown Entity",
      Number: l.Number || l.number || "N/A",
      Ratings: l.Ratings || l.ratings || "0.0",
      Website: l.Website || l.website || "NONE",
      Type: l.Type || l.type || "N/A",
      Availability: availability,
      Summary: l.Summary || l.summary || "",
      employeeOwner: l.Username || l.username || l.employeeOwner || currentUser,
      lastUpdated: l['date&time'] || l.DateTime || l.dateTime || new Date().toISOString(),
      DateTime: l['date&time'] || l.DateTime || l.dateTime || ""
    } as Lead;
  }, []);

  const detectAlerts = useCallback((leads: Lead[]) => {
    const newAlerts: SystemAlert[] = [];
    const sortedLeads = [...leads].sort((a, b) => new Date(a.DateTime || a.lastUpdated).getTime() - new Date(b.DateTime || b.lastUpdated).getTime());
    const userGroups: Record<string, Lead[]> = {};
    sortedLeads.forEach(l => {
      const owner = String(l.employeeOwner || 'SYSTEM').toLowerCase();
      if (!userGroups[owner]) userGroups[owner] = [];
      userGroups[owner].push(l);
    });
    Object.keys(userGroups).forEach(username => {
      const group = userGroups[username];
      for (let i = 1; i < group.length; i++) {
        const current = group[i];
        const previous = group[i - 1];
        const currentTime = new Date(current.DateTime || current.lastUpdated).getTime();
        const prevTime = new Date(previous.DateTime || previous.lastUpdated).getTime();
        const diffSeconds = Math.abs(currentTime - prevTime) / 1000;
        if (diffSeconds > 0 && diffSeconds < alertThreshold) {
          newAlerts.push({
            id: `alert-${previous.Sno}-${current.Sno}`,
            snoPair: `${previous.Sno} & ${current.Sno}`,
            company: current.Company,
            phone: current.Number,
            status: current.Availability,
            username: current.employeeOwner,
            timeDiff: Math.round(diffSeconds),
            timestamp: current.DateTime || current.lastUpdated,
            isAcknowledged: false,
            rating: current.Ratings,
            website: current.Website,
            summary: current.Summary
          });
        }
      }
    });
    setAlerts(prev => {
      const existingIds = new Set(prev.map(a => a.id));
      const filteredNew = newAlerts.filter(a => !existingIds.has(a.id));
      return [...prev, ...filteredNew];
    });
  }, [alertThreshold]);

  const loadData = useCallback(async (username: string) => {
    setIsLoading(true);
    try {
      const [activeRes, tasksRes, analyticsRes] = await Promise.all([
        fetchActiveData(username),
        fetchTasksData(username),
        fetchAnalyticsData(username)
      ]);
      if (activeRes.status === "SUCCESS") setActiveLeads(activeRes.leads.map((l: any, i: number) => mapLeadData(l, i, username)));
      if (tasksRes.status === "SUCCESS") setTaskLeads(tasksRes.leads.map((l: any, i: number) => mapLeadData(l, i, username)));
      if (analyticsRes.status === "SUCCESS") {
        const processedDbLeads = analyticsRes.leads.map((l: any, i: number) => mapLeadData(l, i, username));
        setDbLeads(processedDbLeads);
        detectAlerts(processedDbLeads);
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
      }
    } catch (e: any) {
      showToast("Sync link disrupted.", "alert");
    } finally {
      setIsLoading(false);
    }
<<<<<<< HEAD
  }, [updateAppState, showToast]);
=======
  }, [mapLeadData, detectAlerts, showToast]);
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c

  const handleLogin = async (username: string, password_input: string) => {
    setIsAuthenticating(true);
    try {
      const response = await loginUser(username, password_input);
      if (response && response.success) {
        const loggedUser: User = { 
          username: response.user!, 
          role: response.role! as 'ADMIN' | 'EMPLOYEE'
        };
        setUser(loggedUser);
<<<<<<< HEAD
        if (response.initialData) {
          updateAppState(response.initialData);
        }
=======
        loadData(loggedUser.username);
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
        showToast(`Authorized: ${response.user}`, 'success');
      } else {
        showToast(response.message || "Invalid credentials.", "alert");
      }
    } catch (err: any) {
      showToast("Security link error.", "alert");
    } finally {
      setIsAuthenticating(false);
    }
  };

<<<<<<< HEAD
  const handleFinalizeLead = async (leadId: string, listType: 'active' | 'task' = 'active', updatedLead?: Partial<Lead>) => {
    if (!user) return;
    
    const list = listType === 'active' ? activeLeads : taskLeads;
    const lead = list.find(l => l.id === leadId);
    if (!lead) return;
    
    const finalLead = { ...lead, ...updatedLead };

    if (finalLead.Availability === LeadStatus.UNASSIGNED) {
      showToast("Select availability status.", "alert");
      return;
    }
    if (!finalLead.Summary || finalLead.Summary.trim().length < 3) {
      showToast("Provide summary log (min 3 chars).", "alert");
      return;
    }

    setIsLoading(true);
    try {
      const res = await submitLead(user.username, finalLead);
      if (res.status === "SUCCESS" && res.data) {
        showToast("Lead Orchestrated Successfully.", "success");
        updateAppState(res.data);
      } else {
        showToast("Sync failed.", "alert");
      }
    } catch (e: any) { 
      showToast("Neural link error.", "alert"); 
    } finally {
      setIsLoading(false);
    }
=======
  const handleFinalizeLead = async (leadId: string) => {
    const lead = activeLeads.find(l => l.id === leadId);
    if (!lead || !user) return;
    if (lead.Availability === LeadStatus.UNASSIGNED || !lead.Summary || lead.Summary.trim().length < 3) {
      showToast("Intel logs required.", "alert");
      return;
    }
    try {
      const res = await appendToDB(user.username, [{
        Company: lead.Company,
        Ratings: lead.Ratings,
        Number: lead.Number,
        Website: lead.Website,
        Type: lead.Type,
        Availability: lead.Availability,
        Summary: lead.Summary,
        Check: true
      }]);
      if (res.status === "SUCCESS") {
        showToast(`Archived.`, "success");
        setActiveLeads(prev => prev.filter(l => l.id !== leadId));
        loadData(user.username);
      }
    } catch (e) { showToast("Commit error.", "alert"); }
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
  };

  if (isSplashing) return <Splash />;
  if (!user) return <Login onLogin={handleLogin} isAuthenticating={isAuthenticating} />;

<<<<<<< HEAD
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="h-screen w-screen bg-[#050403] flex overflow-hidden">
      <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-[#0c0c0c] flex flex-col h-full relative transition-all duration-300 shrink-0 border-r border-white/5`}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="absolute -right-4 top-12 w-8 h-8 rounded-full bg-white text-zinc-900 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.3)] z-50 hover:bg-[#eb7c52] hover:text-white transition-all active:scale-90 border border-zinc-100"
        >
          {isCollapsed ? <ChevronRight size={16} strokeWidth={3} /> : <ChevronLeft size={16} strokeWidth={3} />}
        </button>

        <div className={`p-10 flex flex-col ${isCollapsed ? 'items-center' : ''}`}>
          <h1 className={`${isCollapsed ? 'text-lg' : 'text-3xl'} font-black text-white uppercase mb-16 transition-all tracking-tighter`}>
            {isCollapsed ? 'Z' : 'ZODZY'}
          </h1>
          <nav className="space-y-4 w-full">
            <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" active={currentView === 'DASHBOARD'} onClick={() => setCurrentView('DASHBOARD')} collapsed={isCollapsed} />
            <NavItem icon={<ListChecks className="w-5 h-5" />} label="Tasks" active={currentView === 'TASK_LIST'} onClick={() => setCurrentView('TASK_LIST')} collapsed={isCollapsed} />
            <NavItem icon={<TrendingUp className="w-5 h-5" />} label="Analytics" active={currentView === 'ANALYTICS'} onClick={() => setCurrentView('ANALYTICS')} collapsed={isCollapsed} />
            {isAdmin && <NavItem icon={<FileCode className="w-5 h-5" />} label="Database" active={currentView === 'DATABASE'} onClick={() => setCurrentView('DATABASE')} collapsed={isCollapsed} />}
          </nav>
        </div>
        <div className="mt-auto p-8 space-y-4">
          <button 
            onClick={() => syncAll(user.username)} 
            disabled={isLoading} 
            className="bg-white/5 text-white/80 border border-white/10 w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 hover:bg-white/10 hover:text-white shadow-xl"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DbIcon className="w-4 h-4" />}
            {!isCollapsed && (isLoading ? 'Syncing...' : 'Sync Hub')}
          </button>
          <button onClick={() => setUser(null)} className="w-full flex items-center gap-4 py-5 px-4 text-white/40 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest">
=======
  return (
    <div className="min-h-screen bg-[#050403] flex flex-col md:flex-row p-3 gap-3">
      <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-[#0c0c0c] rounded-[2rem] flex flex-col border border-white/5 h-[calc(100vh-1.5rem)] relative transition-all`}>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="sidebar-toggle-btn text-white/40 hover:text-white z-50">
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <div className={`p-8 flex flex-col ${isCollapsed ? 'items-center' : ''}`}>
          <h1 className={`${isCollapsed ? 'text-xs' : 'text-lg'} font-black text-white uppercase mb-12`}>
            {isCollapsed ? 'Z' : 'ZODZY'}
          </h1>
          <nav className="space-y-3 w-full">
            <NavItem icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" active={currentView === 'DASHBOARD'} onClick={() => setCurrentView('DASHBOARD')} collapsed={isCollapsed} />
            <NavItem icon={<ListChecks className="w-4 h-4" />} label="Tasks" active={currentView === 'TASK_LIST'} onClick={() => setCurrentView('TASK_LIST')} collapsed={isCollapsed} />
            {user.role === 'ADMIN' && <NavItem icon={<Zap className="w-4 h-4" />} label="Alerts" active={currentView === 'ALERTS'} onClick={() => setCurrentView('ALERTS')} collapsed={isCollapsed} isWarning={alerts.some(a => !a.isAcknowledged)} />}
            <NavItem icon={<TrendingUp className="w-4 h-4" />} label="Analytics" active={currentView === 'ANALYTICS'} onClick={() => setCurrentView('ANALYTICS')} collapsed={isCollapsed} />
          </nav>
        </div>
        <div className="mt-auto p-5 space-y-4">
          <button onClick={() => loadData(user.username)} disabled={isLoading} className="bg-[#eb7c52] text-white w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl">
            <Database className="w-4 h-4" /> {!isCollapsed && (isLoading ? 'Syncing...' : 'Sync Hub')}
          </button>
          <button onClick={() => setUser(null)} className="w-full flex items-center gap-3 py-4 text-white/50 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
            <EndSessionIcon className="w-5 h-5" /> {!isCollapsed && 'End Session'}
          </button>
        </div>
      </aside>

<<<<<<< HEAD
      <main className="flex-1 h-full overflow-hidden bg-white">
        {currentView === 'DASHBOARD' && (
          user.role === 'ADMIN' ? 
          <div className="p-0 h-full overflow-auto"><AdminDashboard allLeads={[...dbLeads, ...taskLeads]} isLoading={isLoading} onRefresh={() => syncAll(user.username)} alerts={[]} onAcknowledgeAlert={()=>{}} logs={[]} employeeStats={[]} alertThreshold={60} onUpdateThreshold={()=>{}} /></div> :
          <EmployeeDashboard leads={activeLeads} isLoading={isLoading} onRefresh={() => syncAll(user.username)} onUpdateStatus={(id, s) => setActiveLeads(prev => prev.map(l => l.id === id ? { ...l, Availability: s } : l))} onUpdateNotes={(id, n) => setActiveLeads(prev => prev.map(l => l.id === id ? { ...l, Summary: n } : l))} onUpdateField={(id, field, value) => setActiveLeads(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))} onFinalizeLead={(id) => handleFinalizeLead(id, 'active')} />
        )}
        {currentView === 'TASK_LIST' && <TaskSummaryView leads={taskLeads} onUpdateStatus={(id, s) => {
            setTaskLeads(prev => prev.map(l => l.id === id ? { ...l, Availability: s } : l));
          }} onUpdateNotes={(id, n) => setTaskLeads(prev => prev.map(l => l.id === id ? { ...l, Summary: n } : l))} onUpdateField={(id, field, value) => setTaskLeads(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))} onFinalizeLead={(id, updated) => handleFinalizeLead(id, 'task', updated)} />}
        {currentView === 'ANALYTICS' && <LeadAnalytics leads={dbLeads} isLoading={isLoading} onRefresh={() => syncAll(user.username)} title="Analytics" isAdmin={isAdmin} />}
        {currentView === 'DATABASE' && isAdmin && <DatabaseInspector />}
      </main>

      {toast && (
        <div className="fixed bottom-12 right-12 z-[100] bg-zinc-900 text-white px-8 py-5 rounded-2xl flex items-start gap-4 shadow-2xl border border-white/5 animate-in slide-in-from-right-10">
          <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center ${toast.type === 'alert' ? 'bg-rose-500' : 'bg-[#eb7c52]'} shadow-lg`}>
            {toast.type === 'alert' ? <BellRing className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-[12px] font-black uppercase tracking-widest text-white/90">{toast.type}</p>
            <p className="text-[11px] font-medium text-white/60 mt-0.5">{toast.message}</p>
          </div>
=======
      <main className="flex-1 space-y-6 px-1 md:px-4 pt-4 h-[calc(100vh-1.5rem)] overflow-y-auto">
        {currentView === 'DASHBOARD' && (
          user.role === 'ADMIN' ? 
          <AdminDashboard allLeads={[...dbLeads, ...taskLeads]} isLoading={isLoading} onRefresh={() => loadData(user.username)} alerts={alerts} onAcknowledgeAlert={(id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, isAcknowledged: true } : a))} logs={[]} employeeStats={[]} alertThreshold={alertThreshold} onUpdateThreshold={setAlertThreshold} /> :
          <EmployeeDashboard leads={activeLeads} isLoading={isLoading} onRefresh={() => loadData(user.username)} onUpdateStatus={(id, s) => setActiveLeads(prev => prev.map(l => l.id === id ? { ...l, Availability: s } : l))} onUpdateNotes={(id, n) => setActiveLeads(prev => prev.map(l => l.id === id ? { ...l, Summary: n } : l))} onFinalizeLead={handleFinalizeLead} />
        )}
        {currentView === 'TASK_LIST' && <TaskSummaryView leads={taskLeads} />}
        {currentView === 'ALERTS' && user.role === 'ADMIN' && <AnomaliesView alerts={alerts} onAcknowledgeAlert={(id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, isAcknowledged: true } : a))} alertThreshold={alertThreshold} onUpdateThreshold={setAlertThreshold} />}
        {currentView === 'ANALYTICS' && <LeadAnalytics leads={dbLeads} isLoading={isLoading} onRefresh={() => loadData(user.username)} title="Archive" isAdmin={user.role === 'ADMIN'} />}
      </main>

      {toast && (
        <div className="fixed bottom-8 right-8 z-[100] bg-[#0d0b09] text-white px-6 py-4 rounded-xl flex items-start gap-3 shadow-2xl border border-white/10 animate-in slide-in-from-right-10">
          <div className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center ${toast.type === 'alert' ? 'bg-rose-500' : 'bg-[#eb7c52]'}`}>
            {toast.type === 'alert' ? <BellRing className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          </div>
          <p className="text-[11px] font-medium text-white/90">{toast.message}</p>
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
        </div>
      )}
    </div>
  );
}

function Splash() {
  return (
    <div className="fixed inset-0 bg-[#050403] z-[1000] flex items-center justify-center">
      <div className="hero-glow opacity-50"></div>
<<<<<<< HEAD
      <h1 className="text-white font-black text-6xl md:text-9xl tracking-tighter uppercase animate-pulse">ZODZY</h1>
=======
      <h1 className="text-white font-black text-6xl md:text-8xl tracking-widest uppercase animate-pulse">ZODZY</h1>
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
    </div>
  );
}

function Login({ onLogin, isAuthenticating }: { onLogin: (u: string, p: string) => void, isAuthenticating: boolean }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onLogin(username, password); };

  return (
    <div className="w-screen h-screen flex flex-col lg:flex-row overflow-hidden">
<<<<<<< HEAD
      <div className="w-full lg:w-[45%] bg-[#050403] relative flex flex-col justify-center items-center p-12 lg:p-24 overflow-hidden text-center">
        <div className="system-grid absolute inset-0 opacity-20 pointer-events-none"></div>
        <div className="absolute top-[-20%] left-[-20%] w-[100%] h-[100%] bg-[#eb7c52]/10 blur-[150px] rounded-full"></div>
        <div className="relative z-10 animate-in fade-in slide-in-from-left-10 duration-1000">
          <h1 className="text-8xl font-black text-white tracking-tighter uppercase mb-2">ZODZY</h1>
          <p className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.5em] mt-4 opacity-80">Autonomous CRM Orchestration</p>
        </div>
        <div className="absolute bottom-12 z-10 opacity-30">
           <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em]">PROPRIETARY NEURAL SYSTEM • ZODZY LABS</p>
        </div>
      </div>
      <div className="w-full lg:w-[55%] bg-[#fdfdfd] flex items-center justify-center p-8 lg:p-24 relative">
        <div className="max-w-md w-full animate-in fade-in slide-in-from-right-10 duration-1000 delay-200">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-tight">Join with us</h3>
              </div>
              <div className="space-y-4">
                <div className="relative group">
                  <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-[#eb7c52] transition-colors" />
                  <input 
                    type="text" 
                    placeholder="USERNAME" 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-6 pl-16 pr-8 text-sm font-bold text-zinc-900 focus:outline-none focus:border-[#eb7c52] focus:bg-white focus:ring-4 focus:ring-[#eb7c52]/10 transition-all placeholder:text-zinc-400" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    required 
                  />
                </div>
                <div className="relative group">
                  <LockIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-[#eb7c52] transition-colors" />
                  <input 
                    type="password" 
                    placeholder="PASSWORD" 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-6 pl-16 pr-8 text-sm font-bold text-zinc-900 focus:outline-none focus:border-[#eb7c52] focus:bg-white focus:ring-4 focus:ring-[#eb7c52]/10 transition-all placeholder:text-zinc-400" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isAuthenticating} 
              className="w-full bg-zinc-900 text-white font-black py-6 rounded-2xl flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-[12px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] active:scale-95 hover:bg-black transition-all disabled:opacity-50"
            >
              {isAuthenticating ? <Loader2 className="w-6 h-6 animate-spin" /> : <>LOGIN <ArrowRight size={18} /></>}
=======
      {/* LEFT SIDE: THE DARK BRANDING PANE (ZODZY) */}
      <div className="w-full lg:w-[45%] bg-[#050403] relative flex flex-col justify-center items-center p-12 lg:p-24 overflow-hidden text-center">
        <div className="system-grid absolute inset-0 opacity-20 pointer-events-none"></div>
        <div className="absolute top-[-20%] left-[-20%] w-[100%] h-[100%] bg-[#eb7c52]/10 blur-[150px] rounded-full"></div>
        
        <div className="relative z-10 animate-in fade-in slide-in-from-left-10 duration-1000">
          <h1 className="text-7xl font-black text-white tracking-tighter uppercase mb-2">ZODZY</h1>
          <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.5em] mt-4 opacity-80">Leads orchestration crm</p>
        </div>

        <div className="absolute bottom-12 z-10 opacity-30">
           <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em]">
             Proprietary Neural System • ZODZY Labs
           </p>
        </div>
      </div>

      {/* RIGHT SIDE: THE LIGHT AUTHENTICATION WORKSPACE */}
      <div className="w-full lg:w-[55%] bg-[#fdfdfd] flex items-center justify-center p-8 lg:p-24 relative">
        <div className="max-w-sm w-full animate-in fade-in slide-in-from-right-10 duration-1000 delay-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-1 ml-1">join with us</p>
              <div className="relative group">
                <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-[#eb7c52] transition-colors" />
                <input 
                  type="text" 
                  placeholder="username" 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-5 pl-14 pr-6 text-sm text-zinc-900 focus:outline-none focus:border-[#eb7c52] focus:bg-white focus:ring-4 focus:ring-[#eb7c52]/10 transition-all placeholder:text-zinc-400" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                />
              </div>
              <div className="relative group">
                <LockIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-[#eb7c52] transition-colors" />
                <input 
                  type="password" 
                  placeholder="password" 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-5 pl-14 pr-6 text-sm text-zinc-900 focus:outline-none focus:border-[#eb7c52] focus:bg-white focus:ring-4 focus:ring-[#eb7c52]/10 transition-all placeholder:text-zinc-400" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isAuthenticating} 
              className="w-full bg-[#111111] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-[11px] shadow-[0_20px_40px_rgba(0,0,0,0.2)] active:scale-95 hover:bg-zinc-800 transition-all disabled:opacity-50"
            >
              {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin" /> : <>login <ArrowRight size={16} /></>}
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

<<<<<<< HEAD
function NavItem({ icon, label, active, onClick, collapsed }: { icon: any, label: string, active: boolean, onClick: any, collapsed: boolean }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-5 py-5 rounded-2xl transition-all font-black text-[11px] uppercase tracking-[0.2em] relative ${collapsed ? 'justify-center px-0' : 'px-8'} ${active ? 'bg-white text-zinc-900 shadow-xl' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}>
      <span className={active ? 'text-zinc-900' : ''}>{icon}</span>
      {!collapsed && <span className={active ? 'text-zinc-900' : ''}>{label}</span>}
=======
function NavItem({ icon, label, active, onClick, collapsed, isWarning }: { icon: any, label: string, active: boolean, onClick: any, collapsed: boolean, isWarning?: boolean }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 py-4 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest relative ${collapsed ? 'justify-center px-0' : 'px-6'} ${active ? 'bg-white/5 text-white' : 'text-white/40 hover:text-white'}`}>
      <span className={active ? 'text-[#eb7c52]' : ''}>{icon}</span>
      {!collapsed && <span>{label}</span>}
      {isWarning && <span className="absolute top-4 right-4 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>}
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
    </button>
  );
}
