"use client";

import { useState, useEffect, useMemo } from "react";
import { authenticatedFetch } from "@/lib/utils";

export default function ViewSheets() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Unified Professional Filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h"); // Default: Last 1 Hour
  const [fromMonth, setFromMonth] = useState(1);
  const [toMonth, setToMonth] = useState(new Date().getMonth() + 1);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedCat, setSelectedCat] = useState("All");
  const [searchName, setSearchName] = useState("");

  const months = [
    { val: 1, name: "Jan" }, { val: 2, name: "Feb" }, { val: 3, name: "Mar" },
    { val: 4, name: "Apr" }, { val: 5, name: "May" }, { val: 6, name: "Jun" },
    { val: 7, name: "Jul" }, { val: 8, name: "Aug" }, { val: 9, name: "Sep" },
    { val: 10, name: "Oct" }, { val: 11, name: "Nov" }, { val: 12, name: "Dec" }
  ];

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await authenticatedFetch("/api/expenses/list?timeframe=all");
        const result = await response.json();
        if (result.success) {
          setExpenses(result.expenses);
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  // Filter options derived from database data
  const departments = ["All", ...Array.from(new Set(expenses.map((e: any) => e.department).filter(Boolean)))].sort();
  const categories = ["All", ...Array.from(new Set(expenses.map((e: any) => e.category).filter(Boolean)))].sort();

  // Core Filtering Logic
  const filteredData = useMemo(() => {
    return expenses.filter((e: any) => {
      const eDate = new Date(e.date);
      const now = new Date();
      
      // 1. Search by Name
      if (searchName && !e.empName?.toLowerCase().includes(searchName.toLowerCase())) return false;

      // 2. Year Filter
      if (eDate.getFullYear() !== selectedYear) return false;

      // 3. Timeframe Filter
      let matchTime = true;
      if (selectedTimeframe === "1h") {
        matchTime = (now.getTime() - eDate.getTime()) <= (60 * 60 * 1000);
      } else if (selectedTimeframe === "1d") {
        matchTime = (now.getTime() - eDate.getTime()) <= (24 * 60 * 60 * 1000);
      } else if (selectedTimeframe === "15d") {
        matchTime = (now.getTime() - eDate.getTime()) <= (15 * 24 * 60 * 60 * 1000);
      } else if (selectedTimeframe === "month_range") {
        const m = eDate.getMonth() + 1;
        matchTime = m >= fromMonth && m <= toMonth;
      } else if (selectedTimeframe === "1m") {
        const oneMonthAgo = new Date(); oneMonthAgo.setMonth(now.getMonth() - 1);
        matchTime = eDate >= oneMonthAgo;
      } else if (selectedTimeframe === "3m") {
        const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(now.getMonth() - 3);
        matchTime = eDate >= threeMonthsAgo;
      }

      // 4. Other Filters
      const matchType = selectedType === "All" || e.type === selectedType;
      const matchDept = selectedDept === "All" || e.department === selectedDept;
      const matchCat = selectedCat === "All" || e.category === selectedCat;

      return matchTime && matchType && matchDept && matchCat;
    });
  }, [expenses, selectedYear, selectedTimeframe, fromMonth, toMonth, selectedType, selectedDept, selectedCat, searchName]);

  const totalAmount = filteredData.reduce((s: number, r: any) => s + r.amount, 0);

  return (
    <div className="flex flex-col h-full animate-fadeIn w-[95vw] mx-auto overflow-hidden text-gray-900">
      
      {/* PROFESSIONAL UNIFIED FILTER BAR */}
      <div className="bg-gray-900 px-8 py-6 rounded-t-3xl flex flex-wrap items-end gap-6 shadow-2xl border-b border-gray-800">
        <div className="flex items-center gap-4 mr-4">
            <div className="w-2 h-8 bg-orange-600 rounded-full"></div>
            <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-white leading-none">Live Ledger</h2>
                <p className="text-[8px] text-gray-500 font-bold uppercase mt-1">Transaction Explorer</p>
            </div>
        </div>

        <div className="flex flex-wrap gap-4 items-end flex-grow">
            <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Year</label>
                <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer">
                    {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Period</label>
                <select value={selectedTimeframe} onChange={(e) => setSelectedTimeframe(e.target.value)} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer">
                    <option value="1h">Last 1 Hour</option>
                    <option value="1d">Last 24 Hours</option>
                    <option value="15d">Last 15 Days</option>
                    <option value="month_range">Month Range</option>
                    <option value="1m">1 Month (Recent)</option>
                    <option value="3m">3 Months (Recent)</option>
                    <option value="all">All Records</option>
                </select>
            </div>

            {selectedTimeframe === "month_range" && (
                <>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">From Month</label>
                        <select value={fromMonth} onChange={(e) => setFromMonth(parseInt(e.target.value))} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer">
                            {months.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">To Month</label>
                        <select value={toMonth} onChange={(e) => setToMonth(parseInt(e.target.value))} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer">
                            {months.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                        </select>
                    </div>
                </>
            )}

            <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Type</label>
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer">
                    <option value="All">All Types</option>
                    <option value="Petty Cash">Petty Cash</option>
                    <option value="Cash Voucher">Cash Voucher</option>
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Dept</label>
                <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer max-w-[150px]">
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Category</label>
                <select value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer max-w-[150px]">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="space-y-1 flex-grow max-w-xs">
                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Employee Search</label>
                <input 
                    type="text" 
                    placeholder="Search name..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="block w-full bg-gray-800 border-none rounded-xl text-[10px] font-bold text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none"
                />
            </div>
        </div>

        <button onClick={() => window.location.reload()} className="bg-orange-600 hover:bg-orange-700 text-white p-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-900/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
      </div>

      <div className="flex-grow bg-white border-x border-b border-gray-200 rounded-b-3xl overflow-hidden flex flex-col h-[65vh]">
        <div className="flex-grow overflow-auto bg-gray-50 p-px custom-scrollbar">
          <div className="min-w-max">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-200 text-gray-600 shadow-sm">
                  <th className="w-8 border border-gray-300 py-3 text-[9px] font-black uppercase text-center">#</th>
                  <th className="w-28 border border-gray-300 py-3 text-[9px] font-black uppercase text-left px-3">Date / Time</th>
                  <th className="w-32 border border-gray-300 py-3 text-[9px] font-black uppercase text-left px-3">Category</th>
                  <th className="w-32 border border-gray-300 py-3 text-[9px] font-black uppercase text-left px-3">Department</th>
                  <th className="w-20 border border-gray-300 py-3 text-[9px] font-black uppercase text-center">Code</th>
                  <th className="w-40 border border-gray-300 py-3 text-[9px] font-black uppercase text-left px-3">Employee / Source</th>
                  <th className="w-12 border border-gray-300 py-3 text-[9px] font-black uppercase text-center">Prs</th>
                  <th className="w-12 border border-gray-300 py-3 text-[9px] font-black uppercase text-center">Days</th>
                  <th className="w-28 border border-gray-300 py-3 text-[9px] font-black uppercase text-right px-3">Amount</th>
                  <th className="border border-gray-300 py-3 text-[9px] font-black uppercase text-left px-3">Remarks / Description</th>
                  <th className="w-20 border border-gray-300 py-3 text-[9px] font-black uppercase text-center">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white text-gray-900">
                {isLoading ? (
                    <tr><td colSpan={11} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Synchronizing Live Database...</td></tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row: any, index: number) => (
                    <tr key={row.id} className="hover:bg-blue-50 transition-colors group border-b border-gray-100 uppercase">
                      <td className="border-r border-gray-200 text-center text-[10px] font-bold text-gray-400 bg-gray-50/50">{index + 1}</td>
                      <td className="border-r border-gray-200 px-3 py-2 text-[10px]">
                        <div className="flex flex-col">
                            <span className="font-bold">{new Date(row.date).toLocaleDateString('en-GB')}</span>
                            <span className="text-[8px] text-orange-600 font-black">{new Date(row.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                      </td>
                      <td className="border-r border-gray-200 px-3 py-2 text-xs font-black text-gray-900 tracking-tight">{(row.category || "GENERAL").trim()}</td>
                      <td className="border-r border-gray-200 px-3 py-2 text-xs text-gray-600 font-bold">{row.department}</td>
                      <td className="border-r border-gray-200 px-3 py-2 text-xs text-center font-bold text-orange-600 font-mono">{row.empCode || "-"}</td>
                      <td className="border-r border-gray-200 px-3 py-2 text-xs font-medium text-gray-900">
                        {row.type === "Petty Cash" ? (row.empName || "-") : (row.vendorName || "DIRECT")}
                      </td>
                      <td className="border-r border-gray-200 px-3 py-2 text-xs text-center text-gray-600">{row.numPersons || 0}</td>
                      <td className="border-r border-gray-200 px-3 py-2 text-xs text-center text-gray-600">{row.numDays || 0}</td>
                      <td className="border-r border-gray-200 px-3 py-2 text-xs text-right font-black text-gray-900 tabular-nums">Rs. {row.amount.toLocaleString()}.00</td>
                      <td className="border-r border-gray-200 px-3 py-2 text-[10px] text-gray-500 italic lowercase first-letter:uppercase">
                        {row.type === "Petty Cash" ? row.remarks : row.description}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${row.type === 'Cash Voucher' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                            {row.type === 'Cash Voucher' ? 'CV' : 'PC'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={11} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs bg-white">No entries found for selected criteria</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-between items-center text-gray-900">
            <div className="flex gap-10">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Aggregate Records</span>
                    <span className="text-sm font-black tracking-tight">{filteredData.length} items</span>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total Valuation</span>
                    <span className="text-sm font-black tracking-tight text-orange-600">PKR {totalAmount.toLocaleString()}.00</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">System Status</span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    VERIFIED & SYNCED
                </span>
            </div>
        </div>
      </div>
    </div>
  );
}