
import React, { useMemo, useState } from 'react';
import { Lead, LeadStatus } from '../types';
import {
  RefreshCw, Filter, Search,
  Star, Globe, ChevronLeft, ChevronRight, Zap, Instagram, Navigation, Database, Clock, Mail, MapPin, Shield,
  FileSpreadsheet, Download
} from 'lucide-react';

interface LeadAnalyticsProps {
  leads: Lead[];
  isLoading?: boolean;
  onRefresh?: () => void;
  title?: string;
  isAdmin?: boolean;
}

type AnalyticsFilter = 'ALL' | 'BOOKED' | 'DECLINED';
type AnalyticsRatingSort = 'DEFAULT' | 'HI_TO_LOW' | 'LOW_TO_HI';

const LeadAnalytics: React.FC<LeadAnalyticsProps> = ({ leads, isLoading, onRefresh, title, isAdmin }) => {
  const [filterMode, setFilterMode] = useState<AnalyticsFilter>('ALL');
  const [ratingSort, setRatingSort] = useState<AnalyticsRatingSort>('DEFAULT');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  const itemsPerPage = 25;

  const filteredAndSorted = useMemo(() => {
    let result = leads.filter(l => {
      const matchesMode = filterMode === 'ALL' || l.Availability === (filterMode === 'BOOKED' ? LeadStatus.BOOKED : LeadStatus.DECLINED);
      const term = searchTerm.toLowerCase().trim();
      const searchPool = [l.Company, l.Number, l.Summary, l.employeeOwner, l.Instagram, l.Gmail, l.Location].join(' ').toLowerCase();
      return matchesMode && (!term || searchPool.includes(term));
    });

    if (ratingSort === 'HI_TO_LOW') {
      result.sort((a, b) => (parseFloat(String(b.Ratings)) || 0) - (parseFloat(String(a.Ratings)) || 0));
    } else if (ratingSort === 'LOW_TO_HI') {
      result.sort((a, b) => (parseFloat(String(a.Ratings)) || 0) - (parseFloat(String(b.Ratings)) || 0));
    } else {
      result.sort((a, b) => new Date(b.DateTime || b.lastUpdated || 0).getTime() - new Date(a.DateTime || a.lastUpdated || 0).getTime());
    }

    return result;
  }, [leads, filterMode, searchTerm, ratingSort]);

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSorted.slice(start, start + itemsPerPage);
  }, [filteredAndSorted, currentPage]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);

  const handleExportCSV = () => {
    if (leads.length === 0) return;

    // Standard CSV headers
    const headers = ["S.No", "Company", "Rating", "Phone", "Instagram", "Gmail", "Location", "Status", "Summary", "Specialist", "Timestamp"];

    // Map leads to CSV rows, handling quotes for fields that might contain commas
    const rows = leads.map((l, i) => [
      i + 1,
      `"${(l.Company || "").replace(/"/g, '""')}"`,
      l.Ratings || "0.0",
      `"${l.Number || ""}"`,
      `"${l.Instagram || ""}"`,
      `"${l.Gmail || ""}"`,
      `"${(l.Location || "").replace(/"/g, '""')}"`,
      l.Availability,
      `"${(l.Summary || "").replace(/"/g, '""')}"`,
      l.employeeOwner,
      l.lastUpdated
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ZODZY_MASTER_EXPORT_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500">
      <div className="px-10 pt-10 pb-6 flex flex-col xl:flex-row items-end justify-between gap-6 shrink-0 border-b border-zinc-100">
        <div className="space-y-1">
          <h2 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase leading-none">
            {isAdmin ? "Master DB" : (title || "Analytics")}
          </h2>
          <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-2">
            {isAdmin ? <Shield className="w-4 h-4 text-emerald-500" /> : <Database className="w-4 h-4 text-[#eb7c52]" />}
            <span>{isAdmin ? "Consolidated Global Operations Data" : "Personal Operational Intelligence"}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full xl:w-auto">
          <div className="relative group flex-1 md:w-[300px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300" />
            <input
              type="text"
              placeholder={isAdmin ? "SEARCH DATABASE..." : "SEARCH ANALYTICS..."}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-4 pl-14 pr-12 text-[12px] font-black text-zinc-900 focus:outline-none focus:border-[#eb7c52] transition-all placeholder:text-zinc-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={handleExportCSV}
                className="bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 p-4 rounded-xl transition-all shadow-lg active:scale-90 flex items-center gap-3 px-6"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-widest">Export CSV</span>
              </button>
            )}

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="bg-zinc-900 hover:bg-black p-4 rounded-xl transition-all shadow-xl active:scale-90 flex items-center gap-3 px-6"
            >
              <RefreshCw className={`w-5 h-5 text-white ${isLoading ? 'animate-spin' : ''}`} />
              {isAdmin && <span className="text-[10px] font-black text-white uppercase tracking-widest">Sync Master</span>}
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="px-10 py-5 bg-zinc-50 border-b border-zinc-100 flex flex-wrap items-center gap-10 animate-in slide-in-from-top-1">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Status Filter:</span>
            <div className="flex gap-1.5 p-1 bg-white border border-zinc-200 rounded-xl">
              {(['ALL', 'BOOKED', 'DECLINED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterMode(f)}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterMode === f ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-900'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Rating Sort:</span>
            <div className="flex gap-1.5 p-1 bg-white border border-zinc-200 rounded-xl">
              {(['DEFAULT', 'HI_TO_LOW', 'LOW_TO_HI'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setRatingSort(s)}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${ratingSort === s ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-900'}`}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto custom-scrollbar bg-white">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 z-30 bg-white shadow-sm">
            <tr className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] border-b border-zinc-100">
              <th className="px-6 py-4 w-[60px] text-center">SNO</th>
              <th className="px-6 py-4 w-[18%]">COMPANY</th>
              <th className="px-6 py-4 w-[120px] text-center">CONTACT</th>
              <th className="px-6 py-4 w-[120px] text-center">SOCIAL</th>
              <th className="px-6 py-4 w-[120px] text-center">LOCATION</th>
              <th className="px-6 py-4 w-[120px] text-center">STATUS</th>
              <th className="px-6 py-4 flex-1">SUMMARY</th>
              <th className="px-6 py-4 w-[100px] text-center">DATE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-56 text-center">
                  <Zap className="w-20 h-20 mx-auto text-zinc-100 mb-6" />
                  <p className="text-[14px] font-black uppercase tracking-[0.6em] text-zinc-200">Database entries pending...</p>
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead, idx) => {
                const dateObj = lead.DateTime ? new Date(lead.DateTime) : lead.lastUpdated ? new Date(lead.lastUpdated) : null;
                return (
                  <tr key={lead.id} className="group hover:bg-zinc-50 transition-all">
                    <td className="px-6 py-4 text-center text-[12px] font-black text-zinc-400 group-hover:text-zinc-900 transition-colors">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="min-w-0">
                        <p className="font-black text-[12px] text-zinc-900 tracking-tight uppercase group-hover:text-[#eb7c52] truncate leading-tight transition-colors">{lead.Company}</p>
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest truncate mt-0.5">By: {lead.employeeOwner}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-[11px] text-zinc-500 group-hover:text-zinc-900 transition-colors">{lead.Number}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-center">
                        {lead.Instagram && <div className="flex items-center gap-1.5"><Instagram size={10} className="text-pink-500" /><span className="text-[9px] font-bold text-zinc-600">@{lead.Instagram}</span></div>}
                        {lead.Gmail && <div className="flex items-center gap-1.5"><Mail size={10} className="text-blue-500" /><span className="text-[9px] font-bold text-zinc-600 truncate max-w-[80px]">{lead.Gmail}</span></div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <MapPin size={10} className="text-rose-500" />
                        <span className="text-[9px] font-bold text-zinc-600 truncate max-w-[80px]">{lead.Location || '---'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border ${lead.Availability === LeadStatus.BOOKED ? 'text-emerald-600 border-emerald-100 bg-emerald-50' : 'text-zinc-500 border-zinc-100 bg-zinc-50'}`}>
                        {lead.Availability}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 group-hover:bg-white transition-all">
                        <p className="text-[11px] font-medium text-zinc-600 leading-relaxed italic line-clamp-2">"{lead.Summary || 'Intelligence summary unavailable.'}"</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col">
                        <p className="text-[11px] font-black text-zinc-900 tabular-nums">
                          {dateObj && !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString([], { day: '2-digit', month: 'short' }) : '---'}
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-10 py-6 border-t border-zinc-100 flex items-center justify-between bg-zinc-50 shrink-0">
        <div className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em]">
          TOTAL MASTER ENTRIES: {filteredAndSorted.length} UNITS
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2.5 rounded-lg border border-zinc-200 hover:border-zinc-400 transition-all disabled:opacity-20 bg-white shadow-sm">
            <ChevronLeft size={18} className="text-zinc-600" />
          </button>
          <div className="flex items-center">
            <span className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-black text-xs shadow-lg">{currentPage}</span>
          </div>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-2.5 rounded-lg border border-zinc-200 hover:border-zinc-400 transition-all disabled:opacity-20 bg-white shadow-sm">
            <ChevronRight size={18} className="text-zinc-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadAnalytics;
