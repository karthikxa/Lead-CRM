
import React from 'react';
import { SystemAlert } from '../types';
import { Zap, ShieldCheck, Check, Settings, AlertTriangle, User, Clock, Activity, Star, Globe, Navigation, Instagram } from 'lucide-react';

interface AnomaliesViewProps {
  alerts: SystemAlert[];
  onAcknowledgeAlert: (id: string) => void;
  alertThreshold: number;
  onUpdateThreshold: (val: number) => void;
}

const AnomaliesView: React.FC<AnomaliesViewProps> = ({ 
  alerts, 
  onAcknowledgeAlert, 
  alertThreshold, 
  onUpdateThreshold 
}) => {
  const unacknowledgedAlerts = alerts.filter(a => !a.isAcknowledged);

  const renderAssetLink = (website?: string) => {
    if (!website || website === 'NONE') return <span className="text-[8px] font-black text-zinc-900">---</span>;
    const url = website.toLowerCase();
    const finalUrl = website.startsWith('http') ? website : `https://${website}`;
    
    let Icon = Globe;
    if (url.includes('instagram.com')) Icon = Instagram;
    else if (url.includes('maps.google') || url.includes('google.com/maps')) Icon = Navigation;

    return (
      <a href={finalUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 mx-auto rounded-lg border border-white/10 bg-[#0d0d0d] flex items-center justify-center transition-all hover:scale-110 text-white/40 hover:text-rose-500">
        <Icon className="w-3.5 h-3.5" />
      </a>
    );
  };

  return (
    <div className="space-y-8 pb-32 stagger-item">
      {/* Dynamic Header Section */}
      <div className="flex flex-col xl:flex-row items-end justify-between gap-6 px-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]"></div>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter leading-none uppercase">Alert Fraud Detection</h2>
          <div className="flex items-center gap-3 text-[9px] font-bold text-zinc-600 uppercase tracking-widest bg-white/[0.02] border border-white/5 px-4 py-2 rounded-lg">
            <Zap className="w-3 h-3 text-rose-500" />
            <span>Threshold: {alertThreshold}s</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#0c0c0c] border border-white/5 p-4 px-6 rounded-2xl flex items-center gap-6 shadow-2xl">
            <div className="text-right">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1.5">Anomaly Sensitivity</p>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Adjust Threshold</p>
            </div>
            <div className="flex items-center gap-3">
               <input 
                type="number" 
                value={alertThreshold} 
                onChange={(e) => onUpdateThreshold(Number(e.target.value))}
                className="bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white text-[12px] font-black w-20 focus:border-rose-500 focus:outline-none transition-all text-center shadow-inner"
              />
              <Settings className="w-4 h-4 text-zinc-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Re-architected Detailed Alerts Table */}
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#080808] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative mx-2">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1500px] table-fixed">
            <thead className="sticky top-0 z-30 bg-[#050403]">
              <tr className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] border-b border-white/10">
                <th className="px-6 py-6 w-20 text-center">SNO</th>
                <th className="px-6 py-6 w-[320px]">COMPANY</th>
                <th className="px-6 py-6 w-28 text-center">RATING</th>
                <th className="px-6 py-6 w-40 text-center">CONTACT</th>
                <th className="px-6 py-6 w-24 text-center">LINK</th>
                <th className="px-6 py-6 w-36 text-center">STATUS</th>
                <th className="px-6 py-6 w-[280px]">SUMMARY</th>
                <th className="px-6 py-6 w-24 text-center">COMMIT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {alerts.length === 0 ? (
                <tr>
                   <td colSpan={8} className="py-64 text-center">
                      <ShieldCheck className="w-16 h-16 mx-auto text-zinc-900 mb-6" />
                      <p className="text-[12px] font-black text-zinc-800 uppercase tracking-[0.6em]">System Integrity Optimal</p>
                   </td>
                </tr>
              ) : (
                [...alerts].reverse().map((alert, idx) => (
                  <tr key={alert.id} className={`group hover:bg-white/[0.01] transition-all duration-300 border-l-4 ${alert.isAcknowledged ? 'border-transparent opacity-25 grayscale' : 'border-rose-500/40 hover:border-rose-500'}`}>
                    <td className="px-6 py-8 text-center">
                       <p className="text-[11px] font-black text-white/40 group-hover:text-white transition-colors">{alert.snoPair.split('&')[1].trim()}</p>
                       <p className="text-[7px] font-bold text-rose-500 uppercase tracking-widest mt-1">FAST {alert.timeDiff}s</p>
                    </td>
                    <td className="px-6 py-8">
                       <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center font-black text-white/20">
                             {alert.company?.charAt(0) || '?'}
                          </div>
                          <div>
                             <p className="text-[13px] font-black text-white tracking-tight leading-tight uppercase group-hover:text-rose-500 transition-colors">{alert.company}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <User className="w-2.5 h-2.5 text-zinc-600" />
                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{alert.username}</span>
                             </div>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-8 text-center">
                       <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400/5 border border-amber-400/10 text-amber-400 text-[10px] font-black">
                         <Star className="w-3 h-3 fill-amber-400" /> {alert.rating || '0.0'}
                       </div>
                    </td>
                    <td className="px-6 py-8 text-center font-mono text-[12px] text-white/40 group-hover:text-white transition-colors">
                       {alert.phone}
                    </td>
                    <td className="px-6 py-8 text-center">
                       {renderAssetLink(alert.website)}
                    </td>
                    <td className="px-6 py-8 text-center">
                       <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] bg-rose-500/5 px-3 py-1.5 rounded-lg border border-rose-500/10">
                          {alert.status}
                       </span>
                    </td>
                    <td className="px-6 py-8">
                       <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-3 group-hover:bg-black/40 transition-all">
                          <p className="text-[11px] font-medium text-white/70 leading-relaxed italic line-clamp-2">"{alert.summary || 'Log missing'}"</p>
                       </div>
                    </td>
                    <td className="px-6 py-8 text-center">
                       {!alert.isAcknowledged ? (
                         <button 
                           onClick={() => onAcknowledgeAlert(alert.id)}
                           className="w-10 h-10 mx-auto rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:border-transparent transition-all shadow-xl active:scale-90 group/btn"
                         >
                           <Check size={16} strokeWidth={3} className="text-rose-500 group-hover/btn:text-white" />
                         </button>
                       ) : (
                         <ShieldCheck size={18} className="mx-auto text-zinc-800" />
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Informational Footer */}
      <div className="px-6 flex items-center gap-4 text-zinc-800">
         <AlertTriangle className="w-4 h-4 text-rose-500" />
         <p className="text-[9px] font-black uppercase tracking-[0.3em]">
           Critical: Operations appearing faster than {alertThreshold} seconds are flagged for manual verification.
         </p>
      </div>
    </div>
  );
};

export default AnomaliesView;
