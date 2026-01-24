
import React, { useMemo, useState } from 'react';
import { Lead, LeadStatus, IntelligenceMetrics } from '../types';
import { 
  Database, RefreshCw, Filter, Loader2, Search, 
  TrendingUp, Target, Star, UserCheck, Globe, Navigation, Instagram, ChevronDown
} from 'lucide-react';

interface LeadAnalyticsProps {
  leads: Lead[];
  isLoading?: boolean;
  onRefresh?: () => void;
  title?: string;
  isAdmin?: boolean;
}

const LeadAnalytics: React.FC<LeadAnalyticsProps> = ({ leads, isLoading, onRefresh, title = "Yield Archive", isAdmin = false }) => {
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const filteredAndSorted = useMemo(() => {
    return leads.filter(l => {
      const matchesStatus = filterStatus === 'ALL' || l.Availability === filterStatus;
      const term = searchTerm.toLowerCase().trim();
      const searchPool = [l.Company, l.Number, l.Summary, l.employeeOwner].join(' ').toLowerCase();
      return matchesStatus && (!term || searchPool.includes(term));
    }).sort((a, b) => new Date(b.DateTime || b.lastUpdated || 0).getTime() - new Date(a.DateTime || a.lastUpdated || 0).getTime());
  }, [leads, filterStatus, searchTerm]);

  return (
    <div className="space-y-12 pb-40 stagger-item">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-10 px-2">
        <div className="space-y-4">
           <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-[#eb7c52] rounded-full"></div>
              <div>
                 <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">{title}</h2>
              </div>
           </div>
        </div>
        
        <button 
          onClick={onRefresh} 
          disabled={isLoading}
          className="bg-[#0a0a0a] border border-white/10 px-10 py-5 rounded-2xl text-white/70 hover:text-white transition-all shadow-xl flex items-center gap-4"
        >
          <span className="text-[11px] font-black uppercase tracking-[0.2em]">Sync Archive</span>
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-[#eb7c52]' : ''}`} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 px-2">
         <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700 group-focus-within:text-[#eb7c52] transition-colors" />
            <input 
              type="text" 
              placeholder="Search across archived intelligence..."
              className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-5 pl-16 pr-8 text-sm font-bold text-white focus:outline-none focus:border-[#eb7c52]/40 transition-all shadow-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <button 
           onClick={() => setShowFilterDropdown(!showFilterDropdown)}
           className={`h-full px-8 py-5 rounded-2xl border flex items-center gap-4 text-[11px] font-black uppercase tracking-widest transition-all ${filterStatus !== 'ALL' ? 'bg-[#eb7c52] text-white border-transparent' : 'bg-[#0a0a0a] text-white/50 border-white/10'}`}
         >
           <Filter className="w-4 h-4" />
           {filterStatus === 'ALL' ? 'Status' : filterStatus}
           <ChevronDown className="w-3.5 h-3.5" />
         </button>
      </div>

      <div className="bg-[#0d0b09] rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1500px] table-fixed">
            <thead className="sticky top-0 z-30 bg-[#0d0b09]">
              <tr className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] border-b border-white/5">
                <th className="px-8 py-8 w-20 text-center">SNO</th>
                <th className="px-8 py-8 w-[400px]">COMPANY</th>
                <th className="px-8 py-8 w-32 text-center">RATING</th>
                <th className="px-8 py-8 w-48 text-center">CONTACT</th>
                <th className="px-8 py-8 w-24 text-center">LINK</th>
                <th className="px-8 py-8 w-44 text-center">STATUS</th>
                <th className="px-8 py-8 w-[250px]">SUMMARY</th>
                <th className="px-8 py-8 w-56 text-center">COMMIT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-72 text-center text-zinc-800 font-black uppercase tracking-[0.5em] text-xl">Archive Empty</td>
                </tr>
              ) : (
                filteredAndSorted.map((lead, idx) => (
                  <tr key={lead.id || idx} className="group hover:bg-white/[0.02] transition-all border-l-4 border-transparent hover:border-[#eb7c52]/30">
                    <td className="px-8 py-10 text-center text-[12px] font-black text-white/40 group-hover:text-white transition-colors">{idx + 1}</td>
                    <td className="px-8 py-10">
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center font-black text-white/40 group-hover:text-white transition-colors shadow-inner">
                          {lead.Company?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-black text-lg text-white tracking-tight leading-none uppercase group-hover:text-[#eb7c52] transition-colors">{lead.Company}</p>
                          <div className="flex items-center gap-2 mt-2 text-[9px] font-black text-white/20 uppercase tracking-widest">
                             Specialist: {lead.employeeOwner || 'SYSTEM'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-10 text-center">
                       <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#fbbf24]/20 bg-[#fbbf24]/5 text-[#fbbf24] text-[11px] font-black">
                         <Star className="w-3.5 h-3.5 fill-[#fbbf24]" /> {lead.Ratings || '0.0'}
                       </span>
                    </td>
                    <td className="px-8 py-10 text-center font-mono text-[14px] text-white/50 group-hover:text-white transition-colors">{lead.Number}</td>
                    <td className="px-8 py-10 text-center">
                       {lead.Website && lead.Website !== 'NONE' ? (
                         <a href={lead.Website.startsWith('http') ? lead.Website : `https://${lead.Website}`} target="_blank" className="w-10 h-10 mx-auto rounded-xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center text-white/50 hover:text-white transition-all shadow-xl">
                           <Globe className="w-5 h-5" />
                         </a>
                       ) : <span className="text-[9px] font-black text-zinc-900">---</span>}
                    </td>
                    <td className="px-8 py-10 text-center">
                      <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${lead.Availability === LeadStatus.BOOKED ? 'text-emerald-500' : 'text-zinc-600'}`}>
                        {lead.Availability}
                      </span>
                    </td>
                    <td className="px-8 py-10">
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 group-hover:bg-black/30 transition-all shadow-inner">
                        <p className="text-[12px] font-medium text-white/80 leading-relaxed italic truncate">"{lead.Summary || 'No log.'}"</p>
                      </div>
                    </td>
                    <td className="px-8 py-10 text-center">
                       <div className="space-y-1">
                          <p className="text-[12px] font-black text-white group-hover:text-[#eb7c52] transition-colors uppercase tracking-widest">{new Date(lead.DateTime || lead.lastUpdated).toLocaleDateString([], { day: '2-digit', month: 'short' })}</p>
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{new Date(lead.DateTime || lead.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeadAnalytics;
