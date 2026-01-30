
import React, { useState, useCallback, useEffect } from 'react';
import { User, Lead, LeadStatus, AppView, SystemAlert } from './types';
import { fetchAllState, loginUser, submitLead, updateTask } from './services/leadService';
import EmployeeDashboard from './components/EmployeeDashboard';
import LeadAnalytics from './components/LeadAnalytics';
import TaskSummaryView from './components/TaskSummaryView';
import AdminDashboard from './components/AdminDashboard';
import DatabaseInspector from './components/DatabaseInspector';
import { 
  Loader2, Database as DbIcon, ListChecks, 
  ShieldCheck, BellRing, Lock as LockIcon, ArrowRight,
  LayoutDashboard, TrendingUp, LogOut as EndSessionIcon,
  ChevronLeft, ChevronRight, Zap, User as UserIcon, FileCode
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'alert' | 'info' | 'warning' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'alert' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  useEffect(() => {
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
      }
    } catch (e: any) {
      showToast("Sync link disrupted.", "alert");
    } finally {
      setIsLoading(false);
    }
  }, [updateAppState, showToast]);

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
        if (response.initialData) {
          updateAppState(response.initialData);
        }
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
  };

  if (isSplashing) return <Splash />;
  if (!user) return <Login onLogin={handleLogin} isAuthenticating={isAuthenticating} />;

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
            <EndSessionIcon className="w-5 h-5" /> {!isCollapsed && 'End Session'}
          </button>
        </div>
      </aside>

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
        </div>
      )}
    </div>
  );
}

function Splash() {
  return (
    <div className="fixed inset-0 bg-[#050403] z-[1000] flex items-center justify-center">
      <div className="hero-glow opacity-50"></div>
      <h1 className="text-white font-black text-6xl md:text-9xl tracking-tighter uppercase animate-pulse">ZODZY</h1>
    </div>
  );
}

function Login({ onLogin, isAuthenticating }: { onLogin: (u: string, p: string) => void, isAuthenticating: boolean }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onLogin(username, password); };

  return (
    <div className="w-screen h-screen flex flex-col lg:flex-row overflow-hidden">
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
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, collapsed }: { icon: any, label: string, active: boolean, onClick: any, collapsed: boolean }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-5 py-5 rounded-2xl transition-all font-black text-[11px] uppercase tracking-[0.2em] relative ${collapsed ? 'justify-center px-0' : 'px-8'} ${active ? 'bg-white text-zinc-900 shadow-xl' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}>
      <span className={active ? 'text-zinc-900' : ''}>{icon}</span>
      {!collapsed && <span className={active ? 'text-zinc-900' : ''}>{label}</span>}
    </button>
  );
}
