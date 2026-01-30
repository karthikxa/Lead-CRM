
import React from 'react';
import { SystemAlert } from '../types';
import { Zap, ShieldCheck, Check, Settings, AlertTriangle, User, Star, Globe, Navigation, Instagram } from 'lucide-react';

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
  const renderAssetLink = (website?: string) => {
    if (!website || website === 'NONE') return <span className="text-[11px] font-black text-zinc-200">---</span>;
    const url = website.toLowerCase();
    const finalUrl = website.startsWith('http') ? website : `https://${website}`;
    
    let Icon = Globe;
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
      </a>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-10 pt-10 pb-6 border-b border-zinc-100 flex flex-col xl:flex-row items-end justify-between gap-6 bg-white shrink-0">
        <div className="space-y-1">
          <h2 className="text-5xl font-black text-zinc-900 tracking-tighter leading-none uppercase">Fraud Detection</h2>
          <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
            <span>Active Anomaly Monitoring</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl flex items-center gap-6 shadow-sm">
            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Sensitivity Threshold</p>
              <p className="text-[11px] font-bold text-zinc-900 uppercase tracking-widest">{alertThreshold}s Buffer</p>
            </div>
            <div className="flex items-center gap-3">
               <input 
                type="number" 
                value={alertThreshold} 
                onChange={(e) => onUpdateThreshold(Number(e.target.value))}
                className="bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-900 text-[12px] font-black w-24 focus:border-rose-500 focus:outline-none transition-all text-center shadow-inner"
              />
              <Settings className="w-5 h-5 text-zinc-400" />
            </div>
          </div>
        </div>
      </div>

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
         </p>
      </div>
    </div>
  );
};

export default AnomaliesView;
