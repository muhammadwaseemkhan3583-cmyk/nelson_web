"use client";

import { useState, useEffect, useMemo } from "react";
import { authenticatedFetch } from "@/lib/utils";
import VoucherRecords from "./VoucherRecords";

export default function ExpenseReports({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  
  // Header Filter (Controls Metrics)
  const [headerTimeframe, setHeaderTimeframe] = useState("current");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Table Filters (The "Sheet" below)
  const [tableYear, setTableYear] = useState(new Date().getFullYear());
  const [tableTimeframe, setTableTimeframe] = useState("1h"); // Default: Last 1 Hour
  const [tableFromMonth, setTableFromMonth] = useState(1);
  const [tableToMonth, setTableToMonth] = useState(new Date().getMonth() + 1);
  const [tableType, setTableType] = useState("All");
  const [tableDept, setTableDept] = useState("All");
  const [tableCat, setTableCat] = useState("All");
  const [tableVoucherNum, setTableVoucherNum] = useState("");

  const months = [
    { val: 1, name: "Jan" }, { val: 2, name: "Feb" }, { val: 3, name: "Mar" },
    { val: 4, name: "Apr" }, { val: 5, name: "May" }, { val: 6, name: "Jun" },
    { val: 7, name: "Jul" }, { val: 8, name: "Aug" }, { val: 9, name: "Sep" },
    { val: 10, name: "Oct" }, { val: 11, name: "Nov" }, { val: 12, name: "Dec" }
  ];

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [expRes, vocRes] = await Promise.all([
        authenticatedFetch(`/api/expenses/list?timeframe=all`),
        authenticatedFetch(`/api/vouchers/list`)
      ]);
      
      const expData = await expRes.json();
      const vocData = await vocRes.json();

      if (expData.success) setExpenses(expData.expenses);
      if (vocData.success) setVouchers(vocData.vouchers);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Balance Calculation
  const MAIN_AMOUNT = 50000;
  const pendingVouchersTotal = vouchers
    .filter(v => (v.status || "Pending") === "Pending" && (v.type || "").toLowerCase() === "petty cash")
    .reduce((sum, v) => sum + Number(v.totalAmount || 0), 0);
  const currentBalance = MAIN_AMOUNT - pendingVouchersTotal;

  // Filter options derived from data (Normalized for uniqueness)
  const departments = ["All", ...Array.from(new Set(expenses.map((e: any) => (e.department || "").trim().toUpperCase()).filter(Boolean)))].sort();
  const categories = ["All", ...Array.from(new Set(expenses.map((e: any) => (e.category || "").trim().toUpperCase()).filter(Boolean)))].sort();

  // Metrics Data (Filtered by Header Timeframe/Year)
  const metricsData = useMemo(() => {
    return expenses.filter((e: any) => {
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
    return expenses.filter((e: any) => {
      // 1. Search by Voucher Number (Serial or UUID) - Bypasses other filters
      if (tableVoucherNum) {
        const searchVal = tableVoucherNum.toLowerCase();
        const matchedVoucher = vouchers.find(v => v.serialNumber.toLowerCase() === searchVal);
        return (
          e.voucherId?.toLowerCase() === searchVal || 
          (matchedVoucher && e.voucherId === matchedVoucher.id)
        );
      }

      // 2. Regular Filters
      const matchType = tableType === "All" || e.type === tableType;
      const matchDept = tableDept === "All" || (e.department || "").trim().toUpperCase() === tableDept;
      const matchCat = tableCat === "All" || (e.category || "").trim().toUpperCase() === tableCat;
      
      const eDate = new Date(e.date);
      const now = new Date();

      // Year Filter
      if (eDate.getFullYear() !== tableYear) return false;

      let matchTime = true;

      // Timeframe Logic
      if (tableTimeframe === "1h") {
        matchTime = (now.getTime() - eDate.getTime()) <= (60 * 60 * 1000);
      } else if (tableTimeframe === "1d") {
        matchTime = (now.getTime() - eDate.getTime()) <= (24 * 60 * 60 * 1000);
      } else if (tableTimeframe === "15d") {
        matchTime = (now.getTime() - eDate.getTime()) <= (15 * 24 * 60 * 60 * 1000);
      } else if (tableTimeframe === "month_range") {
        const m = eDate.getMonth() + 1;
        matchTime = m >= tableFromMonth && m <= tableToMonth;
      } else if (tableTimeframe === "1m") {
        const oneMonthAgo = new Date(); oneMonthAgo.setMonth(now.getMonth() - 1);
        matchTime = eDate >= oneMonthAgo;
      } else if (tableTimeframe === "3m") {
        const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(now.getMonth() - 3);
        matchTime = eDate >= threeMonthsAgo;
      }

      return matchType && matchDept && matchCat && matchTime;
    });
  }, [expenses, tableYear, tableTimeframe, tableFromMonth, tableToMonth, tableType, tableDept, tableCat, tableVoucherNum]);

  // Calculations
  const totalMonthly = metricsData.reduce((sum: number, e: any) => sum + e.amount, 0);
  
  const deptBreakdown = metricsData.reduce((acc: any, e: any) => {
    const d = (e.department || "Other").trim().toUpperCase();
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
        <div className="flex gap-6 items-end">
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

        <div className="flex gap-10 items-end">
            <div className="flex gap-8 text-right">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Main Amount</p>
                    <p className="text-xl font-black text-gray-900 mt-1">Rs. {MAIN_AMOUNT.toLocaleString()}</p>
                </div>
                <div className="h-10 w-px bg-gray-100"></div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Current Balance</p>
                    <p className={`text-xl font-black mt-1 ${currentBalance < 5000 ? 'text-red-600' : 'text-green-600'}`}>Rs. {currentBalance.toLocaleString()}</p>
                </div>
            </div>
            <button 
                onClick={() => {
                    if (onTabChange) onTabChange("expenses_records");
                    else setIsVoucherModalOpen(true);
                }}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                Voucher Records
            </button>
        </div>
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

        {/* DETAILED SHEET SECTION - Refactored to match ViewSheets UI */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="bg-gray-900 px-8 py-6 flex flex-wrap items-end gap-6 shadow-2xl border-b border-gray-800 print:hidden">
                <div className="flex items-center gap-4 mr-4">
                    <div className="w-2 h-8 bg-orange-600 rounded-full"></div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-white leading-none">Detailed Sheet</h2>
                        <p className="text-[8px] text-gray-500 font-bold uppercase mt-1">Report Explorer</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 items-end flex-grow">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Year</label>
                        <select value={tableYear} onChange={(e) => setTableYear(parseInt(e.target.value))} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer">
                            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Period</label>
                        <select value={tableTimeframe} onChange={(e) => setTableTimeframe(e.target.value)} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer">
                            <option value="1h">Last 1 Hour</option>
                            <option value="1d">Last 24 Hours</option>
                            <option value="15d">Last 15 Days</option>
                            <option value="month_range">Month Range</option>
                            <option value="1m">1 Month (Recent)</option>
                            <option value="3m">3 Months (Recent)</option>
                            <option value="all">All Records</option>
                        </select>
                    </div>

                    {tableTimeframe === "month_range" && (
                        <>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">From Month</label>
                                <select value={tableFromMonth} onChange={(e) => setTableFromMonth(parseInt(e.target.value))} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer">
                                    {months.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">To Month</label>
                                <select value={tableToMonth} onChange={(e) => setTableToMonth(parseInt(e.target.value))} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer">
                                    {months.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}

                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Type</label>
                        <select value={tableType} onChange={(e) => setTableType(e.target.value)} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer">
                            <option value="All">All Types</option>
                            <option value="Petty Cash">Petty Cash</option>
                            <option value="Cash Voucher">Cash Voucher</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Dept</label>
                        <select value={tableDept} onChange={(e) => setTableDept(e.target.value)} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer max-w-[150px]">
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Category</label>
                        <select value={tableCat} onChange={(e) => setTableCat(e.target.value)} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer max-w-[150px]">
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1 flex-grow max-w-xs">
                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Voucher Search</label>
                        <input 
                            type="text" 
                            placeholder="Voucher Num (e.g. VOC-001)..."
                            value={tableVoucherNum}
                            onChange={(e) => setTableVoucherNum(e.target.value)}
                            className="block w-full bg-gray-800 border-none rounded-xl text-[10px] font-bold text-white px-4 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-100 text-left border-b border-gray-200">
                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Date</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Dept / Category</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Source / Employee</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700 uppercase">
                        {filteredTableData.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-8 py-4 font-black text-gray-900 whitespace-nowrap">
                                    <span>{new Date(row.date).toLocaleDateString('en-GB')}</span>
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

      {/* VOUCHER RECORDS MODAL (For Admin Dashboard) */}
      {isVoucherModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md animate-fadeIn">
              <div className="relative w-full max-w-[95vw] h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                  <div className="bg-gray-900 px-8 py-4 flex justify-between items-center text-white border-b border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-orange-600 rounded-full"></div>
                        <span className="font-black uppercase tracking-widest text-sm">Central Voucher Archive</span>
                      </div>
                      <button 
                        onClick={() => setIsVoucherModalOpen(false)}
                        className="p-2 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                  </div>
                  <div className="flex-grow overflow-auto p-4 bg-gray-50">
                      <VoucherRecords />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
