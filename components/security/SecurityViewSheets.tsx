"use client";

import { useState, useEffect, useMemo } from "react";
import { authenticatedFetch } from "@/lib/utils";
import GatePassPrint from "./GatePassPrint";

export default function SecurityViewSheets() {
  const [passes, setPasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPassForPrint, setSelectedPassForPrint] = useState<any>(null);

  // Filters (Mimicking ViewSheets.tsx)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTimeframe, setSelectedTimeframe] = useState("all"); 
  const [fromMonth, setFromMonth] = useState(1);
  const [toMonth, setToMonth] = useState(new Date().getMonth() + 1);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const months = [
    { val: 1, name: "Jan" }, { val: 2, name: "Feb" }, { val: 3, name: "Mar" },
    { val: 4, name: "Apr" }, { val: 5, name: "May" }, { val: 6, name: "Jun" },
    { val: 7, name: "Jul" }, { val: 8, name: "Aug" }, { val: 9, name: "Sep" },
    { val: 10, name: "Oct" }, { val: 11, name: "Nov" }, { val: 12, name: "Dec" }
  ];

  const fetchPasses = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch("/api/operation/gate-passes/all");
      const result = await response.json();
      if (result.success) {
        setPasses(result.passes);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  const filteredData = useMemo(() => {
    return passes.filter((p: any) => {
      const pDate = new Date(p.createdAt);
      const now = new Date();
      
      // 1. Search (Number, Name, Purpose)
      const searchStr = searchQuery.toLowerCase();
      if (searchQuery && !(
          p.passNumber.toLowerCase().includes(searchStr) || 
          (p.employeeName || p.subject || "").toLowerCase().includes(searchStr) ||
          (p.purpose || "").toLowerCase().includes(searchStr) ||
          (p.toPlace || p.whereToGo || "").toLowerCase().includes(searchStr)
      )) return false;

      // 2. Year Filter
      if (pDate.getFullYear() !== selectedYear) return false;

      // 3. Timeframe Filter
      let matchTime = true;
      if (selectedTimeframe === "1h") {
        matchTime = (now.getTime() - pDate.getTime()) <= (60 * 60 * 1000);
      } else if (selectedTimeframe === "1d") {
        matchTime = (now.getTime() - pDate.getTime()) <= (24 * 60 * 60 * 1000);
      } else if (selectedTimeframe === "15d") {
        matchTime = (now.getTime() - pDate.getTime()) <= (15 * 24 * 60 * 60 * 1000);
      } else if (selectedTimeframe === "month_range") {
        const m = pDate.getMonth() + 1;
        matchTime = m >= fromMonth && m <= toMonth;
      } else if (selectedTimeframe === "1m") {
        const oneMonthAgo = new Date(); oneMonthAgo.setMonth(now.getMonth() - 1);
        matchTime = pDate >= oneMonthAgo;
      }

      // 4. Type & Status Filters
      const matchType = selectedType === "All" || p.type === selectedType;
      const matchStatus = selectedStatus === "All" || p.status === selectedStatus;

      return matchTime && matchType && matchStatus;
    });
  }, [passes, selectedYear, selectedTimeframe, fromMonth, toMonth, selectedType, selectedStatus, searchQuery]);

  return (
    <div className="flex flex-col animate-fadeIn w-full mx-auto text-slate-900 pb-10">
      
      {/* PROFESSIONAL COMPACT FILTER BAR (Mimics ViewSheets) */}
      <div className="bg-slate-900 px-4 py-3 rounded-t-3xl flex items-center justify-between gap-2 shadow-2xl border-b border-slate-800 flex-nowrap overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2 shrink-0 border-r border-slate-800 pr-2 mr-2">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            <h2 className="text-[10px] font-black uppercase tracking-tighter text-white leading-none">Security Ledger</h2>
        </div>

        <div className="flex items-center gap-2 flex-grow min-w-0">
            <div className="shrink-0">
                <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-slate-800 border-none rounded-lg text-[9px] font-black uppercase text-white px-2 py-1.5 focus:ring-1 focus:ring-blue-600 outline-none cursor-pointer w-16">
                    {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div className="shrink-0">
                <select value={selectedTimeframe} onChange={(e) => setSelectedTimeframe(e.target.value)} className="bg-slate-800 border-none rounded-lg text-[9px] font-black uppercase text-white px-2 py-1.5 focus:ring-1 focus:ring-blue-600 outline-none cursor-pointer w-24">
                    <option value="all">All Time</option>
                    <option value="1h">Last 1H</option>
                    <option value="1d">Last 24H</option>
                    <option value="15d">15 Days</option>
                    <option value="month_range">Month Range</option>
                    <option value="1m">1 Month</option>
                </select>
            </div>

            {selectedTimeframe === "month_range" && (
                <div className="flex items-center gap-1 shrink-0 bg-slate-800 rounded-lg px-1">
                    <select value={fromMonth} onChange={(e) => setFromMonth(parseInt(e.target.value))} className="bg-transparent border-none text-[9px] font-black uppercase text-white px-1 py-1.5 outline-none cursor-pointer w-10">
                        {months.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                    </select>
                    <span className="text-slate-600 text-[8px]">-</span>
                    <select value={toMonth} onChange={(e) => setToMonth(parseInt(e.target.value))} className="bg-transparent border-none text-[9px] font-black uppercase text-white px-1 py-1.5 outline-none cursor-pointer w-10">
                        {months.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                    </select>
                </div>
            )}

            <div className="shrink-0">
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="bg-slate-800 border-none rounded-lg text-[9px] font-black uppercase text-white px-2 py-1.5 focus:ring-1 focus:ring-blue-600 outline-none cursor-pointer w-24">
                    <option value="All">All Types</option>
                    <option value="Returnable">Returnable</option>
                    <option value="Non-Returnable">Non-Return</option>
                    <option value="Outdoor">Outdoor</option>
                </select>
            </div>

            <div className="shrink-0">
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="bg-slate-800 border-none rounded-lg text-[9px] font-black uppercase text-white px-2 py-1.5 focus:ring-1 focus:ring-blue-600 outline-none cursor-pointer w-24">
                    <option value="All">All Status</option>
                    <option value="Issued">Issued</option>
                    <option value="Verified">Verified</option>
                    <option value="Returned">Returned</option>
                    <option value="Cleared">Cleared</option>
                    <option value="Completed">Completed</option>
                </select>
            </div>

            <div className="flex-grow min-w-0 max-w-[150px]">
                <input 
                    type="text" 
                    placeholder="Search Number/Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 border-none rounded-lg text-[9px] font-bold text-white px-3 py-1.5 focus:ring-1 focus:ring-blue-600 outline-none"
                />
            </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2 border-l border-slate-800 pl-2">
            <button onClick={() => fetchPasses()} className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg transition-all active:scale-95 shadow-lg shadow-blue-900/20">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
        </div>
      </div>

      <div className="flex-grow bg-white border-x border-b border-slate-200 rounded-b-3xl overflow-hidden flex flex-col min-h-[500px]">
        <div className="flex-grow overflow-auto bg-slate-50 p-px custom-scrollbar">
          <div className="min-w-max">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-200 text-slate-600 shadow-sm uppercase">
                  <th className="w-8 border border-slate-300 py-3 text-[9px] font-black text-center">#</th>
                  <th className="w-28 border border-slate-300 py-3 text-[9px] font-black text-left px-3">Timestamp</th>
                  <th className="w-32 border border-slate-300 py-3 text-[9px] font-black text-left px-3">Pass No / Type</th>
                  <th className="w-48 border border-slate-300 py-3 text-[9px] font-black text-left px-3">Subject Information</th>
                  <th className="w-40 border border-slate-300 py-3 text-[9px] font-black text-left px-3">Destination</th>
                  <th className="w-40 border border-slate-300 py-3 text-[9px] font-black text-left px-3">Purpose</th>
                  <th className="w-32 border border-slate-300 py-3 text-[9px] font-black text-center">Status</th>
                  <th className="w-32 border border-slate-300 py-3 text-[9px] font-black text-left px-3">Issuer</th>
                  <th className="w-16 border border-slate-300 py-3 text-[9px] font-black text-center">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white text-slate-900 uppercase">
                {isLoading ? (
                    <tr><td colSpan={9} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Syncing Encrypted Security Archive...</td></tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row: any, index: number) => (
                    <tr key={row.id} className="hover:bg-blue-50 transition-colors group border-b border-slate-100">
                        <td className="border-r border-slate-200 text-center text-[10px] font-bold text-slate-400 bg-slate-50/50">{index + 1}</td>
                        <td className="border-r border-slate-200 px-3 py-2">
                            <div className="flex flex-col">
                                <span className="font-bold text-[10px]">{new Date(row.createdAt).toLocaleDateString('en-GB')}</span>
                                <span className="text-[8px] text-slate-400">{new Date(row.createdAt).toLocaleTimeString('en-GB')}</span>
                            </div>
                        </td>
                        <td className="border-r border-slate-200 px-3 py-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-900">{row.passNumber}</span>
                                <span className={`text-[8px] font-black px-1 py-0.5 rounded border inline-block w-fit mt-1 ${
                                    row.type === 'Returnable' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                    row.type === 'Non-Returnable' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                    'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                    {row.type}
                                </span>
                            </div>
                        </td>
                        <td className="border-r border-slate-200 px-3 py-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-800">{row.employeeName || row.subject}</span>
                                <span className="text-[8px] text-slate-400 font-bold">{row.employeeId || row.department || "N/A"}</span>
                            </div>
                        </td>
                        <td className="border-r border-slate-200 px-3 py-2">
                            <span className="text-[10px] font-bold text-slate-600 truncate max-w-[150px] block">{row.toPlace || row.whereToGo}</span>
                        </td>
                        <td className="border-r border-slate-200 px-3 py-2">
                            <span className="text-[9px] text-slate-500 normal-case italic line-clamp-1">{row.purpose}</span>
                        </td>
                        <td className="border-r border-slate-200 px-3 py-2 text-center">
                            {(() => {
                                let dotColor = "bg-slate-300";
                                let textColor = "text-slate-500";
                                if (row.status === "Issued") { dotColor = "bg-amber-500"; textColor = "text-amber-600"; }
                                else if (row.status === "Verified") { dotColor = "bg-blue-500"; textColor = "text-blue-600"; }
                                else if (row.status === "Returned" || row.status === "Cleared") { dotColor = "bg-emerald-500"; textColor = "text-emerald-600"; }

                                return (
                                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-current/10 bg-slate-50/50 ${textColor}`}>
                                        <span className={`w-1 h-1 rounded-full ${dotColor}`}></span>
                                        <span className="text-[8px] font-black tracking-widest">{row.status}</span>
                                    </div>
                                );
                            })()}
                        </td>
                        <td className="border-r border-slate-200 px-3 py-2">
                            <span className="text-[10px] font-black text-slate-400">{row.issuerName}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                            <button 
                                onClick={() => setSelectedPassForPrint(row)}
                                className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                            </button>
                        </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={9} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs bg-white">Archive empty for current filter selection</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-between items-center text-slate-900">
            <div className="flex gap-10">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Issued</span>
                    <span className="text-sm font-black tracking-tight">{filteredData.length} Passes</span>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Verification</span>
                    <span className="text-sm font-black tracking-tight text-blue-600">
                        {filteredData.filter(p => p.status === 'Verified').length} Verified
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Audit Status</span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    SECURITY SYNC ACTIVE
                </span>
            </div>
        </div>
      </div>

      {selectedPassForPrint && (
          <GatePassPrint pass={selectedPassForPrint} onClose={() => setSelectedPassForPrint(null)} />
      )}
    </div>
  );
}
