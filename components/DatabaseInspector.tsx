
import React, { useState, useMemo } from 'react';
import { neuralDB } from '../services/localDb';
import { fetchAllState } from '../services/leadService';
import { Lead, LeadStatus } from '../types';
import { 
  Database, Copy, Trash2, Check, FileCode, Search, Terminal, 
  Table as TableIcon, List, Clock, User, MessageSquare, ShieldCheck,
  Zap, Download, DatabaseZap, RefreshCw, Layers, HardDrive, Cpu
} from 'lucide-react';

const DatabaseInspector: React.FC = () => {
  const [dbState, setDbState] = useState(neuralDB.getRawState());
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'TABLE' | 'JSON'>('TABLE');
  const [isSyncing, setIsSyncing] = useState(false);

  // Combine Analytics and Tasks into a unified SQL-style master log
  const masterAuditLog = useMemo(() => {
    const combined = [
      ...dbState.analytics.map(l => ({ ...l, registrySource: 'ANALYTICS' })),
      ...dbState.tasks.map(l => ({ ...l, registrySource: 'TASKS' }))
    ];
    
    const term = searchTerm.toLowerCase().trim();
    return combined
      .filter(l => {
        if (!term) return true;
        const pool = [l.Company, l.Number, l.employeeOwner, l.Summary, l.Availability, l.registrySource].join(' ').toLowerCase();
        return pool.includes(term);
      })
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }, [dbState, searchTerm]);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(dbState, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGlobalSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetchAllState('Karthik');
      if (res.status === "SUCCESS") {
        setDbState(neuralDB.getRawState());
      }
    } catch (err) {
      console.error("Registry Sync Failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSeed = () => {
    if (confirm("Populate database with example neural intelligence records? This demonstrates how data appears after being retrieved from sheets and processed by specialists.")) {
      neuralDB.seedMockData();
      setDbState(neuralDB.getRawState());
    }
  };

  const getStatusStyle = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.BOOKED: return 'text-emerald-600 border-emerald-200 bg-emerald-50';
      case LeadStatus.DECLINED: return 'text-rose-600 border-rose-200 bg-rose-50';
      case LeadStatus.FOLLOW_UP: return 'text-amber-600 border-amber-200 bg-amber-50';
      case LeadStatus.BUSY: return 'text-zinc-500 border-zinc-200 bg-zinc-50';
      default: return 'text-zinc-400 border-zinc-100 bg-zinc-50';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-700">
      {/* Dynamic Header */}
      <div className="px-10 pt-10 pb-6 flex flex-col xl:flex-row items-end justify-between gap-6 shrink-0 border-b border-zinc-100">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#eb7c52]/10 border border-[#eb7c52]/20 flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-[#eb7c52]" />
            </div>
            <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Registry Audit</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
              <Terminal className="w-3.5 h-3.5" />
              <span>SQL Kernel v4.21.0</span>
            </div>
            <div className="flex p-1 bg-zinc-100 rounded-lg border border-zinc-200">
              <button 
                onClick={() => setViewMode('TABLE')}
                className={`px-4 py-1.5 rounded-md flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'TABLE' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-900'}`}
              >
                <TableIcon size={12} /> Grid View
              </button>
              <button 
                onClick={() => setViewMode('JSON')}
                className={`px-4 py-1.5 rounded-md flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'JSON' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-900'}`}
              >
                <FileCode size={12} /> Raw JSON
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="relative group flex-1 md:w-[320px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
            <input 
              type="text" 
              placeholder="QUERY REGISTRY..."
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-4 pl-12 pr-12 text-[11px] font-black text-zinc-900 focus:outline-none focus:border-[#eb7c52] transition-all placeholder:text-zinc-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={handleGlobalSync}
            disabled={isSyncing}
            className="flex items-center gap-3 px-6 py-4 rounded-xl bg-zinc-900 text-white hover:bg-black transition-all text-[10px] font-black uppercase tracking-widest shadow-lg"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'PULLING...' : 'SYNC ALL'}
          </button>

          <button 
            onClick={handleSeed}
            className="flex items-center gap-3 px-6 py-4 rounded-xl bg-[#eb7c52]/10 text-[#eb7c52] hover:bg-[#eb7c52] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-[#eb7c52]/20"
          >
            <DatabaseZap size={16} />
            SEED
          </button>

          <button 
            onClick={handleCopy}
            className="flex items-center justify-center p-4 rounded-xl bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-all border border-zinc-200"
          >
            {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
          </button>
          
          <button 
            onClick={() => { if(confirm("Nuke entire registry?")) { neuralDB.clearDatabase(); setDbState(neuralDB.getRawState()); } }}
            className="flex items-center justify-center p-4 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-100"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Status Dashboard */}
        <div className="px-10 py-5 bg-zinc-50 border-b border-zinc-100 flex items-center gap-12 text-zinc-400">
           <div className="flex items-center gap-3">
              <Cpu className="w-4 h-4 text-[#eb7c52]" />
              <span className="text-[10px] font-black uppercase tracking-widest">Active Records:</span>
              <span className="text-zinc-900 font-black">{masterAuditLog.length}</span>
           </div>
           <div className="w-px h-4 bg-zinc-200"></div>
           <div className="flex items-center gap-3">
              <Layers className="w-4 h-4 text-zinc-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Last Sync:</span>
              <span className="text-zinc-900 font-black uppercase font-mono text-[10px]">
                {new Date(dbState.lastSync).toLocaleTimeString()}
              </span>
           </div>
        </div>

        {/* Dynamic Viewport */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'JSON' ? (
            <div className="h-full p-10 bg-zinc-50">
              <div className="h-full bg-white border border-zinc-200 rounded-[2.5rem] overflow-hidden group shadow-inner">
                <pre className="h-full w-full p-10 overflow-auto custom-scrollbar font-mono text-[12px] leading-relaxed text-zinc-600 selection:bg-[#eb7c52] selection:text-white">
                  {JSON.stringify(dbState, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="sticky top-0 z-40 bg-zinc-50 shadow-sm border-b border-zinc-100">
                  <tr className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">
                    <th className="px-10 py-5 w-[180px]">TIMELOG</th>
                    <th className="px-10 py-5 w-[20%]">ENTITY / SOURCE</th>
                    <th className="px-10 py-5 w-[140px] text-center">UID</th>
                    <th className="px-10 py-5 w-[140px] text-center">OPERATOR</th>
                    <th className="px-10 py-5 w-[140px] text-center">PHASE</th>
                    <th className="px-10 py-5 flex-1">INTELLIGENCE SUMMARY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {masterAuditLog.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-56 text-center">
                        <Zap className="w-16 h-16 mx-auto text-zinc-100 mb-6" />
                        <p className="text-[11px] font-black uppercase tracking-[0.6em] text-zinc-200">Operational Database Empty</p>
                        <button onClick={handleSeed} className="mt-4 text-[9px] font-bold text-[#eb7c52] uppercase tracking-widest hover:underline">Inject Seed Data</button>
                      </td>
                    </tr>
                  ) : (
                    masterAuditLog.map((record, i) => (
                      <tr key={record.id + i} className="group hover:bg-zinc-50 transition-colors">
                        <td className="px-10 py-7">
                           <div className="flex items-center gap-3 text-zinc-400 group-hover:text-zinc-900 transition-colors">
                              <Clock size={12} className="opacity-40" />
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold font-mono text-zinc-900">
                                  {new Date(record.lastUpdated).toLocaleDateString()}
                                </span>
                                <span className="text-[9px] font-black text-zinc-400">
                                  {new Date(record.lastUpdated).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-7">
                           <div className="min-w-0">
                              <p className="text-[13px] font-black text-zinc-900 tracking-tight uppercase group-hover:text-[#eb7c52] transition-all truncate leading-tight">
                                {record.Company}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                 <span className="text-[8px] font-black px-2 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200">
                                   SRC: {record.registrySource}
                                 </span>
                                 <span className="text-[8px] font-black text-zinc-400 uppercase">{record.Type || 'COMMERCIAL'}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-7 text-center font-mono text-[11px] text-zinc-400 group-hover:text-zinc-900 transition-colors">
                           {record.Number || '---'}
                        </td>
                        <td className="px-10 py-7">
                           <div className="flex items-center justify-center gap-2.5">
                              <div className="w-6 h-6 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[9px] font-black text-zinc-500">
                                {record.employeeOwner.charAt(0)}
                              </div>
                              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{record.employeeOwner}</span>
                           </div>
                        </td>
                        <td className="px-10 py-7 text-center">
                           <div className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-lg border transition-all inline-block min-w-[100px] ${getStatusStyle(record.Availability)}`}>
                             {record.Availability}
                           </div>
                        </td>
                        <td className="px-10 py-7">
                           <div className="flex items-start gap-4">
                              <MessageSquare size={14} className="text-zinc-200 mt-1 shrink-0" />
                              <p className="text-[11px] font-medium text-zinc-500 leading-relaxed italic line-clamp-2">
                                {record.Summary || 'NULL_RECORD'}
                              </p>
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseInspector;
