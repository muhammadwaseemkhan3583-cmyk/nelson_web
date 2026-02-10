"use client";

import { useState, useEffect, useMemo } from "react";
import { authenticatedFetch } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

export default function ViewSheets() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [modifiedRowIds, setModifiedRowIds] = useState<Set<string>>(new Set());
  const [isSavingAll, setIsSavingAll] = useState(false);
  
  // Password Modal State
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [passError, setPassError] = useState("");

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

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch("/api/expenses/list?timeframe=all");
      const result = await response.json();
      if (result.success) {
        // Format dates to DD/MM/YYYY for the editable inputs
        const formatted = result.expenses.map((e: any) => {
            const d = new Date(e.date);
            return {
                ...e,
                displayDate: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
            };
        });
        setExpenses(formatted);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleCellChange = (id: string, field: string, value: string) => {
    const row = expenses.find(e => e.id === id);
    if (!row) return;

    setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: value } : e));
    setModifiedRowIds(prev => new Set(prev).add(id));
  };

  const handleEnableEditing = () => {
      setIsPassModalOpen(true);
      setPassError("");
      setPassword("");
  };

  const verifyPassword = async () => {
      const user = auth.currentUser;
      if (!user || !user.email) return;

      setIsVerifying(true);
      setPassError("");

      try {
          const credential = EmailAuthProvider.credential(user.email, password);
          await reauthenticateWithCredential(user, credential);
          setIsEditMode(true);
          setIsPassModalOpen(false);
      } catch (error: any) {
          setPassError("Incorrect password. Access denied.");
      } finally {
          setIsVerifying(false);
      }
  };

  const handleSaveAll = async () => {
    if (modifiedRowIds.size === 0) {
        setIsEditMode(false);
        return;
    }

    setIsSavingAll(true);
    
    const convertToDBDate = (str: string) => {
        const parts = str.split(/[\/\-]/);
        if (parts.length === 3) {
            const [d, m, y] = parts;
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        return str;
    };

    try {
        const promises = Array.from(modifiedRowIds).map(async (id) => {
            const row = expenses.find(e => e.id === id);
            const updates = {
                date: convertToDBDate(row.displayDate),
                category: row.category,
                department: row.department,
                empCode: row.empCode,
                empName: row.empName,
                numPersons: row.numPersons,
                numDays: row.numDays,
                amount: row.amount,
                remarks: row.remarks,
                description: row.description,
                vendorName: row.vendorName,
                concernPerson: row.concernPerson,
                billOfMonth: row.billOfMonth
            };

            return authenticatedFetch("/api/expenses/update", {
                method: "PUT",
                body: JSON.stringify({ id, updates })
            });
        });

        await Promise.all(promises);
        alert("All changes saved successfully.");
        setModifiedRowIds(new Set());
        setIsEditMode(false);
        fetchExpenses(); 
    } catch (error) {
        alert("Failed to save some changes.");
    } finally {
        setIsSavingAll(false);
    }
  };

  // Filter options derived from database data (Normalized for uniqueness)
  const departments = ["All", ...Array.from(new Set(expenses.map((e: any) => (e.department || "").trim().toUpperCase()).filter(Boolean)))].sort();
  const categories = ["All", ...Array.from(new Set(expenses.map((e: any) => (e.category || "").trim().toUpperCase()).filter(Boolean)))].sort();

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
      } else if (selectedTimeframe === "36h") {
        matchTime = (now.getTime() - eDate.getTime()) <= (36 * 60 * 60 * 1000);
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

      // 4. Other Filters (Normalized comparison)
      const matchType = selectedType === "All" || e.type === selectedType;
      const matchDept = selectedDept === "All" || (e.department || "").trim().toUpperCase() === selectedDept;
      const matchCat = selectedCat === "All" || (e.category || "").trim().toUpperCase() === selectedCat;

      return matchTime && matchType && matchDept && matchCat;
    });
  }, [expenses, selectedYear, selectedTimeframe, fromMonth, toMonth, selectedType, selectedDept, selectedCat, searchName]);

  const totalAmount = filteredData.reduce((s: number, r: any) => s + r.amount, 0);

  return (
    <div className="flex flex-col h-full animate-fadeIn w-full mx-auto overflow-hidden text-gray-900">
      
      {/* PROFESSIONAL COMPACT FILTER BAR */}
      <div className="bg-gray-900 px-4 py-3 rounded-t-3xl flex items-center justify-between gap-2 shadow-2xl border-b border-gray-800 flex-nowrap overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2 shrink-0 border-r border-gray-800 pr-2 mr-2">
            <div className="w-1.5 h-6 bg-orange-600 rounded-full"></div>
            <h2 className="text-[10px] font-black uppercase tracking-tighter text-white leading-none">Ledger</h2>
        </div>

        <div className="flex items-center gap-2 flex-grow min-w-0">
            <div className="shrink-0">
                <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-gray-800 border-none rounded-lg text-[9px] font-black uppercase text-white px-2 py-1.5 focus:ring-1 focus:ring-orange-600 outline-none cursor-pointer w-16">
                    {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div className="shrink-0">
                <select value={selectedTimeframe} onChange={(e) => setSelectedTimeframe(e.target.value)} className="bg-gray-800 border-none rounded-lg text-[9px] font-black uppercase text-white px-2 py-1.5 focus:ring-1 focus:ring-orange-600 outline-none cursor-pointer w-24">
                    <option value="1h">Last 1H</option>
                    <option value="36h">Last 36H</option>
                    <option value="1d">Last 24H</option>
                    <option value="15d">15 Days</option>
                    <option value="month_range">Range</option>
                    <option value="1m">1 Month</option>
                    <option value="3m">3 Months</option>
                    <option value="all">All</option>
                </select>
            </div>

            {selectedTimeframe === "month_range" && (
                <div className="flex items-center gap-1 shrink-0 bg-gray-800 rounded-lg px-1">
                    <select value={fromMonth} onChange={(e) => setFromMonth(parseInt(e.target.value))} className="bg-transparent border-none text-[9px] font-black uppercase text-white px-1 py-1.5 outline-none cursor-pointer w-10">
                        {months.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                    </select>
                    <span className="text-gray-600 text-[8px]">-</span>
                    <select value={toMonth} onChange={(e) => setToMonth(parseInt(e.target.value))} className="bg-transparent border-none text-[9px] font-black uppercase text-white px-1 py-1.5 outline-none cursor-pointer w-10">
                        {months.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                    </select>
                </div>
            )}

            <div className="shrink-0">
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="bg-gray-800 border-none rounded-lg text-[9px] font-black uppercase text-white px-2 py-1.5 focus:ring-1 focus:ring-orange-600 outline-none cursor-pointer w-20">
                    <option value="All">All Types</option>
                    <option value="Petty Cash">Petty Cash</option>
                    <option value="Cash Voucher">Cash Voucher</option>
                </select>
            </div>

            <div className="shrink-0">
                <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="bg-gray-800 border-none rounded-lg text-[9px] font-black uppercase text-white px-2 py-1.5 focus:ring-1 focus:ring-orange-600 outline-none cursor-pointer w-24">
                    <option value="All">All Dept</option>
                    {departments.filter(d => d !== "All").map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            <div className="shrink-0">
                <select value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)} className="bg-gray-800 border-none rounded-lg text-[9px] font-black uppercase text-white px-2 py-1.5 focus:ring-1 focus:ring-orange-600 outline-none cursor-pointer w-24">
                    <option value="All">All Cat</option>
                    {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="flex-grow min-w-0 max-w-[120px]">
                <input 
                    type="text" 
                    placeholder="Search name..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="w-full bg-gray-800 border-none rounded-lg text-[9px] font-bold text-white px-3 py-1.5 focus:ring-1 focus:ring-orange-600 outline-none"
                />
            </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2 border-l border-gray-800 pl-2">
            {!isEditMode ? (
                <button 
                    onClick={handleEnableEditing} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all active:scale-95 flex items-center gap-1 shadow-lg shadow-blue-900/20"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    Edit
                </button>
            ) : (
                <button 
                    onClick={handleSaveAll} 
                    disabled={isSavingAll}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all active:scale-95 flex items-center gap-1 shadow-lg shadow-green-900/20"
                >
                    {isSavingAll ? "Saving..." : "Save All"}
                </button>
            )}
            
            <button onClick={() => fetchExpenses()} className="bg-orange-600 hover:bg-orange-700 text-white p-1.5 rounded-lg transition-all active:scale-95 shadow-lg shadow-orange-900/20">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
        </div>
      </div>

      <div className="flex-grow bg-white border-x border-b border-gray-200 rounded-b-3xl overflow-hidden flex flex-col h-[65vh]">
        <div className="flex-grow overflow-auto bg-gray-50 p-px custom-scrollbar">
          <div className="min-w-max">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-200 text-gray-600 shadow-sm">
                  <th className="w-8 border border-gray-300 py-3 text-[9px] font-black uppercase text-center">#</th>
                  <th className="w-28 border border-gray-300 py-3 text-[9px] font-black uppercase text-left px-3">Date</th>
                  <th className="w-32 border border-gray-300 py-3 text-[9px] font-black uppercase text-left px-3">Category / Desc</th>
                  <th className="w-32 border border-gray-300 py-3 text-[9px] font-black uppercase text-left px-3">Department</th>
                  <th className="w-20 border border-gray-300 py-3 text-[9px] font-black uppercase text-center">Code</th>
                  <th className="w-40 border border-gray-300 py-3 text-[9px] font-black uppercase text-left px-3">Employee / Source</th>
                  <th className="w-12 border border-gray-300 py-3 text-[9px] font-black uppercase text-center">Prs</th>
                  <th className="w-12 border border-gray-300 py-3 text-[9px] font-black uppercase text-center">Days</th>
                  <th className="w-28 border border-gray-300 py-3 text-[9px] font-black uppercase text-right px-3">Amount</th>
                  <th className="border border-gray-300 py-3 text-[9px] font-black uppercase text-left px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-white text-gray-900">
                {isLoading ? (
                    <tr><td colSpan={10} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Synchronizing Live Database...</td></tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row: any, index: number) => {
                    const canEditRow = isEditMode;

                    return (
                        <tr key={row.id} className={`hover:bg-blue-50 transition-colors group border-b border-gray-100 uppercase ${modifiedRowIds.has(row.id) ? 'bg-orange-50/50' : ''}`}>
                        <td className="border-r border-gray-200 text-center text-[10px] font-bold text-gray-400 bg-gray-50/50">{index + 1}</td>
                        <td className="border-r border-gray-200 px-3">
                            {canEditRow ? (
                                <input type="text" value={row.displayDate} onChange={(e) => handleCellChange(row.id, 'displayDate', e.target.value)} className="w-full h-full py-2 text-[10px] font-bold bg-transparent border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
                            ) : (
                                <div className="flex flex-col py-2">
                                    <span className="font-bold text-[10px]">{new Date(row.date).toLocaleDateString('en-GB')}</span>
                                </div>
                            )}
                        </td>
                        <td className="border-r border-gray-200 px-3">
                            {canEditRow ? (
                                <input type="text" value={row.type === "Petty Cash" ? (row.category || "") : (row.description || "")} onChange={(e) => handleCellChange(row.id, row.type === "Petty Cash" ? 'category' : 'description', e.target.value)} className="w-full h-full py-2 text-[10px] font-black bg-transparent border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
                            ) : (
                                <span className="text-[10px] font-black">{(row.type === "Petty Cash" ? row.category : row.description) || "N/A"}</span>
                            )}
                        </td>
                        <td className="border-r border-gray-200 px-3">
                            {canEditRow ? (
                                <input type="text" value={row.department || ""} onChange={(e) => handleCellChange(row.id, 'department', e.target.value)} className="w-full h-full py-2 text-[10px] bg-transparent border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 font-bold" />
                            ) : (
                                <span className="text-[10px] text-gray-600 font-bold">{row.department}</span>
                            )}
                        </td>
                        <td className="border-r border-gray-200 px-3">
                            {canEditRow ? (
                                <input type="text" value={row.empCode || ""} onChange={(e) => handleCellChange(row.id, 'empCode', e.target.value)} className="w-full h-full py-2 text-[10px] text-center font-bold text-orange-600 bg-transparent border-none focus:ring-2 focus:ring-blue-500 outline-none" />
                            ) : (
                                <span className="block text-center text-[10px] font-bold text-orange-600">{row.empCode || "-"}</span>
                            )}
                        </td>
                        <td className="border-r border-gray-200 px-3">
                            {canEditRow ? (
                                <input type="text" value={row.type === "Petty Cash" ? (row.empName || "") : (row.vendorName || "")} onChange={(e) => handleCellChange(row.id, row.type === "Petty Cash" ? 'empName' : 'vendorName', e.target.value)} className="w-full h-full py-2 text-[10px] font-medium bg-transparent border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
                            ) : (
                                <span className="text-[10px] font-medium">{row.type === "Petty Cash" ? (row.empName || "-") : (row.vendorName || "DIRECT")}</span>
                            )}
                        </td>
                        <td className="border-r border-gray-200 px-3">
                            {canEditRow ? (
                                <input type="number" value={row.numPersons || 0} onChange={(e) => handleCellChange(row.id, 'numPersons', e.target.value)} className="w-full h-full py-2 text-[10px] text-center bg-transparent border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-600" />
                            ) : (
                                <span className="block text-center text-[10px] text-gray-600">{row.numPersons || 0}</span>
                            )}
                        </td>
                        <td className="border-r border-gray-200 px-3">
                            {canEditRow ? (
                                <input type="number" value={row.numDays || 0} onChange={(e) => handleCellChange(row.id, 'numDays', e.target.value)} className="w-full h-full py-2 text-[10px] text-center bg-transparent border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-600" />
                            ) : (
                                <span className="block text-center text-[10px] text-gray-600">{row.numDays || 0}</span>
                            )}
                        </td>
                        <td className="border-r border-gray-200 px-3">
                            {canEditRow ? (
                                <input type="number" value={row.amount || 0} onChange={(e) => handleCellChange(row.id, 'amount', e.target.value)} className="w-full h-full py-2 text-[10px] text-right font-black bg-transparent border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
                            ) : (
                                <span className="block text-right text-[10px] font-black">Rs. {row.amount.toLocaleString()}</span>
                            )}
                        </td>
                        <td className="border-r border-gray-200 px-3">
                            {canEditRow ? (
                                <input type="text" value={row.remarks || ""} onChange={(e) => handleCellChange(row.id, 'remarks', e.target.value)} className="w-full h-full py-2 text-[10px] bg-transparent border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-500 italic" />
                            ) : (
                                <span className="text-[10px] text-gray-500 italic lowercase first-letter:uppercase truncate max-w-[150px] block">{row.remarks || "-"}</span>
                            )}
                        </td>
                        </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={10} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs bg-white">No entries found for selected criteria</td></tr>
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

      {/* PASSWORD VERIFICATION MODAL */}
      {isPassModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slideUp border border-gray-100">
                  <div className="bg-gray-900 p-6 text-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/20 text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                      </div>
                      <h3 className="text-white font-black uppercase tracking-widest text-sm leading-none">Security Check</h3>
                      <p className="text-gray-500 text-[9px] font-bold uppercase mt-2 tracking-tighter">Enter your login password to enable editing</p>
                  </div>
                  
                  <div className="p-8">
                      <div className="space-y-4">
                          <div className="space-y-1">
                              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Current User Password</label>
                              <input 
                                  type="password" 
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="••••••••"
                                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-600 transition-all"
                                  onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                                  autoFocus
                              />
                          </div>
                          
                          {passError && <p className="text-red-500 text-[9px] font-black uppercase text-center animate-pulse">{passError}</p>}

                          <div className="grid grid-cols-2 gap-3 pt-2">
                              <button 
                                  onClick={() => setIsPassModalOpen(false)}
                                  className="py-3 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:bg-gray-50 transition-all"
                              >
                                  Cancel
                              </button>
                              <button 
                                  onClick={verifyPassword}
                                  disabled={isVerifying || !password}
                                  className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:shadow-none"
                              >
                                  {isVerifying ? (
                                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                  ) : "Confirm"}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
