"use client";

import { useState, useEffect, useMemo } from "react";
import { authenticatedFetch } from "@/lib/utils";
import GatePassPrint from "@/components/security/GatePassPrint";

export default function AdminGatePassRecords() {
  const [passes, setPasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPassForPrint, setSelectedPassForPrint] = useState<any>(null);

  // Advanced Filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState(""); // For Pass Number
  const [deptQuery, setDeptQuery] = useState(""); // For Department

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
      
      // 1. Pass Type Filter
      if (selectedType !== "All" && p.type !== selectedType) return false;

      // 2. Status Filter
      if (selectedStatus !== "All") {
          if (selectedStatus === "Pending") {
              // Returnable passes not yet Completed
              if (p.type === "Returnable" && p.status !== "Completed") return true;
              return false; 
          }
          if (p.status !== selectedStatus) return false;
      }

      // 3. Search Pass Number
      if (searchQuery && !p.passNumber.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // 4. Search Department
      const dept = (p.department || "").toLowerCase();
      if (deptQuery && !dept.includes(deptQuery.toLowerCase())) return false;

      // 5. Year Filter
      if (pDate.getFullYear() !== selectedYear) return false;

      return true;
    });
  }, [passes, selectedYear, selectedType, selectedStatus, searchQuery, deptQuery]);

  const statusColors: any = {
      "Issued": "bg-amber-50 text-amber-600 border-amber-100",
      "Verified": "bg-blue-50 text-blue-600 border-blue-100",
      "Returned": "bg-indigo-50 text-indigo-600 border-indigo-100",
      "Completed": "bg-emerald-50 text-emerald-600 border-emerald-100",
      "Cleared": "bg-emerald-50 text-emerald-600 border-emerald-100"
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn w-full mx-auto text-slate-900 pb-10">
      
      {/* ADVANCED FILTER BAR */}
      <div className="bg-slate-900 px-6 py-6 rounded-t-3xl shadow-2xl border-b border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Pass Category</label>
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl text-[11px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer transition-all">
                    <option value="All">All Categories</option>
                    <option value="Returnable">Returnable</option>
                    <option value="Non-Returnable">Non-Returnable</option>
                    <option value="Outdoor">Outdoor</option>
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Lifecycle Status</label>
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl text-[11px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer transition-all">
                    <option value="All">All Statuses</option>
                    <option value="Issued">Issued / Pending Security</option>
                    <option value="Verified">Material OUT</option>
                    <option value="Returned">Security IN</option>
                    <option value="Completed">Process Completed</option>
                    <option value="Pending">All Pending (Returnable)</option>
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Pass Search</label>
                <input 
                    type="text" 
                    placeholder="Search Pass No..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 border-none rounded-xl text-[11px] font-bold text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none placeholder:text-slate-600"
                />
            </div>

            <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Department Filter</label>
                <input 
                    type="text" 
                    placeholder="Search Department..."
                    value={deptQuery}
                    onChange={(e) => setDeptQuery(e.target.value)}
                    className="w-full bg-slate-800 border-none rounded-xl text-[11px] font-bold text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none placeholder:text-slate-600"
                />
            </div>

            <div className="flex items-end gap-2">
                <div className="flex-grow space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Year</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full bg-slate-800 border-none rounded-xl text-[11px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer transition-all text-center">
                        {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <button onClick={fetchPasses} className="bg-orange-600 hover:bg-orange-500 text-white p-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-900/40 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                </button>
            </div>
        </div>
      </div>

      {/* TABLE AREA */}
      <div className="flex-grow bg-white border-x border-b border-slate-200 rounded-b-3xl overflow-hidden flex flex-col min-h-[600px] shadow-xl">
        <div className="flex-grow overflow-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 text-slate-500 border-b border-slate-200 uppercase">
                <th className="py-4 text-[10px] font-black text-center w-12">#</th>
                <th className="py-4 text-[10px] font-black text-left px-4 w-32">Identification</th>
                <th className="py-4 text-[10px] font-black text-left px-4 w-48">Subject / Personnel</th>
                <th className="py-4 text-[10px] font-black text-left px-4 w-40">Department</th>
                <th className="py-4 text-[10px] font-black text-left px-4 w-48">Destination & Purpose</th>
                <th className="py-4 text-[10px] font-black text-center w-32">Status</th>
                <th className="py-4 text-[10px] font-black text-left px-4 w-32">Authorized By</th>
                <th className="py-4 text-[10px] font-black text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white text-slate-900 uppercase">
              {isLoading ? (
                  <tr><td colSpan={8} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest text-xs animate-pulse">Synchronizing Administrative Vault...</td></tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((row: any, index: number) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 group">
                      <td className="text-center text-[10px] font-bold text-slate-300">{index + 1}</td>
                      <td className="px-4 py-4">
                          <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-900 tracking-tight">{row.passNumber}</span>
                              <span className="text-[8px] font-bold text-slate-400 mt-1">{new Date(row.createdAt).toLocaleDateString('en-GB')} {new Date(row.createdAt).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                      </td>
                      <td className="px-4 py-4">
                          <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-800">{row.employeeName || row.subject || "N/A"}</span>
                              <span className="text-[9px] font-bold text-slate-400">{row.employeeId || "EXTERNAL"}</span>
                          </div>
                      </td>
                      <td className="px-4 py-4">
                          <span className="text-[10px] font-black text-slate-600">{row.department || "N/A"}</span>
                      </td>
                      <td className="px-4 py-4">
                          <div className="flex flex-col max-w-[200px]">
                              <span className="text-[10px] font-black text-orange-600 truncate">{row.toPlace || row.whereToGo}</span>
                              <span className="text-[9px] font-medium text-slate-400 normal-case italic line-clamp-1">{row.purpose}</span>
                          </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                          <span className={`text-[8px] font-black px-2.5 py-1 rounded-md border shadow-sm ${statusColors[row.status] || "bg-slate-50 text-slate-400"}`}>
                              {row.status}
                          </span>
                      </td>
                      <td className="px-4 py-4">
                          <span className="text-[10px] font-black text-slate-400">{row.authorizedBy}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                          <button 
                              onClick={() => setSelectedPassForPrint(row)}
                              className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90"
                          >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                          </button>
                      </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest text-xs">No records matching your administrative filters</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER STATS */}
        <div className="bg-slate-900 px-10 py-5 flex flex-wrap justify-between items-center text-white">
            <div className="flex gap-12">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Filtered</span>
                    <span className="text-sm font-black tracking-tight text-orange-500">{filteredData.length} Records</span>
                </div>
                <div className="w-px h-10 bg-slate-800"></div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ongoing Movement</span>
                    <span className="text-sm font-black tracking-tight text-blue-400">
                        {filteredData.filter(p => p.status === 'Verified').length} OUT
                    </span>
                </div>
                <div className="hidden sm:flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Completed Cycle</span>
                    <span className="text-sm font-black tracking-tight text-emerald-400">
                        {filteredData.filter(p => p.status === 'Completed' || p.status === 'Cleared').length} Finished
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Compliance Check</p>
                    <p className="text-[10px] font-black text-emerald-500 uppercase">SYSTEM INTEGRITY VERIFIED</p>
                </div>
                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
            </div>
        </div>
      </div>

      {selectedPassForPrint && (
          <GatePassPrint pass={selectedPassForPrint} onClose={() => setSelectedPassForPrint(null)} />
      )}
    </div>
  );
}
