
import React, { useMemo, useState } from 'react';
import { Lead, LeadStatus } from '../types';
<<<<<<< HEAD
import { Globe, Star, Filter, Clock, ChevronLeft, ChevronRight, Zap, MapPin, Mail, Check, Loader2 } from 'lucide-react';
import { generateAIIntel } from '../services/leadService';

interface TaskSummaryViewProps {
  leads: Lead[];
  onUpdateStatus: (leadId: string, newStatus: LeadStatus) => void;
  onUpdateNotes: (leadId: string, notes: string) => void;
  onUpdateField: (leadId: string, field: keyof Lead, value: string) => void;
  onFinalizeLead: (leadId: string, updatedLead?: Partial<Lead>) => void;
}

type TaskFilterMode = 'ALL' | 'BUSY' | 'FOLLOW_UP';
type TaskRatingSort = 'DEFAULT' | 'HI_TO_LOW' | 'LOW_TO_HI';

const TaskSummaryView: React.FC<TaskSummaryViewProps> = ({ leads, onUpdateStatus, onUpdateNotes, onUpdateField, onFinalizeLead }) => {
  const [filterMode, setFilterMode] = useState<TaskFilterMode>('ALL');
  const [ratingSort, setRatingSort] = useState<TaskRatingSort>('DEFAULT');
  const [showFilters, setShowFilters] = useState(true);
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
=======
// Added Zap to the imports from lucide-react
import { Globe, Star, Filter, Clock, AlertCircle, ChevronDown, UserCheck, Instagram, Navigation, Zap } from 'lucide-react';

interface TaskSummaryViewProps {
  leads: Lead[];
}

type TaskFilterMode = 'ALL' | 'BUSY' | 'FOLLOW_UP';

const TaskSummaryView: React.FC<TaskSummaryViewProps> = ({ leads }) => {
  const [filterMode, setFilterMode] = useState<TaskFilterMode>('ALL');
  const [showFilter, setShowFilter] = useState(false);
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c

  const filteredLeads = useMemo(() => {
    let baseLeads = leads.filter(l => l.Availability === LeadStatus.FOLLOW_UP || l.Availability === LeadStatus.BUSY);
    if (filterMode === 'BUSY') baseLeads = baseLeads.filter(l => l.Availability === LeadStatus.BUSY);
    else if (filterMode === 'FOLLOW_UP') baseLeads = baseLeads.filter(l => l.Availability === LeadStatus.FOLLOW_UP);
<<<<<<< HEAD
    
    if (ratingSort === 'HI_TO_LOW') {
      baseLeads.sort((a, b) => (parseFloat(String(b.Ratings)) || 0) - (parseFloat(String(a.Ratings)) || 0));
    } else if (ratingSort === 'LOW_TO_HI') {
      baseLeads.sort((a, b) => (parseFloat(String(a.Ratings)) || 0) - (parseFloat(String(b.Ratings)) || 0));
    } else {
      baseLeads.sort((a, b) => new Date(b.DateTime || b.lastUpdated || 0).getTime() - new Date(a.DateTime || a.lastUpdated || 0).getTime());
    }
    
    return baseLeads;
  }, [leads, filterMode, ratingSort]);

  const handleFinalize = async (id: string, updatedLead?: Partial<Lead>) => {
    if (submittingIds.has(id)) return;
    setSubmittingIds(prev => new Set(prev).add(id));
    try {
      await onFinalizeLead(id, updatedLead);
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
       <div className="px-10 pt-10 pb-6 flex flex-col md:flex-row items-end justify-between gap-6 shrink-0 border-b border-zinc-100 bg-white">
           <div className="space-y-1">
              <h3 className="text-5xl font-black text-zinc-900 uppercase tracking-tighter leading-none">Task Queue</h3>
              <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Priority Re-engagement Queue</span>
              </div>
           </div>
           
           <button 
             onClick={() => setShowFilters(!showFilters)}
             className={`flex items-center gap-3 px-8 py-4 rounded-xl border transition-all text-[11px] font-black uppercase tracking-widest shadow-xl ${showFilters ? 'bg-zinc-900 text-white border-transparent' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900'}`}
           >
             <Filter className="w-5 h-5" />
             OPERATIONAL CONFIGS
           </button>
       </div>

       {showFilters && (
         <div className="px-10 py-5 bg-zinc-50 border-b border-zinc-100 flex flex-wrap items-center gap-10 animate-in slide-in-from-top-1">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Queue Type:</span>
              <div className="flex gap-1.5 p-1 bg-white border border-zinc-200 rounded-lg">
                {(['ALL', 'FOLLOW_UP', 'BUSY'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterMode(f)}
                    className={`px-4 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all ${filterMode === f ? 'bg-amber-500 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-900'}`}
                  >
                    {f.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Rating Sort:</span>
              <div className="flex gap-1.5 p-1 bg-white border border-zinc-200 rounded-lg">
                {(['DEFAULT', 'HI_TO_LOW', 'LOW_TO_HI'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setRatingSort(s)}
                    className={`px-4 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all ${ratingSort === s ? 'bg-amber-500 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-900'}`}
                  >
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
         </div>
       )}

       <div className="flex-1 overflow-auto custom-scrollbar bg-white">
         <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
           <thead className="sticky top-0 z-30 bg-white shadow-sm">
             <tr className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] border-b border-zinc-100">
               <th className="px-6 py-4 w-[60px] text-center">SNO</th>
               <th className="px-6 py-4 w-[240px]">COMPANY</th>
               <th className="px-6 py-4 w-[90px] text-center">RATING</th>
               <th className="px-6 py-4 w-[120px] text-center">CONTACT</th>
               <th className="px-6 py-4 w-[120px] text-center">INSTA</th>
               <th className="px-6 py-4 w-[140px] text-center">GMAIL</th>
               <th className="px-6 py-4 w-[140px] text-center">LOC</th>
               <th className="px-6 py-4 w-[140px] text-center">STATUS</th>
               <th className="px-6 py-4 flex-1">SUMMARY</th>
               <th className="px-6 py-4 w-[70px] text-center">COMMIT</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-zinc-50">
             {filteredLeads.length === 0 ? (
               <tr>
                 <td colSpan={10} className="py-56 text-center">
                    <Zap className="w-20 h-20 mx-auto text-zinc-100 mb-6" />
                    <p className="text-[14px] font-black uppercase tracking-[0.6em] text-zinc-200">Re-engagement list clear</p>
                 </td>
               </tr>
             ) : (
               filteredLeads.map((lead, index) => (
                 <TaskRow 
                    key={lead.id} 
                    lead={lead} 
                    index={index + 1} 
                    onUpdateStatus={onUpdateStatus}
                    onUpdateNotes={onUpdateNotes}
                    onUpdateField={onUpdateField}
                    onFinalizeLead={handleFinalize}
                    isSubmitting={submittingIds.has(lead.id)}
                 />
               ))
             )}
           </tbody>
         </table>
       </div>

       <div className="px-10 py-6 border-t border-zinc-100 flex items-center justify-between bg-zinc-50 shrink-0">
          <div className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em]">
            ACTIVE OPS QUEUE: {filteredLeads.length} UNITS
          </div>
          <div className="flex items-center gap-6">
             <button className="p-2.5 rounded-lg border border-zinc-200 hover:border-zinc-400 transition-all opacity-20 cursor-not-allowed bg-white shadow-sm">
               <ChevronLeft size={18} className="text-zinc-600" />
             </button>
             <div className="flex items-center">
                <span className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-lg">1</span>
             </div>
             <button className="p-2.5 rounded-lg border border-zinc-200 hover:border-zinc-400 transition-all opacity-20 cursor-not-allowed bg-white shadow-sm">
               <ChevronRight size={18} className="text-zinc-600" />
             </button>
=======
    return baseLeads.sort((a, b) => new Date(b.DateTime || b.lastUpdated).getTime() - new Date(a.DateTime || a.lastUpdated).getTime());
  }, [leads, filterMode]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "---";
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(d);
  };

  const calculateSlaDeadline = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(new Date(dateStr).getTime() + (24 * 60 * 60 * 1000));
  };

  const isBreached = (deadline: Date | null) => deadline ? Date.now() > deadline.getTime() : false;

  return (
    <div className="space-y-6 pb-16 stagger-item">
       <div className="flex flex-col md:flex-row items-end justify-between gap-4 px-2">
           <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                 <div className="w-1 h-1 rounded-full bg-amber-400"></div>
                 <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-zinc-500">Service Level Control</p>
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Task Queue</h3>
              <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
                <Clock className="w-2.5 h-2.5" />
                <span>Re-engagement Stream</span>
              </div>
           </div>
           
           <div className="flex items-center gap-2 relative">
              <button 
                onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-2 bg-[#080808] border border-white/10 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${showFilter ? 'text-amber-400 border-amber-400/30' : 'text-zinc-500 hover:text-white'}`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filter
                <ChevronDown className={`w-3 h-3 transition-transform ${showFilter ? 'rotate-180' : ''}`} />
              </button>

              <div className="bg-amber-400/10 text-amber-400 border border-amber-400/20 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl">
                {filteredLeads.length} Tasks
              </div>
           </div>
       </div>

       {/* Task Queue Table - Compact View matching Dashboard */}
       <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#080808] shadow-2xl relative">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1300px] table-fixed">
              <thead className="sticky top-0 z-30 bg-[#050403]">
                <tr className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em] border-b border-white/10">
                  <th className="px-5 py-5 w-14 text-center">SNO</th>
                  <th className="px-5 py-5 w-[320px]">COMPANY</th>
                  <th className="px-5 py-5 w-24 text-center">RATING</th>
                  <th className="px-5 py-5 w-36 text-center">CONTACT</th>
                  <th className="px-5 py-5 w-20 text-center">LINK</th>
                  <th className="px-5 py-5 w-44 text-center">STATUS</th>
                  <th className="px-5 py-5 w-[250px]">SUMMARY</th>
                  <th className="px-5 py-5 w-56 text-center">ARCHIVED AT</th>
                  <th className="px-5 py-5 w-56 text-center">SLA DEADLINE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-48 text-center">
                       <Zap className="w-10 h-10 mx-auto text-zinc-900 mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/5">Queue Clear</p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead, index) => {
                    const deadline = calculateSlaDeadline(lead.DateTime || lead.lastUpdated);
                    const breached = isBreached(deadline);
                    const url = String(lead.Website || '').toLowerCase();
                    const finalUrl = lead.Website.startsWith('http') ? lead.Website : `https://${lead.Website}`;
                    
                    return (
                      <tr key={lead.id} className={`group/row hover:bg-white/[0.02] transition-colors border-l-2 border-transparent ${breached ? 'hover:border-rose-500/40' : 'hover:border-amber-400/40'}`}>
                        <td className="px-5 py-5 text-[10px] font-black text-white/40 text-center group-hover/row:text-white transition-colors">{index + 1}</td>
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                             <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center font-black text-[9px] text-white/30 group-hover/row:text-white">
                                {lead.Company?.charAt(0) || '?'}
                             </div>
                             <div className="min-w-0">
                                <p className="text-[12px] font-black text-white tracking-tight uppercase truncate group-hover/row:text-amber-400 transition-colors">{lead.Company}</p>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[7px] font-bold text-white/10 uppercase tracking-widest">
                                   <UserCheck className="w-2.5 h-2.5" /> Specialist: {lead.employeeOwner}
                                </div>
                             </div>
                          </div>
                        </td>
                        <td className="px-5 py-5 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-400/5 border border-amber-400/10 text-amber-400 text-[9px] font-black">
                             <Star className="w-2.5 h-2.5 fill-amber-400" /> {lead.Ratings || '0.0'}
                          </div>
                        </td>
                        <td className="px-5 py-5 text-center">
                           <p className="text-[11px] font-black font-mono text-white/30 tracking-tighter group-hover/row:text-white transition-colors">{lead.Number}</p>
                        </td>
                        <td className="px-5 py-5 text-center">
                           {lead.Website !== 'NONE' ? (
                             <a href={finalUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 mx-auto rounded-lg bg-[#0d0d0d] flex items-center justify-center text-white/30 hover:text-white border border-white/10 hover:border-amber-400/30 transition-all">
                               {url.includes('instagram.com') ? <Instagram className="w-3.5 h-3.5" /> : url.includes('maps.google') ? <Navigation className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                             </a>
                           ) : <span className="text-[8px] font-black text-zinc-900">---</span>}
                        </td>
                        <td className="px-5 py-5 text-center">
                          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${lead.Availability === LeadStatus.FOLLOW_UP ? 'text-amber-400' : 'text-zinc-500'}`}>
                            {lead.Availability}
                          </span>
                        </td>
                        <td className="px-5 py-5">
                          <div className="bg-[#0d0d0d] border border-white/5 rounded-lg px-3 py-2 group-hover/row:bg-black/50 transition-all">
                            <p className="text-[10px] italic font-medium text-white/60 leading-tight line-clamp-2">"{lead.Summary || 'No intel log found'}"</p>
                          </div>
                        </td>
                        <td className="px-5 py-5 text-center">
                           <div className="space-y-0.5">
                             <p className="text-[11px] font-black text-white/50 uppercase tracking-[0.1em] group-hover/row:text-white">{formatDate(lead.DateTime || lead.lastUpdated).split(',')[0]}</p>
                             <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">{formatDate(lead.DateTime || lead.lastUpdated).split(',')[1]}</p>
                           </div>
                        </td>
                        <td className="px-5 py-5">
                           <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${breached ? 'bg-rose-500/5 border-rose-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                              {breached ? <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> : <Clock className="w-3.5 h-3.5 text-emerald-500" />}
                              <div className="flex flex-col">
                                <p className={`text-[9px] font-black uppercase tracking-[0.1em] ${breached ? 'text-rose-500' : 'text-emerald-500'}`}>
                                  {formatDate(deadline?.toISOString()).split(',')[0]}
                                </p>
                                {breached && <p className="text-[7px] font-black text-rose-500/40 uppercase tracking-widest">BREACHED</p>}
                              </div>
                           </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
          </div>
       </div>
    </div>
  );
};

<<<<<<< HEAD
const TaskRow = ({ lead, index, onUpdateStatus, onUpdateNotes, onUpdateField, onFinalizeLead, isSubmitting }: any) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Enforce manual commit: Status must be selected (BOOKED or DECLINED usually to leave task queue) 
  // and summary must be present.
  const hasSummary = lead.Summary?.trim().length >= 3;
  const isFinalStatus = lead.Availability === LeadStatus.BOOKED || lead.Availability === LeadStatus.DECLINED;

  const handleAiGenerate = async () => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    try {
      const aiSummary = await generateAIIntel(lead.Company, lead.Type);
      onUpdateNotes(lead.id, aiSummary);
    } catch (err) { console.error("AI Insight Failure"); }
    finally { setIsAiLoading(false); }
  };

  const handleStatusChange = (newStatus: LeadStatus) => {
    onUpdateStatus(lead.id, newStatus);
    // REMOVED AUTOMATIC COMMIT. User MUST click the check button manually now.
  };

  return (
    <tr className="group hover:bg-zinc-50 transition-colors">
      <td className="px-6 py-4 text-[12px] font-black text-zinc-400 text-center group-hover:text-zinc-900 transition-colors">{index}</td>
      <td className="px-6 py-4">
        <div className="min-w-0">
          <p className="text-[14px] font-black text-zinc-900 truncate uppercase group-hover:text-amber-500 transition-colors leading-tight">{lead.Company}</p>
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate mt-0.5">{lead.employeeOwner}</p>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-black">
          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {lead.Ratings || '0.0'}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <p className="text-[11px] font-black font-mono text-zinc-500 group-hover:text-zinc-900 transition-colors truncate">{lead.Number}</p>
      </td>
      <td className="px-6 py-4">
        <input 
          type="text"
          placeholder="IG"
          className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-2 py-2 text-[9px] text-zinc-900 font-bold focus:outline-none focus:border-amber-500/30 transition-all"
          value={lead.Instagram || ''}
          onChange={e => onUpdateField(lead.id, 'Instagram', e.target.value)}
        />
      </td>
      <td className="px-6 py-4">
        <input 
          type="email"
          placeholder="GMAIL"
          className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-2 py-2 text-[9px] text-zinc-900 font-bold focus:outline-none focus:border-amber-500/30 transition-all"
          value={lead.Gmail || ''}
          onChange={e => onUpdateField(lead.id, 'Gmail', e.target.value)}
        />
      </td>
      <td className="px-6 py-4">
        <input 
          type="text"
          placeholder="LOC"
          className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-2 py-2 text-[9px] text-zinc-900 font-bold focus:outline-none focus:border-amber-500/30 transition-all"
          value={lead.Location || ''}
          onChange={e => onUpdateField(lead.id, 'Location', e.target.value)}
        />
      </td>
      <td className="px-6 py-4 text-center">
        <select 
          className={`w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2.5 px-3 text-[10px] font-black uppercase tracking-widest transition-all outline-none cursor-pointer focus:border-amber-500/30 ${lead.Availability === LeadStatus.BOOKED ? 'text-emerald-600' : lead.Availability === LeadStatus.DECLINED ? 'text-rose-600' : 'text-zinc-900'}`}
          value={lead.Availability}
          onChange={e => handleStatusChange(e.target.value as LeadStatus)}
          disabled={isSubmitting}
        >
          <option value={LeadStatus.FOLLOW_UP}>FOLLOW UP</option>
          <option value={LeadStatus.BUSY}>BUSY</option>
          <option value={LeadStatus.BOOKED}>BOOKED</option>
          <option value={LeadStatus.DECLINED}>DECLINED</option>
        </select>
      </td>
      <td className="px-6 py-4 relative">
        <div className="relative">
          <textarea 
            placeholder="ADD INTEL..."
            className="w-full bg-zinc-50 border border-zinc-100 rounded-lg pl-3 pr-10 py-2.5 text-[10px] text-zinc-900 placeholder:text-zinc-300 min-h-[44px] resize-none focus:outline-none focus:bg-white focus:border-amber-500/30 transition-all font-medium leading-relaxed"
            value={lead.Summary || ''}
            onChange={e => onUpdateNotes(lead.id, e.target.value)}
            disabled={isSubmitting}
          />
          <button onClick={handleAiGenerate} disabled={isAiLoading || isSubmitting} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-200 hover:text-amber-500 transition-colors disabled:opacity-30 p-1">
            {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-3 h-3" />}
          </button>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <button 
          onClick={() => onFinalizeLead(lead.id)}
          disabled={!hasSummary || isSubmitting}
          className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center border transition-all duration-400 ${hasSummary && !isSubmitting ? 'bg-amber-500 text-white border-transparent shadow-lg hover:scale-110 active:scale-95' : 'bg-zinc-50 text-zinc-100 border-zinc-100 cursor-not-allowed opacity-40'}`}
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check size={20} strokeWidth={4} />}
        </button>
      </td>
    </tr>
  );
};

=======
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
export default TaskSummaryView;
