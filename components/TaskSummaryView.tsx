
import React, { useMemo, useState } from 'react';
import { Lead, LeadStatus } from '../types';
// Added Zap to the imports from lucide-react
import { Globe, Star, Filter, Clock, AlertCircle, ChevronDown, UserCheck, Instagram, Navigation, Zap } from 'lucide-react';

interface TaskSummaryViewProps {
  leads: Lead[];
}

type TaskFilterMode = 'ALL' | 'BUSY' | 'FOLLOW_UP';

const TaskSummaryView: React.FC<TaskSummaryViewProps> = ({ leads }) => {
  const [filterMode, setFilterMode] = useState<TaskFilterMode>('ALL');
  const [showFilter, setShowFilter] = useState(false);

  const filteredLeads = useMemo(() => {
    let baseLeads = leads.filter(l => l.Availability === LeadStatus.FOLLOW_UP || l.Availability === LeadStatus.BUSY);
    if (filterMode === 'BUSY') baseLeads = baseLeads.filter(l => l.Availability === LeadStatus.BUSY);
    else if (filterMode === 'FOLLOW_UP') baseLeads = baseLeads.filter(l => l.Availability === LeadStatus.FOLLOW_UP);
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
          </div>
       </div>
    </div>
  );
};

export default TaskSummaryView;
