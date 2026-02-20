"use client";

import { useState, useEffect, useMemo } from "react";
import { authenticatedFetch } from "@/lib/utils";

export default function AdminVisitorRecords() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Advanced Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedTimeframe, setSelectedTimeframe] = useState("all"); 
  const [fromMonth, setFromMonth] = useState(1);
  const [toMonth, setToMonth] = useState(new Date().getMonth() + 1);

  const months = [
    { val: 1, name: "Jan" }, { val: 2, name: "Feb" }, { val: 3, name: "Mar" },
    { val: 4, name: "Apr" }, { val: 5, name: "May" }, { val: 6, name: "Jun" },
    { val: 7, name: "Jul" }, { val: 8, name: "Aug" }, { val: 9, name: "Sep" },
    { val: 10, name: "Oct" }, { val: 11, name: "Nov" }, { val: 12, name: "Dec" }
  ];

  const fetchVisitors = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch("/api/security/visitor-passes?status=All");
      const result = await response.json();
      if (result.success) {
        setVisitors(result.visitors);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const filteredVisitors = useMemo(() => {
    return visitors.filter((v: any) => {
      const vDate = new Date(v.date);
      const now = new Date();
      const searchStr = searchQuery.toLowerCase();
      
      // 1. Search (Name, Source, To Meet, Items)
      if (searchQuery && !(
          v.visitorName.toLowerCase().includes(searchStr) ||
          v.fromWhere.toLowerCase().includes(searchStr) ||
          v.toMeet.toLowerCase().includes(searchStr) ||
          (v.itemsCarried || "").toLowerCase().includes(searchStr) ||
          (v.purpose || "").toLowerCase().includes(searchStr)
      )) return false;

      // 2. Year Filter
      if (vDate.getFullYear() !== selectedYear) return false;

      // 3. Status Filter
      if (selectedStatus !== "All" && v.status !== selectedStatus) return false;

      // 4. Timeframe / Month Range
      if (selectedTimeframe === "month_range") {
        const m = vDate.getMonth() + 1;
        if (m < fromMonth || m > toMonth) return false;
      } else if (selectedTimeframe === "today") {
          const today = new Date();
          if (vDate.toDateString() !== today.toDateString()) return false;
      }

      return true;
    });
  }, [visitors, searchQuery, selectedYear, selectedStatus, selectedTimeframe, fromMonth, toMonth]);

  return (
    <div className="flex flex-col h-full animate-fadeIn w-full mx-auto text-slate-900 pb-10">
      
      {/* ADVANCED FILTER BAR */}
      <div className="bg-slate-900 px-6 py-6 rounded-t-3xl shadow-2xl border-b border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2 space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Search Directory</label>
                <input 
                    type="text" 
                    placeholder="Search name, place, person or items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 border-none rounded-xl text-[11px] font-bold text-white px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none placeholder:text-slate-600 transition-all"
                />
            </div>

            <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Filter by Status</label>
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl text-[11px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer">
                    <option value="All">All Visitors</option>
                    <option value="In">Still Inside</option>
                    <option value="Out">Departed</option>
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Timeframe</label>
                <select value={selectedTimeframe} onChange={(e) => setSelectedTimeframe(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl text-[11px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer">
                    <option value="all">All Time</option>
                    <option value="today">Today Only</option>
                    <option value="month_range">Month Range</option>
                </select>
            </div>

            {selectedTimeframe === "month_range" ? (
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Range</label>
                    <div className="flex items-center bg-slate-800 rounded-xl px-2">
                        <select value={fromMonth} onChange={(e) => setFromMonth(parseInt(e.target.value))} className="bg-transparent border-none text-[10px] font-black text-white py-2 outline-none w-full">
                            {months.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                        </select>
                        <span className="text-slate-600 font-bold mx-1">-</span>
                        <select value={toMonth} onChange={(e) => setToMonth(parseInt(e.target.value))} className="bg-transparent border-none text-[10px] font-black text-white py-2 outline-none w-full">
                            {months.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                        </select>
                    </div>
                </div>
            ) : (
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Year</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full bg-slate-800 border-none rounded-xl text-[11px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer text-center">
                        {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            )}

            <div className="flex items-end">
                <button onClick={fetchVisitors} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    Refresh
                </button>
            </div>
        </div>
      </div>

      {/* DATA SHEET AREA */}
      <div className="flex-grow bg-white border-x border-b border-slate-200 rounded-b-3xl overflow-hidden flex flex-col min-h-[600px] shadow-2xl">
        <div className="flex-grow overflow-auto custom-scrollbar">
          <table className="w-full border-collapse uppercase">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 text-slate-500 border-b border-slate-200">
                <th className="py-4 text-[10px] font-black text-center w-12">#</th>
                <th className="py-4 text-[10px] font-black text-left px-4 w-44">In/Out Timestamps</th>
                <th className="py-4 text-[10px] font-black text-left px-4 w-56">Visitor Identity</th>
                <th className="py-4 text-[10px] font-black text-left px-4 w-40">Source Location</th>
                <th className="py-4 text-[10px] font-black text-left px-4 w-40">Contact Person</th>
                <th className="py-4 text-[10px] font-black text-left px-4 w-56">Material & Purpose</th>
                <th className="py-4 text-[10px] font-black text-center w-24">Live Status</th>
              </tr>
            </thead>
            <tbody className="bg-white text-slate-900">
              {isLoading ? (
                  <tr><td colSpan={7} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest text-xs animate-pulse">Scanning Corporate Visitor Vault...</td></tr>
              ) : filteredVisitors.length > 0 ? (
                filteredVisitors.map((v: any, index: number) => (
                  <tr key={v.id} className="hover:bg-blue-50/30 transition-colors border-b border-slate-50 group">
                      <td className="text-center text-[10px] font-bold text-slate-300 group-hover:text-blue-400">{index + 1}</td>
                      <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span className="text-[10px] font-black text-slate-900">IN: {new Date(v.inTime).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'})}</span>
                              </div>
                              {v.outTime ? (
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                    <span className="text-[10px] font-black text-orange-600">OUT: {new Date(v.outTime).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'})}</span>
                                </div>
                              ) : (
                                <span className="text-[8px] font-black text-blue-500 ml-3.5 animate-pulse italic">STILL ON PREMISE</span>
                              )}
                              <span className="text-[8px] font-bold text-slate-400 ml-3.5">{new Date(v.date).toLocaleDateString('en-GB')}</span>
                          </div>
                      </td>
                      <td className="px-4 py-4">
                          <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-800 tracking-tight">{v.visitorName}</span>
                              <span className="text-[9px] font-bold text-slate-400 mt-0.5">{v.visitorIdNumber || "NO ID RECORDED"}</span>
                              <span className="text-[9px] font-bold text-blue-600">{v.contactNumber || "NO CONTACT"}</span>
                          </div>
                      </td>
                      <td className="px-4 py-4">
                          <span className="text-[10px] font-black text-slate-600">{v.fromWhere}</span>
                      </td>
                      <td className="px-4 py-4">
                          <div className="flex flex-col">
                              <span className="text-[10px] font-black text-blue-600 underline underline-offset-2 decoration-blue-100">{v.toMeet}</span>
                              <span className="text-[8px] font-bold text-slate-400 mt-1">SECURED BY: {v.securityOfficer}</span>
                          </div>
                      </td>
                      <td className="px-4 py-4">
                          <div className="flex flex-col max-w-[220px]">
                              <span className="text-[10px] font-black text-slate-700 leading-tight">{v.purpose}</span>
                              <span className="text-[9px] font-medium text-slate-400 normal-case italic mt-1 border-l-2 border-slate-200 pl-2 line-clamp-2">
                                  {v.itemsCarried || "NO MATERIALS"}
                              </span>
                          </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                          <span className={`text-[8px] font-black px-3 py-1.5 rounded-full border shadow-sm tracking-widest ${v.status === 'In' ? 'bg-blue-50 text-blue-600 border-blue-100 ring-2 ring-blue-500/10' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                              {v.status === 'In' ? 'PRESENT' : 'DEPARTED'}
                          </span>
                      </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest text-xs">No visitor intelligence records found matching criteria</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* SUMMARY FOOTER */}
        <div className="bg-slate-900 px-10 py-5 flex justify-between items-center text-white border-t border-slate-800">
            <div className="flex gap-12">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Visitor Count</span>
                    <span className="text-sm font-black tracking-tight text-white">{filteredVisitors.length} Total</span>
                </div>
                <div className="w-px h-10 bg-slate-800"></div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Presence</span>
                    <span className="text-sm font-black tracking-tight text-blue-400">
                        {filteredVisitors.filter(v => v.status === 'In').length} Inside
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 px-6 py-2 rounded-full border border-white/10">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Live Security Feed Synchronized</span>
            </div>
        </div>
      </div>
    </div>
  );
}
