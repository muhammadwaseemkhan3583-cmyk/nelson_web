"use client";

import { useState, useEffect, useMemo } from "react";
import { authenticatedFetch } from "@/lib/utils";
import VoucherRecords from "./VoucherRecords";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

export default function ExpenseReports({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  
  // --- MAIN REPORT FILTERS (Top Bars - Controls Metrics and Graphs) ---
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportTimeframe, setReportTimeframe] = useState("1h"); 
  const [reportFromDate, setReportFromDate] = useState("");
  const [reportToDate, setReportToDate] = useState("");
  const [reportType, setReportType] = useState("All");
  const [reportDept, setReportDept] = useState("All");
  const [reportCat, setReportCat] = useState("All");

  // --- EXCEL EXPORT FILTERS (Bottom Bar - Controls Excel Only) ---
  const [excelYear, setExcelYear] = useState(new Date().getFullYear());
  const [excelTimeframe, setExcelTimeframe] = useState("1m"); 
  const [excelFromDate, setExcelFromDate] = useState("");
  const [excelToDate, setExcelToDate] = useState("");

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
    .filter(v => (v.status || "Pending") !== "Cleared" && (v.type || "").toLowerCase() === "petty cash")
    .reduce((sum, v) => sum + Number(v.totalAmount || 0), 0);
  const currentBalance = MAIN_AMOUNT - pendingVouchersTotal;

  // Filter options derived from data
  const departments = ["All", ...Array.from(new Set(expenses.map((e: any) => (e.department || "").trim().toUpperCase()).filter(Boolean)))].sort();
  const categories = ["All", ...Array.from(new Set(expenses.map((e: any) => (e.category || "").trim().toUpperCase()).filter(Boolean)))].sort();

  // Core Filtering Logic for Metrics & Graphs (Main UI)
  const reportFilteredData = useMemo(() => {
    return expenses.filter((e: any) => {
      const eDate = new Date(e.date);
      const now = new Date();
      
      if (eDate.getFullYear() !== reportYear) return false;

      const matchType = reportType === "All" || e.type === reportType;
      const matchDept = reportDept === "All" || (e.department || "").trim().toUpperCase() === reportDept;
      const matchCat = reportCat === "All" || (e.category || "").trim().toUpperCase() === reportCat;
      
      if (!matchType || !matchDept || !matchCat) return false;

      let matchTime = true;
      if (reportTimeframe === "1h") {
        matchTime = (now.getTime() - eDate.getTime()) <= (60 * 60 * 1000);
      } else if (reportTimeframe === "1d") {
        matchTime = (now.getTime() - eDate.getTime()) <= (24 * 60 * 60 * 1000);
      } else if (reportTimeframe === "15d") {
        matchTime = (now.getTime() - eDate.getTime()) <= (15 * 24 * 60 * 60 * 1000);
      } else if (reportTimeframe === "month_range") {
        if (reportFromDate && reportToDate) {
            const start = new Date(reportFromDate);
            const end = new Date(reportToDate);
            end.setHours(23, 59, 59, 999);
            matchTime = eDate >= start && eDate <= end;
        }
      } else if (reportTimeframe === "1m") {
        const oneMonthAgo = new Date(); oneMonthAgo.setMonth(now.getMonth() - 1);
        matchTime = eDate >= oneMonthAgo;
      } else if (reportTimeframe === "3m") {
        const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(now.getMonth() - 3);
        matchTime = eDate >= threeMonthsAgo;
      }

      return matchTime;
    });
  }, [expenses, reportYear, reportTimeframe, reportFromDate, reportToDate, reportType, reportDept, reportCat]);

  const handleDownloadSummaryExcel = async () => {
    const excelFiltered = expenses.filter((e: any) => {
        const eDate = new Date(e.date);
        const now = new Date();
        if (eDate.getFullYear() !== excelYear) return false;
        let matchTime = true;
        if (excelTimeframe === "all") matchTime = true;
        else if (excelTimeframe === "1h") matchTime = (now.getTime() - eDate.getTime()) <= (60 * 60 * 1000);
        else if (excelTimeframe === "1d") matchTime = (now.getTime() - eDate.getTime()) <= (24 * 60 * 60 * 1000);
        else if (excelTimeframe === "15d") matchTime = (now.getTime() - eDate.getTime()) <= (15 * 24 * 60 * 60 * 1000);
        else if (excelTimeframe === "month_range") {
            if (excelFromDate && excelToDate) {
                const start = new Date(excelFromDate);
                const end = new Date(excelToDate);
                end.setHours(23, 59, 59, 999);
                matchTime = eDate >= start && eDate <= end;
            } else matchTime = false;
        } else if (excelTimeframe === "1m") {
            const oneMonthAgo = new Date(); oneMonthAgo.setMonth(now.getMonth() - 1);
            matchTime = eDate >= oneMonthAgo;
        } else if (excelTimeframe === "3m") {
            const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(now.getMonth() - 3);
            matchTime = eDate >= threeMonthsAgo;
        }
        return matchTime;
    });

    if (excelFiltered.length === 0) {
        alert("No data found for the selected Excel filters.");
        return;
    }

    const ExcelJS = (await import("exceljs")).default;
    const { saveAs } = await import("file-saver");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Dept Summary");

    const titleCell = worksheet.getCell('A1');
    titleCell.value = "DEPARTMENTAL EXPENSE SUMMARY";
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF1E3A8A' } };
    worksheet.mergeCells('A1:C1');
    titleCell.alignment = { horizontal: 'center' };

    const rangeCell = worksheet.getCell('A2');
    let dateRangeText = `Year: ${excelYear}`;
    const now = new Date();
    const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    if (excelTimeframe === "month_range" && excelFromDate && excelToDate) {
        dateRangeText += ` | Range: ${formatDate(new Date(excelFromDate))} TO ${formatDate(new Date(excelToDate))}`;
    } else if (excelTimeframe === "1h") {
        dateRangeText += ` | Last 1 Hour (${formatDate(now)})`;
    } else if (excelTimeframe === "1d") {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        dateRangeText += ` | Period: ${formatDate(yesterday)} TO ${formatDate(now)}`;
    } else if (excelTimeframe === "15d") {
        const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
        dateRangeText += ` | Period: ${formatDate(fifteenDaysAgo)} TO ${formatDate(now)}`;
    } else if (excelTimeframe === "1m") {
        const oneMonthAgo = new Date(); oneMonthAgo.setMonth(now.getMonth() - 1);
        dateRangeText += ` | Period: ${formatDate(oneMonthAgo)} TO ${formatDate(now)}`;
    } else if (excelTimeframe === "3m") {
        const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(now.getMonth() - 3);
        dateRangeText += ` | Period: ${formatDate(threeMonthsAgo)} TO ${formatDate(now)}`;
    } else if (excelTimeframe === "all") {
        dateRangeText += ` | Lifetime Data Archive`;
    }

    rangeCell.value = dateRangeText;
    rangeCell.font = { italic: true, size: 11, color: { argb: 'FF4B5563' } };
    worksheet.mergeCells('A2:C2');
    rangeCell.alignment = { horizontal: 'center' };

    worksheet.addRow([]);
    const headerRow = worksheet.getRow(4);
    headerRow.values = ["Department", "Category", "Amount (PKR)"];
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    const grouped = excelFiltered.reduce((acc: any, curr: any) => {
        const dept = (curr.department || "N/A").trim().toUpperCase();
        const cat = (curr.category || "GENERAL").trim().toUpperCase();
        if (!acc[dept]) acc[dept] = {};
        acc[dept][cat] = (acc[dept][cat] || 0) + curr.amount;
        return acc;
    }, {});

    let currentRow = 5;
    let grandNetTotal = 0;
    const borderStyle: any = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    Object.entries(grouped).forEach(([dept, cats]: [string, any]) => {
        const catEntries = Object.entries(cats);
        const startRow = currentRow;
        let deptTotal = 0;
        catEntries.forEach(([cat, amt]) => {
            const row = worksheet.getRow(currentRow);
            row.values = [dept, cat, amt as any];
            for (let i = 1; i <= 3; i++) {
                const cell = row.getCell(i);
                cell.border = borderStyle;
                cell.alignment = { vertical: 'middle', horizontal: i === 3 ? 'right' : (i === 1 ? 'center' : 'left'), wrapText: true };
            }
            row.getCell(3).numFmt = '#,##0.00';
            deptTotal += Number(amt);
            currentRow++;
        });
        if (currentRow - 1 >= startRow) {
            worksheet.mergeCells(`A${startRow}:A${currentRow - 1}`);
            const mergedCell = worksheet.getCell(`A${startRow}`);
            mergedCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            mergedCell.font = { bold: true, size: 11 };
        }
        const totalRow = worksheet.getRow(currentRow);
        totalRow.getCell(1).value = `${dept} TOTAL`;
        totalRow.getCell(3).value = deptTotal;
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        for (let i = 1; i <= 3; i++) {
            const cell = totalRow.getCell(i);
            cell.border = borderStyle;
            cell.font = { bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
            cell.alignment = { vertical: 'middle', horizontal: i === 3 ? 'right' : 'center' };
        }
        totalRow.getCell(3).numFmt = '#,##0.00';
        grandNetTotal += deptTotal;
        currentRow++;
        worksheet.addRow([]); currentRow++;
    });

    const grandRow = worksheet.getRow(currentRow);
    grandRow.getCell(1).value = "GRAND NET TOTAL";
    grandRow.getCell(3).value = grandNetTotal;
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    for (let i = 1; i <= 3; i++) {
        const cell = grandRow.getCell(i);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 13 };
        cell.border = borderStyle;
        cell.alignment = { vertical: 'middle', horizontal: i === 3 ? 'right' : 'center' };
    }
    grandRow.getCell(3).numFmt = '#,##0.00';
    grandRow.height = 30;
    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 35;
    worksheet.getColumn(3).width = 25;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `Dept_Summary_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalAmount = reportFilteredData.reduce((sum: number, e: any) => sum + e.amount, 0);
  
  // --- RECHARTS DATA PREPARATION ---
  const chartDataDept = useMemo(() => {
    const breakdown = reportFilteredData.reduce((acc: any, e: any) => {
      const d = (e.department || "Other").trim().toUpperCase();
      acc[d] = (acc[d] || 0) + e.amount;
      return acc;
    }, {});
    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a: any, b: any) => b.value - a.value);
  }, [reportFilteredData]);

  const chartDataCat = useMemo(() => {
    const breakdown = reportFilteredData.reduce((acc: any, e: any) => {
      const c = (e.category || "General").trim().toUpperCase();
      acc[c] = (acc[c] || 0) + e.amount;
      return acc;
    }, {});
    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a: any, b: any) => b.value - a.value);
  }, [reportFilteredData]);

  const COLORS = ['#F97316', '#1E40AF', '#10B981', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#14B8A6'];

  return (
    <div className="space-y-8 animate-fadeIn text-gray-900 pb-12">
      
      {/* TOP BALANCES */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap justify-between items-center print:hidden">
        <div className="flex gap-10 items-center">
            <div className="flex gap-8">
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
        </div>
        <button onClick={() => { if (onTabChange) onTabChange("expenses_records"); else setIsVoucherModalOpen(true); }} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-lg active:scale-95 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            Voucher Records
        </button>
      </div>

      <div id="printable-report" className="space-y-8">
        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm border-t-4 border-orange-600">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Total</p>
                <p className="text-3xl font-black text-gray-900 mt-2">Rs. {totalAmount.toLocaleString()}</p>
                <p className="text-[9px] font-bold text-orange-600 mt-1 uppercase">{reportFilteredData.length} Records in Selection</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Highest Dept</p>
                <p className="text-2xl font-black text-gray-900 mt-2 uppercase">{chartDataDept[0]?.name || "N/A"}</p>
                <p className="text-[10px] font-bold text-gray-500 mt-1">Rs. {Number(chartDataDept[0]?.value || 0).toLocaleString()} spent</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Top Category</p>
                <p className="text-2xl font-black text-gray-900 mt-2 uppercase">{chartDataCat[0]?.name || "N/A"}</p>
                <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase">{totalAmount > 0 ? ((Number(chartDataCat[0]?.value || 0) / totalAmount) * 100).toFixed(1) : 0}% share</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selection Avg</p>
                <p className="text-3xl font-black text-blue-600 mt-2">Rs. {reportFilteredData.length > 0 ? (totalAmount / reportFilteredData.length).toFixed(0).toLocaleString() : 0}</p>
                <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase text-right">Per Entry</p>
            </div>
        </div>

        {/* REPORT FILTER BAR */}
        <div className="bg-gray-900 px-8 py-5 rounded-3xl flex flex-wrap items-end gap-6 shadow-xl border-b border-gray-800 print:hidden">
            <div className="flex items-center gap-4 mr-4">
                <div className="w-1.5 h-6 bg-orange-600 rounded-full"></div>
                <div><h2 className="text-[10px] font-black uppercase tracking-widest text-white leading-none">Graph Control</h2></div>
            </div>
            <div className="flex flex-wrap gap-4 items-end flex-grow">
                <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Archive Year</label>
                    <select value={reportYear} onChange={(e) => setReportYear(parseInt(e.target.value))} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2 focus:ring-1 focus:ring-orange-600 outline-none cursor-pointer">
                        {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Time Period</label>
                    <select value={reportTimeframe} onChange={(e) => setReportTimeframe(e.target.value)} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2 focus:ring-1 focus:ring-orange-600 outline-none cursor-pointer">
                        <option value="all">All Records</option><option value="1h">Last 1 Hour</option><option value="1d">Last 24 Hours</option><option value="15d">Last 15 Days</option><option value="month_range">Date Range</option><option value="1m">1 Month</option><option value="3m">3 Months</option>
                    </select>
                </div>
                {reportTimeframe === "month_range" && (
                    <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-xl">
                        <input type="date" value={reportFromDate} onChange={(e) => setReportFromDate(e.target.value)} className="bg-transparent border-none text-[10px] font-black uppercase text-white outline-none cursor-pointer w-28 [color-scheme:dark]"/>
                        <span className="text-gray-600 text-[8px] font-black">TO</span>
                        <input type="date" value={reportToDate} onChange={(e) => setReportToDate(e.target.value)} className="bg-transparent border-none text-[10px] font-black uppercase text-white outline-none cursor-pointer w-28 [color-scheme:dark]"/>
                    </div>
                )}
                <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Type</label>
                    <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2 focus:ring-1 focus:ring-orange-600 outline-none cursor-pointer">
                        <option value="All">All Types</option><option value="Petty Cash">Petty Cash</option><option value="Cash Voucher">Cash Voucher</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Dept</label>
                    <select value={reportDept} onChange={(e) => setReportDept(e.target.value)} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2 focus:ring-1 focus:ring-orange-600 outline-none cursor-pointer min-w-[120px]">
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Category</label>
                    <select value={reportCat} onChange={(e) => setReportCat(e.target.value)} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2 focus:ring-1 focus:ring-orange-600 outline-none cursor-pointer min-w-[120px]">
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="ml-auto">
                    <button onClick={() => fetchAllData()} className="p-2 bg-gray-800 hover:bg-orange-600 text-white rounded-xl transition-all active:scale-95">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                </div>
            </div>
        </div>

        {/* MODERN RECHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Departmental Share - Modern Bar Chart (Horizontal) */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col h-[450px]">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Departmental Share (PKR)</h3>
                <div className="flex-grow">
                    {chartDataDept.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartDataDept} layout="vertical" margin={{ left: 40, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#374151' }} width={100} />
                                <Tooltip 
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                    formatter={(value: any) => [`Rs. ${value.toLocaleString()}`, 'Spent']}
                                />
                                <Bar dataKey="value" fill="#F97316" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-[10px] font-black text-gray-300 uppercase">No Data in Selection</div>
                    )}
                </div>
            </div>

            {/* Category Breakdown - Modern Bar Chart (Vertical) */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col h-[450px]">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Category Analysis</h3>
                <div className="flex-grow">
                    {chartDataCat.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartDataCat} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#374151' }} 
                                    angle={-45}
                                    textAnchor="end"
                                    interval={0}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }} hide />
                                <Tooltip 
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                    formatter={(value: any) => [`Rs. ${value.toLocaleString()}`, 'Total']}
                                />
                                <Bar dataKey="value" fill="#F97316" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-[10px] font-black text-gray-300 uppercase">No Data in Selection</div>
                    )}
                </div>
            </div>
        </div>

        {/* BOTTOM EXCEL FILTER BAR */}
        <div className="bg-gray-900 px-8 py-5 rounded-3xl flex flex-wrap items-end gap-6 shadow-2xl border border-gray-800 print:hidden mt-12">
            <div className="flex items-center gap-4 mr-4">
                <div className="w-1.5 h-6 bg-green-600 rounded-full"></div>
                <div><h2 className="text-[10px] font-black uppercase tracking-widest text-white leading-none">Export Control</h2><p className="text-[7px] text-gray-500 font-bold uppercase mt-1">Independent Summary Logic</p></div>
            </div>
            <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Excel Year</label>
                <select value={excelYear} onChange={(e) => setExcelYear(parseInt(e.target.value))} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2 focus:ring-1 focus:ring-green-600 outline-none cursor-pointer">
                    {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
            <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Excel Period</label>
                <select value={excelTimeframe} onChange={(e) => setExcelTimeframe(e.target.value)} className="block bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase text-white px-4 py-2 focus:ring-1 focus:ring-green-600 outline-none cursor-pointer">
                    <option value="all">All Time</option><option value="1h">Last 1 Hour</option><option value="1d">Last 24 Hours</option><option value="15d">Last 15 Days</option><option value="month_range">Custom Range</option><option value="1m">1 Month</option><option value="3m">3 Months</option>
                </select>
            </div>
            {excelTimeframe === "month_range" && (
                <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-xl border border-gray-700">
                    <input type="date" value={excelFromDate} onChange={(e) => setExcelFromDate(e.target.value)} className="bg-transparent border-none text-[10px] font-black uppercase text-white outline-none cursor-pointer w-28 [color-scheme:dark]"/><span className="text-gray-600 text-[8px] font-black">To</span><input type="date" value={excelToDate} onChange={(e) => setExcelToDate(e.target.value)} className="bg-transparent border-none text-[10px] font-black uppercase text-white outline-none cursor-pointer w-28 [color-scheme:dark]"/>
                </div>
            )}
            <div className="ml-auto">
                <button onClick={handleDownloadSummaryExcel} className="bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-900/20 transition-all active:scale-95 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Download Excel Summary
                </button>
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

      {isVoucherModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md animate-fadeIn">
              <div className="relative w-full max-w-[95vw] h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                  <div className="bg-gray-900 px-8 py-4 flex justify-between items-center text-white border-b border-gray-800">
                      <div className="flex items-center gap-3"><div className="w-2 h-6 bg-orange-600 rounded-full"></div><span className="font-black uppercase tracking-widest text-sm">Central Voucher Archive</span></div>
                      <button onClick={() => setIsVoucherModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                  </div>
                  <div className="flex-grow overflow-auto p-4 bg-gray-50"><VoucherRecords /></div>
              </div>
          </div>
      )}
    </div>
  );
}
