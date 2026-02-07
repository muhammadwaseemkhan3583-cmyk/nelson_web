"use client";

import { useState, useEffect, useMemo } from "react";
import { authenticatedFetch } from "@/lib/utils";

export default function ExpenseReports() {
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  
  // Header Filter (Controls Metrics)
  const [headerTimeframe, setHeaderTimeframe] = useState("current");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Table Filters (The "Sheet" below)
  const [tableTimeframe, setTableTimeframe] = useState("1h"); // Default: Last 1 Hour
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [tableType, setTableType] = useState("All");
  const [tableDept, setTableDept] = useState("All");
  const [tableCat, setTableCat] = useState("All");

  const fetchAllExpenses = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(`/api/expenses/list?timeframe=all`);
      const data = await response.json();
      if (data.success) {
        setExpenses(data.expenses);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllExpenses();
  }, []);

  // Filter options derived from data
  const departments = ["All", ...Array.from(new Set(expenses.map(e => e.department).filter(Boolean)))].sort();
  const categories = ["All", ...Array.from(new Set(expenses.map(e => e.category).filter(Boolean)))].sort();

  // Metrics Data (Filtered by Header Timeframe/Year)
  const metricsData = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      const now = new Date();
      
      // 1. Year Filter
      if (d.getFullYear() !== selectedYear) return false;

      // 2. Timeframe Filter
      if (headerTimeframe === "current") {
        return (d.getMonth() + 1) === (now.getMonth() + 1);
      }
      
      if (headerTimeframe === "last_month") {
        const lastMonth = new Date();
        lastMonth.setMonth(now.getMonth() - 1);
        return (d.getMonth() + 1) === (lastMonth.getMonth() + 1);
      }

      if (headerTimeframe === "3m") {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return d >= threeMonthsAgo;
      }

      if (headerTimeframe === "6m") {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return d >= sixMonthsAgo;
      }

      if (headerTimeframe === "1y") {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        return d >= oneYearAgo;
      }

      return true;
    });
  }, [expenses, headerTimeframe, selectedYear]);

  // Table Data (The "Sheet" - Filtered by specific table filters)
  const filteredTableData = useMemo(() => {
    return expenses.filter(e => {
      const matchType = tableType === "All" || e.type === tableType;
      const matchDept = tableDept === "All" || e.department === tableDept;
      const matchCat = tableCat === "All" || e.category === tableCat;
      
      const eDate = new Date(e.date);
      const now = new Date();
      let matchTime = true;

      // Custom Date Range Logic (Priority)
      if (tableTimeframe === "custom") {
        if (!fromDate || !toDate) return false; // Show nothing if range is incomplete
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        matchTime = eDate >= start && eDate <= end;
      } else {
        // Preset Timeframe Logic
        if (tableTimeframe === "1h") {
          matchTime = (now.getTime() - eDate.getTime()) <= (60 * 60 * 1000);
        } else if (tableTimeframe === "1m") {
          const oneMonthAgo = new Date(); oneMonthAgo.setMonth(now.getMonth() - 1);
          matchTime = eDate >= oneMonthAgo;
        } else if (tableTimeframe === "2m") {
          const twoMonthsAgo = new Date(); twoMonthsAgo.setMonth(now.getMonth() - 2);
          matchTime = eDate >= twoMonthsAgo;
        } else if (tableTimeframe === "3m") {
          const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(now.getMonth() - 3);
          matchTime = eDate >= threeMonthsAgo;
        }
      }

      return matchType && matchDept && matchCat && matchTime;
    });
  }, [expenses, tableTimeframe, fromDate, toDate, tableType, tableDept, tableCat]);

  // Calculations
  const totalMonthly = metricsData.reduce((sum: number, e: any) => sum + e.amount, 0);
  
  const deptBreakdown = metricsData.reduce((acc: any, e: any) => {
    const d = (e.department || "Other").trim();
    acc[d] = (acc[d] || 0) + e.amount;
    return acc;
  }, {});
  const sortedDepts = Object.entries(deptBreakdown).sort(([, a]: any, [, b]: any) => b - a);

  const catBreakdown = metricsData.reduce((acc: any, e: any) => {
    const rawCat = (e.category || "General").trim();
    const normalizedCat = rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase();
    acc[normalizedCat] = (acc[normalizedCat] || 0) + e.amount;
    return acc;
  }, {});
  const sortedCats = Object.entries(catBreakdown).sort(([, a]: any, [, b]: any) => b - a);

  return (
    <div className="space-y-8 animate-fadeIn text-gray-900 pb-12">
      
      {/* HEADER FILTERS (Time Period/Year) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-wrap justify-between items-end print:hidden">
        <div className="flex gap-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Year</label>
                <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="block w-32 border-gray-300 rounded-lg text-sm font-bold bg-gray-50 text-gray-900 focus:ring-orange-500 outline-none">
                    {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Analysis Period</label>
                <select value={headerTimeframe} onChange={(e) => setHeaderTimeframe(e.target.value)} className="block w-48 border-gray-300 rounded-lg text-sm font-bold bg-gray-50 text-gray-900 focus:ring-orange-500 outline-none">
                    <option value="current">Current Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="3m">Last 3 Months</option>
                    <option value="6m">Last 6 Months</option>
                    <option value="1y">Last 1 Year</option>
                </select>
            </div>
        </div>
        <button onClick={() => window.print()} className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-orange-600 transition-all shadow-md active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2zM12 17h.01"></path></svg>
          Print Report
        </button>
      </div>

      <div id="printable-report" className="space-y-8">
        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-t-4 border-orange-600">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Analysis Total</p>
                <p className="text-3xl font-black text-gray-900 mt-2">Rs. {totalMonthly.toLocaleString()}</p>
                <p className="text-[9px] font-bold text-orange-600 mt-1 uppercase">{metricsData.length} Records in Selection</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Highest Dept</p>
                <p className="text-2xl font-black text-gray-900 mt-2 uppercase">{sortedDepts[0]?.[0] || "N/A"}</p>
                <p className="text-[10px] font-bold text-gray-500 mt-1">Rs. {Number(sortedDepts[0]?.[1] || 0).toLocaleString()} spent</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Top Category</p>
                <p className="text-2xl font-black text-gray-900 mt-2 uppercase">{sortedCats[0]?.[0] || "N/A"}</p>
                <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase">{totalMonthly > 0 ? ((Number(sortedCats[0]?.[1] || 0) / totalMonthly) * 100).toFixed(1) : 0}% share</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daily Average</p>
                <p className="text-3xl font-black text-blue-600 mt-2">Rs. {(totalMonthly / 30).toFixed(0).toLocaleString()}</p>
                <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase text-right">Per Day</p>
            </div>
        </div>

        {/* Breakdown Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Departmental Share</h3>
                <div className="space-y-6">
                    {sortedDepts.map(([dept, amt]: any) => (
                        <div key={dept}>
                            <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                                <span>{dept}</span>
                                <span>Rs. {amt.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-orange-600 h-full transition-all duration-1000" style={{ width: `${(amt / totalMonthly) * 100}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Category Breakdown</h3>
                <div className="space-y-6">
                    {sortedCats.slice(0, 5).map(([cat, amt]: any) => (
                        <div key={cat}>
                            <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                                <span>{cat}</span>
                                <span>Rs. {amt.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-gray-900 h-full transition-all duration-1000" style={{ width: `${(amt / totalMonthly) * 100}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* DETAILED SHEET SECTION */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="bg-gray-50 px-8 py-6 border-b border-gray-200 flex flex-wrap justify-between items-center gap-6 print:hidden">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-orange-600 rounded-full"></div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Detailed Expense Sheet</h3>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Period</span>
                        <select value={tableTimeframe} onChange={(e) => { setTableTimeframe(e.target.value); setFromDate(""); setToDate(""); }} className="border-2 border-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-900 focus:border-orange-600 outline-none bg-white">
                            <option value="1h">Last 1 Hour</option>
                            <option value="1m">1 Month</option>
                            <option value="2m">2 Months</option>
                            <option value="3m">3 Months</option>
                            <option value="custom">Custom Range</option>
                            <option value="all">All Records</option>
                        </select>
                    </div>

                    {tableTimeframe === "custom" && (
                        <>
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">From Date</span>
                                <input 
                                    type="date" 
                                    value={fromDate} 
                                    onChange={(e) => setFromDate(e.target.value)} 
                                    className="border-2 border-gray-100 rounded-lg px-2 py-1 text-[10px] font-bold text-gray-900 focus:border-orange-600 outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">To Date</span>
                                <input 
                                    type="date" 
                                    value={toDate} 
                                    onChange={(e) => setToDate(e.target.value)} 
                                    className="border-2 border-gray-100 rounded-lg px-2 py-1 text-[10px] font-bold text-gray-900 focus:border-orange-600 outline-none"
                                />
                            </div>
                        </>
                    )}

                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Type</span>
                        <select value={tableType} onChange={(e) => setTableType(e.target.value)} className="border-2 border-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-900 focus:border-orange-600 outline-none bg-white">
                            <option value="All">All Types</option>
                            <option value="Petty Cash">Petty Cash</option>
                            <option value="Cash Voucher">Cash Voucher</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Dept</span>
                        <select value={tableDept} onChange={(e) => setTableDept(e.target.value)} className="border-2 border-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-900 focus:border-orange-600 outline-none bg-white">
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Cat</span>
                        <select value={tableCat} onChange={(e) => setTableCat(e.target.value)} className="border-2 border-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-900 focus:border-orange-600 outline-none bg-white">
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-100 text-left border-b border-gray-200">
                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Date / Time</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Dept / Category</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Source / Employee</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700 uppercase">
                        {filteredTableData.map((row, i) => (
                            <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-8 py-4 font-black text-gray-900 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span>{new Date(row.date).toLocaleDateString()}</span>
                                        <span className="text-[10px] text-orange-600 font-bold">{new Date(row.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-4">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-900 font-black">{row.department || "N/A"}</span>
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${row.type === "Cash Voucher" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                                                {row.type === "Cash Voucher" ? "CV" : "PC"}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-bold">{(row.category || "General").toUpperCase()}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-4 text-[10px]">
                                    {row.type === "Petty Cash" ? (
                                        <span>{row.empName} {row.remarks ? ` - ${row.remarks}` : ""}</span>
                                    ) : (
                                        <span>{row.description} ({row.vendorName})</span>
                                    )}
                                </td>
                                <td className="px-8 py-4 text-right font-black text-gray-900">Rs. {row.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-900 text-white font-black">
                        <tr>
                            <td colSpan={3} className="px-8 py-5 text-xs uppercase tracking-widest">Sheet Total (Filtered)</td>
                            <td className="px-8 py-5 text-right font-mono text-orange-500">Rs. {filteredTableData.reduce((s: number, r: any) => s + r.amount, 0).toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 1cm; }
          body { background: white !important; }
          .print\:hidden { display: none !important; }
          #printable-report { width: 100% !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
