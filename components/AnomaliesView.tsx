
import React from 'react';
import { SystemAlert } from '../types';
<<<<<<< HEAD
import { Zap, ShieldCheck, Check, Settings, AlertTriangle, User, Star, Globe, Navigation, Instagram } from 'lucide-react';
=======
import { Zap, ShieldCheck, Check, Settings, AlertTriangle, User, Clock, Activity, Star, Globe, Navigation, Instagram } from 'lucide-react';
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c

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
<<<<<<< HEAD
  const renderAssetLink = (website?: string) => {
    if (!website || website === 'NONE') return <span className="text-[11px] font-black text-zinc-200">---</span>;
=======
  const unacknowledgedAlerts = alerts.filter(a => !a.isAcknowledged);

  const renderAssetLink = (website?: string) => {
    if (!website || website === 'NONE') return <span className="text-[8px] font-black text-zinc-900">---</span>;
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
    const url = website.toLowerCase();
    const finalUrl = website.startsWith('http') ? website : `https://${website}`;
    
    let Icon = Globe;
<<<<<<< HEAD
    let iconClass = "text-blue-500";
    if (url.includes('instagram.com')) {
      Icon = Instagram;
      iconClass = "text-[#E4405F]";
    } else if (url.includes('maps.google') || url.includes('google.com/maps')) {
      Icon = Navigation;
      iconClass = "text-blue-600";
    }

    return (
      <a href={finalUrl} target="_blank" rel="noopener noreferrer" className={`w-9 h-9 mx-auto rounded-lg border border-zinc-200 bg-white flex items-center justify-center transition-all hover:scale-110 shadow-sm ${iconClass}`}>
        <Icon className="w-4 h-4" />
=======
    if (url.includes('instagram.com')) Icon = Instagram;
    else if (url.includes('maps.google') || url.includes('google.com/maps')) Icon = Navigation;

    return (
      <a href={finalUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 mx-auto rounded-lg border border-white/10 bg-[#0d0d0d] flex items-center justify-center transition-all hover:scale-110 text-white/40 hover:text-rose-500">
        <Icon className="w-3.5 h-3.5" />
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
      </a>
    );
  };

  return (
<<<<<<< HEAD
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-10 pt-10 pb-6 border-b border-zinc-100 flex flex-col xl:flex-row items-end justify-between gap-6 bg-white shrink-0">
        <div className="space-y-1">
          <h2 className="text-5xl font-black text-zinc-900 tracking-tighter leading-none uppercase">Fraud Detection</h2>
          <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
            <span>Active Anomaly Monitoring</span>
=======
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
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
          </div>
        </div>

        <div className="flex items-center gap-4">
<<<<<<< HEAD
          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl flex items-center gap-6 shadow-sm">
            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Sensitivity Threshold</p>
              <p className="text-[11px] font-bold text-zinc-900 uppercase tracking-widest">{alertThreshold}s Buffer</p>
=======
          <div className="bg-[#0c0c0c] border border-white/5 p-4 px-6 rounded-2xl flex items-center gap-6 shadow-2xl">
            <div className="text-right">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1.5">Anomaly Sensitivity</p>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Adjust Threshold</p>
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
            </div>
            <div className="flex items-center gap-3">
               <input 
                type="number" 
                value={alertThreshold} 
                onChange={(e) => onUpdateThreshold(Number(e.target.value))}
<<<<<<< HEAD
                className="bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-900 text-[12px] font-black w-24 focus:border-rose-500 focus:outline-none transition-all text-center shadow-inner"
              />
              <Settings className="w-5 h-5 text-zinc-400" />
=======
                className="bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white text-[12px] font-black w-20 focus:border-rose-500 focus:outline-none transition-all text-center shadow-inner"
              />
              <Settings className="w-4 h-4 text-zinc-700" />
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
            </div>
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* Alerts Table */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-white">
        <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
          <thead className="sticky top-0 z-30 bg-white shadow-sm">
            <tr className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] border-b border-zinc-100">
              <th className="px-6 py-4 w-[100px] text-center">ANOMALY</th>
              <th className="px-6 py-4 w-[28%]">COMPANY</th>
              <th className="px-6 py-4 w-[100px] text-center">RATING</th>
              <th className="px-6 py-4 w-[160px] text-center">CONTACT</th>
              <th className="px-6 py-4 w-[80px] text-center">LINK</th>
              <th className="px-6 py-4 w-[160px] text-center">STATUS</th>
              <th className="px-6 py-4 flex-1">SUMMARY</th>
              <th className="px-6 py-4 w-[100px] text-center">ACK</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {alerts.length === 0 ? (
              <tr>
                 <td colSpan={8} className="py-64 text-center">
                    <ShieldCheck className="w-16 h-16 mx-auto text-zinc-100 mb-6" />
                    <p className="text-[14px] font-black text-zinc-200 uppercase tracking-[0.6em]">System Integrity Optimal</p>
                 </td>
              </tr>
            ) : (
              [...alerts].reverse().map((alert) => (
                <tr key={alert.id} className={`group hover:bg-zinc-50 transition-all ${alert.isAcknowledged ? 'opacity-40 grayscale' : 'border-l-4 border-rose-500'}`}>
                  <td className="px-6 py-6 text-center">
                     <p className="text-[12px] font-black text-zinc-900">{alert.snoPair.split('&')[1].trim()}</p>
                     <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1">{alert.timeDiff}s DIFF</p>
                  </td>
                  <td className="px-6 py-6">
                     <div className="min-w-0">
                        <p className="text-[12px] font-black text-zinc-900 tracking-tight uppercase group-hover:text-rose-600 transition-colors truncate">{alert.company}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <User className="w-3 h-3 text-zinc-400" />
                           <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{alert.username}</span>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                     <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-black">
                       <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {alert.rating || '0.0'}
                     </div>
                  </td>
                  <td className="px-6 py-6 text-center font-mono text-[12px] text-zinc-500 group-hover:text-zinc-900 transition-colors">
                     {alert.phone}
                  </td>
                  <td className="px-6 py-6 text-center">
                     {renderAssetLink(alert.website)}
                  </td>
                  <td className="px-6 py-6 text-center">
                     <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                        {alert.status}
                     </span>
                  </td>
                  <td className="px-6 py-6">
                     <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 group-hover:bg-white transition-all shadow-inner">
                        <p className="text-[11px] font-medium text-zinc-600 leading-relaxed italic line-clamp-2">"{alert.summary || 'Log missing'}"</p>
                     </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                     {!alert.isAcknowledged ? (
                       <button 
                         onClick={() => onAcknowledgeAlert(alert.id)}
                         className="w-10 h-10 mx-auto rounded-xl bg-zinc-900 text-white flex items-center justify-center hover:bg-black transition-all shadow-lg active:scale-90"
                       >
                         <Check size={20} strokeWidth={3} />
                       </button>
                     ) : (
                       <ShieldCheck size={20} className="mx-auto text-emerald-500" />
                     )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer Info */}
      <div className="px-10 py-6 flex items-center gap-4 text-zinc-400 bg-zinc-50 shrink-0">
         <AlertTriangle className="w-4 h-4 text-rose-500" />
         <p className="text-[10px] font-black uppercase tracking-[0.3em]">
           Operational Integrity: Flags entries verified faster than {alertThreshold} seconds.
=======
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
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
         </p>
      </div>
    </div>
  );
};

export default AnomaliesView;
