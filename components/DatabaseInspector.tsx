
import React, { useState } from 'react';
import { neuralDB } from '../services/localDb';
import { Database, Copy, Trash2, Check, FileCode, Search, Terminal } from 'lucide-react';

const DatabaseInspector: React.FC = () => {
  const [dbState, setDbState] = useState(neuralDB.getRawState());
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const jsonString = JSON.stringify(dbState, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (confirm("CRITICAL WARNING: This will permanently delete all local lead data, tasks, and analytics for this browser session. Proceed with Registry Nuke?")) {
      neuralDB.clearDatabase();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#050403] overflow-hidden animate-in fade-in duration-700">
      <div className="px-10 pt-10 pb-6 flex flex-col xl:flex-row items-end justify-between gap-6 shrink-0 border-b border-white/5">
        <div className="space-y-1">
          <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">System Registry</h2>
          <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-2">
            <Terminal className="w-4 h-4 text-[#eb7c52]" />
            <span>Raw Neural Storage Inspector</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleCopy}
            className="flex items-center gap-3 px-6 py-4 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest border border-white/5"
          >
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            {copied ? 'COPIED TO CLIPBOARD' : 'COPY REGISTRY JSON'}
          </button>
          <button 
            onClick={handleClear}
            className="flex items-center gap-3 px-6 py-4 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-rose-500/20"
          >
            <Trash2 size={16} />
            NUKE REGISTRY
          </button>
        </div>
      </div>

      <div className="flex-1 p-10 overflow-hidden flex flex-col gap-6">
        <div className="flex items-center justify-between text-zinc-500">
           <div className="flex items-center gap-6">
              <div className="flex flex-col">
                 <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Pool Size</span>
                 <span className="text-xl font-black text-white">{Object.values(dbState.pool).flat().length}</span>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="flex flex-col">
                 <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Task Queue</span>
                 <span className="text-xl font-black text-[#eb7c52]">{dbState.tasks.length}</span>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="flex flex-col">
                 <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Analytics</span>
                 <span className="text-xl font-black text-emerald-500">{dbState.analytics.length}</span>
              </div>
           </div>
           <div className="text-[10px] font-bold uppercase tracking-widest italic opacity-30">
             LocalStorage Key: zodzy_neural_db_v4
           </div>
        </div>

        <div className="flex-1 bg-black/40 border border-white/5 rounded-[2rem] overflow-hidden relative group">
          <div className="absolute top-6 right-8 z-10 opacity-30 group-hover:opacity-100 transition-opacity">
            <FileCode className="text-white w-12 h-12" />
          </div>
          <pre className="h-full w-full p-10 overflow-auto custom-scrollbar font-mono text-[12px] leading-relaxed text-zinc-400 selection:bg-[#eb7c52] selection:text-white">
            {jsonString}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DatabaseInspector;
