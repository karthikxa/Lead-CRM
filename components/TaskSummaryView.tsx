
import React, { useMemo, useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { Globe, Star, Filter, Clock, ChevronLeft, ChevronRight, Zap, MapPin, Mail, Check, Loader2, Instagram, Navigation } from 'lucide-react';
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

  const filteredLeads = useMemo(() => {
    let baseLeads = leads.filter(l => l.Availability === LeadStatus.FOLLOW_UP || l.Availability === LeadStatus.BUSY);
    if (filterMode === 'BUSY') baseLeads = baseLeads.filter(l => l.Availability === LeadStatus.BUSY);
    else if (filterMode === 'FOLLOW_UP') baseLeads = baseLeads.filter(l => l.Availability === LeadStatus.FOLLOW_UP);

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
        </div>
      </div>
    </div>
  );
};

const TaskRow = ({ lead, index, onUpdateStatus, onUpdateNotes, onUpdateField, onFinalizeLead, isSubmitting }: any) => {
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Enforce manual commit: Status must be selected (BOOKED or DECLINED usually to leave task queue) 
  // and summary must be present.
  const hasSummary = lead.Summary?.trim().length >= 3;

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

export default TaskSummaryView;
