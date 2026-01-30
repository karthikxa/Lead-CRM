
import React, { useState, useMemo, useEffect } from 'react';
import { Lead, LeadStatus } from '../types';
import { 
  ChevronLeft, ChevronRight,
<<<<<<< HEAD
  Check, Star,
  SearchCode,
  Instagram as InstaIcon, ShieldCheck, Zap, Loader2, Filter, Link2, Link2Off, Mail, MapPin
=======
  Check, Star, SlidersHorizontal, X,
  Globe, SearchCode,
  Instagram, Navigation, ShieldCheck, Zap, Sparkles, Loader2
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
} from 'lucide-react';
import { generateAIIntel } from '../services/leadService';

interface EmployeeDashboardProps {
  leads: Lead[];
  isLoading: boolean;
  onRefresh: () => void;
  onUpdateStatus: (leadId: string, newStatus: LeadStatus) => void;
  onUpdateNotes: (leadId: string, notes: string) => void;
<<<<<<< HEAD
  onUpdateField: (leadId: string, field: keyof Lead, value: string) => void;
  onFinalizeLead: (leadId: string) => void;
}

type LinkFilter = 'ALL' | 'WITH_LINK' | 'WITHOUT_LINK';
type RatingSort = 'DEFAULT' | 'HI_TO_LOW' | 'LOW_TO_HI';
=======
  onFinalizeLead: (leadId: string) => void;
}

type SortMode = 'NONE' | 'RATING_ASC' | 'RATING_DESC';
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ 
  leads, 
  onUpdateStatus, 
  onUpdateNotes,
<<<<<<< HEAD
  onUpdateField,
=======
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
  onFinalizeLead,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
<<<<<<< HEAD
  const [linkFilter, setLinkFilter] = useState<LinkFilter>('ALL');
  const [ratingSort, setRatingSort] = useState<RatingSort>('DEFAULT');
  const [showFilters, setShowFilters] = useState(true);
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
=======
  const [sortMode, setSortMode] = useState<SortMode>('NONE');
  const [showFilters, setShowFilters] = useState(false);
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
  
  const itemsPerPage = 25;

  const filteredAndSortedLeads = useMemo(() => {
    let result = [...leads].filter(lead => {
<<<<<<< HEAD
      const term = searchTerm.toLowerCase().trim();
      const searchPool = [lead.Company, lead.Number, lead.Type, lead.Website, lead.Sno, lead.Summary, lead.Instagram, lead.Gmail, lead.Location].join(' ').toLowerCase();
      
      const matchesSearch = !term || searchPool.includes(term);
      
      const hasLink = lead.Website && lead.Website !== 'NONE';
      const matchesLink = linkFilter === 'ALL' || (linkFilter === 'WITH_LINK' ? hasLink : !hasLink);

      return matchesSearch && matchesLink;
    });

    if (ratingSort === 'HI_TO_LOW') {
      result.sort((a, b) => (parseFloat(String(b.Ratings)) || 0) - (parseFloat(String(a.Ratings)) || 0));
    } else if (ratingSort === 'LOW_TO_HI') {
      result.sort((a, b) => (parseFloat(String(a.Ratings)) || 0) - (parseFloat(String(b.Ratings)) || 0));
    }

    return result;
  }, [leads, searchTerm, linkFilter, ratingSort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, linkFilter, ratingSort]);
=======
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
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedLeads.slice(start, start + itemsPerPage);
  }, [filteredAndSortedLeads, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedLeads.length / itemsPerPage);

<<<<<<< HEAD
  const handleFinalize = async (id: string) => {
    if (submittingIds.has(id)) return;
    setSubmittingIds(prev => new Set(prev).add(id));
    try {
      await onFinalizeLead(id);
    } finally {
      setSubmittingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500">
      <div className="px-10 pt-10 pb-6 border-b border-zinc-100 flex flex-col gap-6 bg-white shrink-0">
        <div className="flex flex-col xl:flex-row items-end justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-5xl font-black text-zinc-900 tracking-tighter leading-none uppercase">Dashboard</h2>
            <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>{filteredAndSortedLeads.length} Operational Units Ready</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full xl:w-auto">
            <div className="relative group flex-1 md:w-[400px]">
              <SearchCode className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${searchTerm ? 'text-[#eb7c52]' : 'text-zinc-300'}`} />
              <input 
                type="text" 
                placeholder="SEARCH ARCHIVE..." 
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-4 pl-14 pr-12 text-[12px] font-black text-zinc-900 focus:outline-none focus:border-[#eb7c52] transition-all placeholder:text-zinc-400"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-3 px-8 py-4 rounded-xl bg-zinc-900 text-white border-transparent transition-all text-[11px] font-black uppercase tracking-widest hover:bg-black active:scale-95 shrink-0 shadow-xl"
            >
              <Filter className="w-5 h-5" />
              DISPLAY OPTIONS
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-col md:flex-row items-center gap-8 pt-6 border-t border-zinc-100 animate-in slide-in-from-top-2 bg-white rounded-b-2xl">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Rating Sort:</span>
              <div className="flex gap-1.5 p-1 bg-zinc-50 border border-zinc-100 rounded-xl">
                {(['DEFAULT', 'HI_TO_LOW', 'LOW_TO_HI'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setRatingSort(s)}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${ratingSort === s ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'}`}
                  >
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Asset Filter:</span>
              <div className="flex gap-1.5 p-1 bg-zinc-50 border border-zinc-100 rounded-xl">
                {(['ALL', 'WITH_LINK', 'WITHOUT_LINK'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setLinkFilter(l)}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${linkFilter === l ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'}`}
                  >
                    {l === 'WITH_LINK' && <Link2 size={10} />}
                    {l === 'WITHOUT_LINK' && <Link2Off size={10} />}
                    {l.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar bg-white">
        <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
          <thead className="sticky top-0 z-30 bg-white shadow-sm">
            <tr className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] border-b border-zinc-100">
              <th className="px-6 py-4 w-[60px] text-center">SNO</th>
              <th className="px-6 py-4 w-[240px]">COMPANY</th>
              <th className="px-6 py-4 w-[100px] text-center">RATING</th>
              <th className="px-6 py-4 w-[140px] text-center">CONTACT</th>
              <th className="px-6 py-4 w-[120px] text-center">INSTA</th>
              <th className="px-6 py-4 w-[150px] text-center">GMAIL</th>
              <th className="px-6 py-4 w-[150px] text-center">LOCATION</th>
              <th className="px-6 py-4 w-[140px] text-center">STATUS</th>
              <th className="px-6 py-4 flex-1">SUMMARY</th>
              <th className="px-6 py-4 w-[80px] text-center">COMMIT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-48 text-center">
                  <Zap className="w-20 h-20 mx-auto text-zinc-100 mb-6" />
                  <p className="text-[14px] font-black uppercase tracking-[0.6em] text-zinc-200">No active signals found</p>
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
                  onUpdateField={onUpdateField}
                  onFinalizeLead={handleFinalize}
                  isSubmitting={submittingIds.has(lead.id)}
                  animationDelay={`${idx * 0.005}s`}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-10 py-6 border-t border-zinc-100 flex items-center justify-between bg-zinc-50 shrink-0">
         <div className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em]">
           {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedLeads.length)} OF {filteredAndSortedLeads.length} UNITS
         </div>
         <div className="flex items-center gap-6">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1} 
              className="p-2.5 rounded-lg border border-zinc-200 hover:border-zinc-400 transition-all disabled:opacity-20 bg-white shadow-sm"
            >
              <ChevronLeft size={18} className="text-zinc-600" />
            </button>
            <div className="flex items-center">
              <span className="w-9 h-9 rounded-lg bg-[#eb7c52] text-white flex items-center justify-center font-black text-xs shadow-lg">{currentPage}</span>
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage >= totalPages} 
              className="p-2.5 rounded-lg border border-zinc-200 hover:border-zinc-400 transition-all disabled:opacity-20 bg-white shadow-sm"
            >
              <ChevronRight size={18} className="text-zinc-600" />
            </button>
         </div>
=======
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
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
      </div>
    </div>
  );
};

<<<<<<< HEAD
const LeadRow = ({ index, lead, onUpdateStatus, onUpdateNotes, onUpdateField, onFinalizeLead, isSubmitting, animationDelay }: any) => {
=======
const LeadRow = ({ index, lead, onUpdateStatus, onUpdateNotes, onFinalizeLead, animationDelay }: any) => {
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
  const [isAiLoading, setIsAiLoading] = useState(false);
  const isActioned = lead.Availability !== LeadStatus.UNASSIGNED;
  const hasSummary = lead.Summary?.trim().length >= 3;

  const handleAiGenerate = async () => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    try {
      const aiSummary = await generateAIIntel(lead.Company, lead.Type);
      onUpdateNotes(lead.id, aiSummary);
<<<<<<< HEAD
    } catch (err) { console.error("AI Insight Failure"); }
    finally { setIsAiLoading(false); }
  };

  return (
    <tr className="group/row bg-white hover:bg-zinc-50 transition-all stagger-item" style={{ animationDelay }}>
      <td className="px-6 py-4 text-center text-zinc-400 font-black text-[12px] group-hover:text-zinc-900 transition-colors">{index}</td>
      <td className="px-6 py-4">
        <div className="min-w-0">
          <p className="text-[14px] font-black text-zinc-900 truncate uppercase leading-tight group-hover:text-[#eb7c52] transition-colors">{lead.Company}</p>
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate mt-0.5">{lead.Type || 'Consultant'}</p>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-black">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {lead.Ratings || '0.0'}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <p className="font-mono text-[12px] text-zinc-500 group-hover:text-zinc-900 transition-colors">{lead.Number}</p>
      </td>
      <td className="px-6 py-4">
        <div className="relative">
          <InstaIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-300" />
          <input 
            type="text"
            placeholder="IG ID"
            className="w-full bg-zinc-50 border border-zinc-100 rounded-lg pl-9 pr-3 py-2 text-[10px] text-zinc-900 font-bold focus:outline-none focus:border-[#eb7c52]/30 transition-all"
            value={lead.Instagram || ''}
            onChange={e => onUpdateField(lead.id, 'Instagram', e.target.value)}
          />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-300" />
          <input 
            type="email"
            placeholder="GMAIL"
            className="w-full bg-zinc-50 border border-zinc-100 rounded-lg pl-9 pr-3 py-2 text-[10px] text-zinc-900 font-bold focus:outline-none focus:border-[#eb7c52]/30 transition-all"
            value={lead.Gmail || ''}
            onChange={e => onUpdateField(lead.id, 'Gmail', e.target.value)}
          />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-300" />
          <input 
            type="text"
            placeholder="AREA"
            className="w-full bg-zinc-50 border border-zinc-100 rounded-lg pl-9 pr-3 py-2 text-[10px] text-zinc-900 font-bold focus:outline-none focus:border-[#eb7c52]/30 transition-all"
            value={lead.Location || ''}
            onChange={e => onUpdateField(lead.id, 'Location', e.target.value)}
          />
        </div>
      </td>
      <td className="px-6 py-4">
        <select 
          className={`w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2.5 px-3 text-[11px] font-black uppercase tracking-widest transition-all outline-none cursor-pointer focus:border-[#eb7c52]/30 ${lead.Availability === LeadStatus.UNASSIGNED ? 'text-zinc-400' : 'text-zinc-900 border-[#eb7c52]/30'}`}
          value={lead.Availability}
          onChange={e => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
        >
          <option value={LeadStatus.UNASSIGNED} className="text-zinc-300">DEFAULT</option>
          <option value={LeadStatus.BOOKED}>BOOKED</option>
          <option value={LeadStatus.DECLINED}>DECLINED</option>
          <option value={LeadStatus.FOLLOW_UP}>FOLLOW UP</option>
          <option value={LeadStatus.BUSY}>BUSY</option>
        </select>
      </td>
      <td className="px-6 py-4 relative group/intel">
        <div className="relative">
          <textarea 
            placeholder="TYPE.."
            className="w-full bg-zinc-50 border border-zinc-100 rounded-lg pl-3 pr-10 py-2.5 text-[11px] text-zinc-900 placeholder:text-zinc-300 min-h-[44px] resize-none focus:outline-none focus:bg-white focus:border-[#eb7c52]/30 transition-all font-medium leading-relaxed"
            value={lead.Summary || ''}
            onChange={e => onUpdateNotes(lead.id, e.target.value)}
          />
          <button onClick={handleAiGenerate} disabled={isAiLoading} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-200 hover:text-[#eb7c52] transition-colors disabled:opacity-30 p-1">
            {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-3 h-3" />}
          </button>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <button 
          onClick={() => onFinalizeLead(lead.id)}
          disabled={!isActioned || !hasSummary || isSubmitting}
          className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center border transition-all duration-400 ${isActioned && hasSummary && !isSubmitting ? 'bg-[#eb7c52] text-white border-transparent shadow-lg hover:scale-110 active:scale-95' : 'bg-zinc-50 text-zinc-100 border-zinc-100 cursor-not-allowed opacity-40'}`}
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check size={20} strokeWidth={4} />}
=======
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
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
        </button>
      </td>
    </tr>
  );
};

export default EmployeeDashboard;
