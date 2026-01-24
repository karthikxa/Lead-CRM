
import React, { useState, useMemo, useEffect } from 'react';
import { Lead, LeadStatus } from '../types';
import { 
  ChevronLeft, ChevronRight,
  Check, Star, SlidersHorizontal, X,
  Globe, SearchCode,
  Instagram, Navigation, ShieldCheck, Zap, Sparkles, Loader2
} from 'lucide-react';
import { generateAIIntel } from '../services/leadService';

interface EmployeeDashboardProps {
  leads: Lead[];
  isLoading: boolean;
  onRefresh: () => void;
  onUpdateStatus: (leadId: string, newStatus: LeadStatus) => void;
  onUpdateNotes: (leadId: string, notes: string) => void;
  onFinalizeLead: (leadId: string) => void;
}

type SortMode = 'NONE' | 'RATING_ASC' | 'RATING_DESC';

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ 
  leads, 
  onUpdateStatus, 
  onUpdateNotes,
  onFinalizeLead,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortMode, setSortMode] = useState<SortMode>('NONE');
  const [showFilters, setShowFilters] = useState(false);
  
  const itemsPerPage = 25;

  const filteredAndSortedLeads = useMemo(() => {
    let result = [...leads].filter(lead => {
      const searchPool = [
        lead.Company,
        lead.Number,
        lead.Type,
        lead.Website,
        lead.Sno,
        lead.Summary
      ].join(' ').toLowerCase();

      const term = searchTerm.toLowerCase().trim();
      return !term || searchPool.includes(term);
    });

    if (sortMode === 'RATING_ASC') {
      result.sort((a, b) => (parseFloat(String(a.Ratings)) || 0) - (parseFloat(String(b.Ratings)) || 0));
    } else if (sortMode === 'RATING_DESC') {
      result.sort((a, b) => (parseFloat(String(b.Ratings)) || 0) - (parseFloat(String(a.Ratings)) || 0));
    }

    return result;
  }, [leads, searchTerm, sortMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortMode]);

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedLeads.slice(start, start + itemsPerPage);
  }, [filteredAndSortedLeads, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedLeads.length / itemsPerPage);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col xl:flex-row items-end justify-between gap-4 stagger-item" style={{ animationDelay: '0s' }}>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
             <div className="w-1 h-1 rounded-full bg-[#eb7c52]"></div>
             <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-zinc-500">Personnel Portal</p>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter leading-none uppercase">Active Queue</h2>
          <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
            <ShieldCheck className="w-2.5 h-2.5" />
            <span>Volume: {filteredAndSortedLeads.length}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          <div className="relative group w-full md:w-[320px]">
            <SearchCode className={`absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${searchTerm ? 'text-[#eb7c52]' : 'text-zinc-600'}`} />
            <input 
              type="text" 
              placeholder="Filter leads..." 
              className="w-full bg-[#080808] border border-white/10 rounded-xl py-3 pl-10 pr-10 text-[10px] font-bold text-white focus:outline-none focus:border-[#eb7c52]/40 transition-all placeholder:text-zinc-800"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-[#0a0a0a] text-zinc-500 hover:text-white text-[8px] font-black uppercase tracking-widest transition-all"
          >
            <SlidersHorizontal className="w-3 h-3" />
            Sort
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#080808] shadow-2xl relative stagger-item" style={{ animationDelay: '0.05s' }}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1300px] table-fixed">
            <thead className="sticky top-0 z-30 bg-[#050403]">
              <tr className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em] border-b border-white/10">
                <th className="px-5 py-5 w-14 text-center">SNO</th>
                <th className="px-5 py-5 w-[320px]">COMPANY</th>
                <th className="px-5 py-5 w-24 text-center">RATING</th>
                <th className="px-5 py-5 w-36 text-center">CONTACT</th>
                <th className="px-5 py-5 w-20 text-center">LINK</th>
                <th className="px-5 py-5 w-44 text-center">STATUS</th>
                <th className="px-5 py-5 w-[250px]">SUMMARY</th>
                <th className="px-5 py-5 w-24 text-center text-white">COMMIT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-48 text-center">
                    <Zap className="w-10 h-10 mx-auto text-zinc-900 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/5">Queue Depleted</p>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead, idx) => (
                  <LeadRow 
                    key={lead.id} 
                    index={(currentPage - 1) * itemsPerPage + idx + 1}
                    lead={lead} 
                    onUpdateStatus={onUpdateStatus} 
                    onUpdateNotes={onUpdateNotes} 
                    onFinalizeLead={onFinalizeLead}
                    animationDelay={`${idx * 0.02}s`}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-[#0a0a0a]">
           <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">
             {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedLeads.length)} / {filteredAndSortedLeads.length}
           </div>
           <div className="flex items-center gap-4">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-full border border-white/10 hover:border-white/30 transition-all disabled:opacity-0">
                <ChevronLeft size={12} className="text-white/60" />
              </button>
              <div className="flex flex-col items-center min-w-[60px]">
                 <span className="text-base font-black text-white">{currentPage}</span>
                 <span className="text-[7px] font-black text-zinc-800 uppercase tracking-widest">Cycle</span>
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-2 rounded-full border border-white/10 hover:border-white/30 transition-all disabled:opacity-0">
                <ChevronRight size={12} className="text-white/60" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const LeadRow = ({ index, lead, onUpdateStatus, onUpdateNotes, onFinalizeLead, animationDelay }: any) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const isActioned = lead.Availability !== LeadStatus.UNASSIGNED;
  const hasSummary = lead.Summary?.trim().length >= 3;

  const handleAiGenerate = async () => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    try {
      const aiSummary = await generateAIIntel(lead.Company, lead.Type);
      onUpdateNotes(lead.id, aiSummary);
    } catch (err) {
      console.error("AI Intel generation failed");
    } finally {
      setIsAiLoading(false);
    }
  };

  const renderAssetLink = () => {
    const url = String(lead.Website || '').toLowerCase();
    if (!lead.Website || lead.Website === 'NONE') return <span className="text-[8px] font-black text-zinc-900">---</span>;
    const finalUrl = lead.Website.startsWith('http') ? lead.Website : `https://${lead.Website}`;
    let Icon = Globe;
    let iconColor = "text-white/40 group-hover/row:text-[#eb7c52]";
    if (url.includes('instagram.com')) { Icon = Instagram; iconColor = "text-rose-500/70 group-hover/row:text-rose-500"; }
    else if (url.includes('maps.google') || url.includes('google.com/maps')) { Icon = Navigation; iconColor = "text-emerald-500/70 group-hover/row:text-emerald-500"; }
    return (
      <a href={finalUrl} target="_blank" rel="noopener noreferrer" className={`w-8 h-8 mx-auto rounded-lg border border-white/10 bg-[#0d0d0d] flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg ${iconColor}`}>
        <Icon className="w-3.5 h-3.5" />
      </a>
    );
  };

  return (
    <tr className="group/row hover:bg-white/[0.03] transition-all stagger-item" style={{ animationDelay }}>
      <td className="px-5 py-5 text-center text-white/50 font-black text-[10px] group-hover/row:text-white transition-colors">
        {index}
      </td>
      <td className="px-5 py-5">
        <div className="flex items-center gap-3">
           <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center font-black text-[9px] text-white/30 group-hover/row:text-white transition-all">
             {lead.Company?.charAt(0) || '?'}
           </div>
           <div className="min-w-0">
             <p className="text-[12px] font-black text-white tracking-tight group-hover/row:text-[#eb7c52] transition-colors truncate uppercase">{lead.Company}</p>
             <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[7px] font-black text-white/10 uppercase tracking-widest">{lead.Type || 'Unit'}</span>
             </div>
           </div>
        </div>
      </td>
      <td className="px-5 py-5 text-center">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#fbbf24]/5 border border-[#fbbf24]/10 text-[#fbbf24] text-[9px] font-black">
          <Star className="w-2.5 h-2.5 fill-[#fbbf24]" /> {lead.Ratings || '0.0'}
        </div>
      </td>
      <td className="px-5 py-5 text-center">
        <p className="font-mono text-[11px] text-white/40 group-hover/row:text-white transition-colors">{lead.Number}</p>
      </td>
      <td className="px-5 py-5 text-center">
        {renderAssetLink()}
      </td>
      <td className="px-5 py-5">
        <div className="relative">
          <select 
            className={`w-full status-select rounded-lg py-2 px-3 transition-all ${isActioned ? 'text-white border-[#eb7c52]/50' : 'text-white/40 border-white/10'}`}
            value={lead.Availability}
            onChange={e => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
          >
            <option value={LeadStatus.UNASSIGNED}>DEFAULT</option>
            <option value={LeadStatus.BOOKED}>BOOKED</option>
            <option value={LeadStatus.DECLINED}>DECLINED</option>
            <option value={LeadStatus.FOLLOW_UP}>FOLLOW UP</option>
            <option value={LeadStatus.BUSY}>BUSY</option>
          </select>
        </div>
      </td>
      <td className="px-5 py-5 relative group/intel">
        <textarea 
          placeholder="Intel..."
          className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg pl-3 pr-10 py-2 text-[10px] text-white placeholder:text-zinc-800 min-h-[40px] resize-none focus:outline-none focus:border-[#eb7c52]/30 transition-all font-medium leading-tight group-hover/row:bg-black/50"
          value={lead.Summary || ''}
          onChange={e => onUpdateNotes(lead.id, e.target.value)}
        />
        <button 
          onClick={handleAiGenerate}
          disabled={isAiLoading}
          title="Auto-generate Autonomous Intel"
          className="absolute right-7 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-[#eb7c52] transition-colors disabled:opacity-30 p-1"
        >
          {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        </button>
      </td>
      <td className="px-5 py-5 text-center">
        <button 
          onClick={() => onFinalizeLead(lead.id)}
          disabled={!isActioned || !hasSummary}
          className={`w-9 h-9 mx-auto rounded-lg flex items-center justify-center border transition-all duration-400 ${isActioned && hasSummary ? 'bg-[#eb7c52] text-white border-transparent shadow-[0_8px_16px_rgba(235,124,82,0.4)] hover:scale-105' : 'bg-white/[0.02] text-white/10 border-white/10 cursor-not-allowed'}`}
        >
          <Check size={14} />
        </button>
      </td>
    </tr>
  );
};

export default EmployeeDashboard;
