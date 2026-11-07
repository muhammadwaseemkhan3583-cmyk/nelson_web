"use client";

import { useState, useEffect, useRef } from "react";
import { authenticatedFetch } from "@/lib/utils";
import { getCachedData, setCachedData } from "@/lib/cache";

interface AddExpenseProps {
  onClose: () => void;
}

export default function AddExpense({ onClose }: AddExpenseProps) {
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [entryType, setEntryType] = useState<"Petty Cash" | "Cash Voucher">("Petty Cash");
  
  // Pre-load from memory / sessionStorage cache if available (0ms instant render)
  const cachedOptions = typeof window !== "undefined" 
    ? getCachedData<{ depts: string[]; cats: string[]; names: string[]; vendors: string[] }>("expense_options")
    : null;
  const cachedServerDate = typeof window !== "undefined"
    ? getCachedData<string>("server_date")
    : null;

  // Lists for dropdowns
  const [availableDepts, setAvailableDepts] = useState<string[]>(() => cachedOptions?.depts || []);
  const [availableCats, setAvailableCats] = useState<string[]>(() => cachedOptions?.cats || []);
  const [availableNames, setAvailableNames] = useState<string[]>(() => cachedOptions?.names || []);
  const [availableVendors, setAvailableVendors] = useState<string[]>(() => cachedOptions?.vendors || []);
  const [serverDate, setServerDate] = useState<string>(() => cachedServerDate || "");

  const getTodayFormatted = () => {
    if (serverDate) return serverDate;
    if (cachedServerDate) return cachedServerDate;
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const emptyPettyRow = (customDate?: string) => ({ id: Date.now() + Math.random(), date: customDate || getTodayFormatted(), category: "", department: "", empCode: "", empName: "", numPersons: "", numDays: "", amount: "", remarks: "" });
  const emptyCashRow = (customDate?: string) => ({ id: Date.now() + Math.random(), date: customDate || getTodayFormatted(), department: "", description: "", vendorName: "", concernPerson: "", billOfMonth: "", amount: "", remarks: "" });

  const [expenseRows, setExpenseRows] = useState<any[]>(() => [
    entryType === "Petty Cash" ? emptyPettyRow(cachedServerDate || undefined) : emptyCashRow(cachedServerDate || undefined)
  ]);

  useEffect(() => {
    setMounted(true);

    const initData = async () => {
      // 1. Silent background fetch server date
      try {
        const timeRes = await authenticatedFetch("/api/utils/server-time");
        const timeData = await timeRes.json();
        if (timeData.success && timeData.serverDate) {
          setServerDate(timeData.serverDate);
          setCachedData("server_date", timeData.serverDate);
        }
      } catch (e) {
        // keep fallback date
      }

      // 2. Silent background fetch dropdown options
      fetchExistingOptions();
    };

    initData();
  }, []); // Run ONCE on mount, NOT on entryType toggle!

  const handleEntryTypeChange = (newType: "Petty Cash" | "Cash Voucher") => {
    setEntryType(newType);
    const isFirstRowEmpty = expenseRows.length === 1 && 
      !expenseRows[0].amount && 
      (entryType === "Petty Cash" ? !expenseRows[0].category : !expenseRows[0].description);
    
    if (isFirstRowEmpty) {
      setExpenseRows([newType === "Petty Cash" ? emptyPettyRow(serverDate) : emptyCashRow(serverDate)]);
    }
  };

  const fetchExistingOptions = async () => {
    try {
        const response = await authenticatedFetch("/api/expenses/list?timeframe=all");
        const result = await response.json();
        if (result.success) {
            const depts = Array.from(new Set(result.expenses.map((e: any) => (e.department || "").trim().toUpperCase()).filter(Boolean))) as string[];
            const cats = Array.from(new Set(result.expenses.map((e: any) => (e.category || "").trim().toUpperCase()).filter(Boolean))) as string[];
            const names = Array.from(new Set(result.expenses.map((e: any) => (e.empName || "").trim().toUpperCase()).filter(Boolean))) as string[];
            const vendors = Array.from(new Set(result.expenses.map((e: any) => (e.vendorName || "").trim().toUpperCase()).filter(Boolean))) as string[];
            const sortedDepts = depts.sort();
            const sortedCats = cats.sort();
            const sortedNames = names.sort();
            const sortedVendors = vendors.sort();

            setAvailableDepts(sortedDepts);
            setAvailableCats(sortedCats);
            setAvailableNames(sortedNames);
            setAvailableVendors(sortedVendors);

            setCachedData("expense_options", {
              depts: sortedDepts,
              cats: sortedCats,
              names: sortedNames,
              vendors: sortedVendors
            });
        }
    } catch (err) {
        console.error("Error fetching options:", err);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;

    const parseDateForInput = (dateStr: string) => {
        if (!dateStr) return getTodayFormatted();
        
        const parts = dateStr.split(/[\/\-]/);
        if (parts.length === 3) {
            let day, month, year;
            if (parts[0].length === 4) { // YYYY/MM/DD or YYYY-MM-DD
                [year, month, day] = parts;
            } else { // DD/MM/YYYY
                [day, month, year] = parts;
            }
            return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
        }
        return dateStr;
    };

    const rows = pasteData.split(/\r?\n/).filter(row => row.trim() !== '');
    const newPastedRows = rows.map((rowStr, index) => {
        const columns = rowStr.split('\t').map(c => c.trim());
        if (entryType === "Petty Cash") {
            return {
                id: Date.now() + index + Math.random(),
                date: parseDateForInput(columns[0]),
                category: (columns[1] || "").toUpperCase(),
                department: (columns[2] || "").toUpperCase(),
                empCode: columns[3] || "",
                empName: (columns[4] || "").toUpperCase(),
                numPersons: columns[5] || "",
                numDays: columns[6] || "",
                amount: columns[7] || "",
                remarks: columns[8] || ""
            };
        } else {
            return {
                id: Date.now() + index + Math.random(),
                date: parseDateForInput(columns[0]),
                department: (columns[1] || "").toUpperCase(),
                description: columns[2] || "",
                vendorName: (columns[3] || "").toUpperCase(),
                concernPerson: (columns[4] || "").toUpperCase(),
                billOfMonth: columns[5] || "",
                amount: columns[6] || "",
                remarks: columns[7] || ""
            };
        }
    });

    const isFirstRowEmpty = expenseRows.length === 1 && 
        (entryType === "Petty Cash" ? !expenseRows[0].category : !expenseRows[0].description) && 
        !expenseRows[0].amount;

    if (isFirstRowEmpty) {
        setExpenseRows(newPastedRows);
    } else {
        setExpenseRows([...expenseRows, ...newPastedRows]);
    }
  };

  const pendingFocusRef = useRef<{ row: number; col: number } | null>(null);

  const focusCell = (rowIndex: number, colIndex: number) => {
    const cell = document.querySelector<HTMLInputElement>(
      `input[data-row="${rowIndex}"][data-col="${colIndex}"]`
    );
    if (cell) {
      cell.focus();
      cell.select();
      cell.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  };

  useEffect(() => {
    if (pendingFocusRef.current) {
      const { row, col } = pendingFocusRef.current;
      pendingFocusRef.current = null;
      setTimeout(() => {
        focusCell(row, col);
      }, 50);
    }
  }, [expenseRows]);

  const handleCellChange = (id: number, field: string, value: string) => {
    setExpenseRows(expenseRows.map((row: any) => row.id === id ? { ...row, [field]: value } : row));
  };

  const addNewRow = (focusNewRow = false) => {
    if (focusNewRow) {
      pendingFocusRef.current = { row: expenseRows.length, col: 0 };
    }
    setExpenseRows((prev) => [...prev, entryType === "Petty Cash" ? emptyPettyRow() : emptyCashRow()]);
  };

  const removeRow = (id: number) => {
    if (expenseRows.length > 1) {
      setExpenseRows(expenseRows.filter((row: any) => row.id !== id));
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    if (e.ctrlKey || e.metaKey) return;

    const maxCols = entryType === "Petty Cash" ? 9 : 8;
    const input = e.currentTarget;

    const isCaretAtStart = () => {
      try {
        if (input.type === "number") return true;
        const { selectionStart, selectionEnd, value } = input;
        if (selectionStart === 0 && selectionEnd === value.length) return true;
        return selectionStart === 0;
      } catch {
        return true;
      }
    };

    const isCaretAtEnd = () => {
      try {
        if (input.type === "number") return true;
        const { selectionStart, selectionEnd, value } = input;
        if (selectionStart === 0 && selectionEnd === value.length) return true;
        return selectionEnd === value.length;
      } catch {
        return true;
      }
    };

    if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey && colIndex === maxCols - 1 && rowIndex === expenseRows.length - 1)) {
      e.preventDefault();
      if (e.shiftKey && e.key === "Enter") {
        if (colIndex > 0) {
          focusCell(rowIndex, colIndex - 1);
        } else if (rowIndex > 0) {
          focusCell(rowIndex - 1, maxCols - 1);
        }
      } else {
        if (colIndex < maxCols - 1) {
          focusCell(rowIndex, colIndex + 1);
        } else {
          if (rowIndex < expenseRows.length - 1) {
            focusCell(rowIndex + 1, 0);
          } else {
            addNewRow(true);
          }
        }
      }
    } else if (e.key === "ArrowRight") {
      if (isCaretAtEnd()) {
        if (colIndex < maxCols - 1) {
          e.preventDefault();
          focusCell(rowIndex, colIndex + 1);
        } else if (rowIndex < expenseRows.length - 1) {
          e.preventDefault();
          focusCell(rowIndex + 1, 0);
        }
      }
    } else if (e.key === "ArrowLeft") {
      if (isCaretAtStart()) {
        if (colIndex > 0) {
          e.preventDefault();
          focusCell(rowIndex, colIndex - 1);
        } else if (rowIndex > 0) {
          e.preventDefault();
          focusCell(rowIndex - 1, maxCols - 1);
        }
      }
    } else if (e.key === "ArrowDown") {
      if (!e.altKey) {
        if (rowIndex < expenseRows.length - 1) {
          e.preventDefault();
          focusCell(rowIndex + 1, colIndex);
        }
      }
    } else if (e.key === "ArrowUp") {
      if (!e.altKey) {
        if (rowIndex > 0) {
          e.preventDefault();
          focusCell(rowIndex - 1, colIndex);
        }
      }
    }
  };

  const handleSaveToDatabase = async () => {
    const hasData = expenseRows.some((r: any) => (entryType === "Petty Cash" ? r.category : r.description) && r.amount);
    if (!hasData) {
        alert("Please enter data before saving.");
        return;
    }

    // Helper to convert DD/MM/YYYY to ISO for DB
    const convertToDBDate = (str: string) => {
        const parts = str.split(/[\/\-]/);
        if (parts.length === 3) {
            const [d, m, y] = parts;
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        return str;
    };

    setIsSaving(true);
    try {
      const response = await authenticatedFetch("/api/expenses/save", {
        method: "POST",
        body: JSON.stringify({ 
            expenses: expenseRows.map((r: any) => ({ 
                ...r, 
                date: convertToDBDate(r.date),
                type: entryType 
            })) 
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setExpenseRows([entryType === "Petty Cash" ? emptyPettyRow() : emptyCashRow()]);

        // Broadcast to other tabs to refresh in background
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("expenses-updated"));
        }

        // Silent background update of dropdown options
        fetchExistingOptions();
      } else {
        alert("Error: " + result.message);
      }
    } catch (err) {
      alert("Database Connection Error.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
        className="flex flex-col h-full animate-fadeIn w-[95vw] mx-auto overflow-hidden"
        onPaste={handlePaste}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[75vh] w-full">
        
        {/* Card Header with Type Toggle & Dynamic Adders */}
        <div className="bg-gray-900 px-6 py-3 flex flex-wrap justify-between items-center text-white gap-4">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-orange-600 rounded-full"></div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-white">Entry Sheet</h2>
                </div>
                
                <select 
                    value={entryType} 
                    onChange={(e) => handleEntryTypeChange(e.target.value as any)}
                    className="bg-orange-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-none border border-orange-500 focus:ring-2 focus:ring-white outline-none cursor-pointer shadow-lg"
                >
                    <option value="Petty Cash">Petty Cash Entry</option>
                    <option value="Cash Voucher">Cash Voucher Entry</option>
                </select>
            </div>
        </div>

        {/* DataLists for Dropdowns (Suggestions from DB) */}
        <datalist id="dept-list">
            {availableDepts.map(d => <option key={d} value={d} />)}
        </datalist>
        <datalist id="cat-list">
            {availableCats.map(c => <option key={c} value={c} />)}
        </datalist>
        <datalist id="name-list">
            {availableNames.map(n => <option key={n} value={n} />)}
        </datalist>
        <datalist id="vendor-list">
            {availableVendors.map(v => <option key={v} value={v} />)}
        </datalist>

        {/* Data Entry Grid */}
        <div className="flex-grow overflow-auto bg-gray-100 p-px custom-scrollbar">
          <div className="min-w-max text-gray-900">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 text-gray-600">
                <tr className="bg-gray-200 uppercase text-[9px] font-black">
                  <th className="w-8 border border-gray-300 py-2 text-center">#</th>
                  <th className="w-32 border border-gray-300 py-2 text-left px-3">Date</th>
                  
                  {entryType === "Petty Cash" ? (
                    <>
                        <th className="w-40 border border-gray-300 py-2 text-left px-3">Category</th>
                        <th className="w-40 border border-gray-300 py-2 text-left px-3">Department</th>
                        <th className="w-24 border border-gray-300 py-2 text-center">Code</th>
                        <th className="w-48 border border-gray-300 py-2 text-left px-3">Employee Name</th>
                        <th className="w-16 border border-gray-300 py-2 text-center">Prs</th>
                        <th className="w-16 border border-gray-300 py-2 text-center">Days</th>
                    </>
                  ) : (
                    <>
                        <th className="w-40 border border-gray-300 py-2 text-left px-3">Department</th>
                        <th className="w-64 border border-gray-300 py-2 text-left px-3">Description</th>
                        <th className="w-48 border border-gray-300 py-2 text-left px-3">Vendor Name</th>
                        <th className="w-48 border border-gray-300 py-2 text-left px-3">Concern Person</th>
                        <th className="w-32 border border-gray-300 py-2 text-left px-3">Bill Month</th>
                    </>
                  )}
                  
                  <th className="w-32 border border-gray-300 py-2 text-right px-3">Amount</th>
                  <th className="border border-gray-300 py-2 text-left px-3">Remarks</th>
                  <th className="w-10 border border-gray-300 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {expenseRows.map((row: any, index: number) => {
                  const amountCol = entryType === "Petty Cash" ? 7 : 6;
                  const remarksCol = entryType === "Petty Cash" ? 8 : 7;

                  return (
                    <tr key={row.id} className="hover:bg-blue-50 transition-colors group">
                      <td className="border border-gray-200 text-center text-[10px] font-bold text-gray-400 bg-gray-50">{index + 1}</td>
                      <td className="border border-gray-200">
                        <input 
                          data-row={index}
                          data-col={0}
                          onKeyDown={(e) => handleKeyDown(e, index, 0)}
                          type="text" 
                          value={row.date} 
                          onChange={(e) => handleCellChange(row.id, 'date', e.target.value)} 
                          placeholder="DD/MM/YYYY" 
                          className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none font-bold bg-transparent text-gray-900" 
                        />
                      </td>

                      {entryType === "Petty Cash" ? (
                          <>
                              <td className="border border-gray-200">
                                  <input 
                                      list="cat-list"
                                      data-row={index}
                                      data-col={1}
                                      onKeyDown={(e) => handleKeyDown(e, index, 1)}
                                      type="text"
                                      value={row.category || ""} 
                                      onChange={(e) => handleCellChange(row.id, 'category', e.target.value.toUpperCase())} 
                                      placeholder="Category"
                                      className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none font-bold text-gray-900 bg-transparent"
                                  />
                              </td>
                              <td className="border border-gray-200">
                                  <input 
                                      list="dept-list"
                                      data-row={index}
                                      data-col={2}
                                      onKeyDown={(e) => handleKeyDown(e, index, 2)}
                                      type="text"
                                      value={row.department || ""} 
                                      onChange={(e) => handleCellChange(row.id, 'department', e.target.value.toUpperCase())} 
                                      placeholder="Dept"
                                      className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none text-gray-900 bg-transparent font-bold"
                                  />
                              </td>
                              <td className="border border-gray-200">
                                  <input 
                                      data-row={index}
                                      data-col={3}
                                      onKeyDown={(e) => handleKeyDown(e, index, 3)}
                                      type="text" 
                                      value={row.empCode || ""} 
                                      onChange={(e) => handleCellChange(row.id, 'empCode', e.target.value)} 
                                      placeholder="Code" 
                                      className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none text-center text-gray-900" 
                                  />
                              </td>
                              <td className="border border-gray-200">
                                  <input 
                                      list="name-list"
                                      data-row={index}
                                      data-col={4}
                                      onKeyDown={(e) => handleKeyDown(e, index, 4)}
                                      type="text"
                                      value={row.empName || ""} 
                                      onChange={(e) => handleCellChange(row.id, 'empName', e.target.value.toUpperCase())} 
                                      placeholder="Name"
                                      className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none uppercase font-medium text-gray-900 bg-transparent"
                                  />
                              </td>
                              <td className="border border-gray-200">
                                  <input 
                                      data-row={index}
                                      data-col={5}
                                      onKeyDown={(e) => handleKeyDown(e, index, 5)}
                                      type="number" 
                                      value={row.numPersons || ""} 
                                      onChange={(e) => handleCellChange(row.id, 'numPersons', e.target.value)} 
                                      placeholder="0" 
                                      className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none text-center text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                  />
                              </td>
                              <td className="border border-gray-200">
                                  <input 
                                      data-row={index}
                                      data-col={6}
                                      onKeyDown={(e) => handleKeyDown(e, index, 6)}
                                      type="number" 
                                      value={row.numDays || ""} 
                                      onChange={(e) => handleCellChange(row.id, 'numDays', e.target.value)} 
                                      placeholder="0" 
                                      className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none text-center text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                  />
                              </td>
                          </>
                      ) : (
                          <>
                              <td className="border border-gray-200">
                                  <input 
                                      list="dept-list"
                                      data-row={index}
                                      data-col={1}
                                      onKeyDown={(e) => handleKeyDown(e, index, 1)}
                                      type="text"
                                      value={row.department || ""} 
                                      onChange={(e) => handleCellChange(row.id, 'department', e.target.value.toUpperCase())} 
                                      placeholder="Department"
                                      className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none text-gray-900 bg-transparent font-bold"
                                  />
                              </td>
                              <td className="border border-gray-200">
                                  <input 
                                      data-row={index}
                                      data-col={2}
                                      onKeyDown={(e) => handleKeyDown(e, index, 2)}
                                      type="text" 
                                      value={row.description || ""} 
                                      onChange={(e) => handleCellChange(row.id, 'description', e.target.value)} 
                                      placeholder="Description" 
                                      className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none font-bold text-gray-900" 
                                  />
                              </td>
                              <td className="border border-gray-200">
                                  <input 
                                      list="vendor-list"
                                      data-row={index}
                                      data-col={3}
                                      onKeyDown={(e) => handleKeyDown(e, index, 3)}
                                      type="text" 
                                      value={row.vendorName || ""} 
                                      onChange={(e) => handleCellChange(row.id, 'vendorName', e.target.value.toUpperCase())} 
                                      placeholder="Vendor Name" 
                                      className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none uppercase font-medium text-gray-900 bg-transparent" 
                                  />
                              </td>
                              <td className="border border-gray-200">
                                  <input 
                                      data-row={index}
                                      data-col={4}
                                      onKeyDown={(e) => handleKeyDown(e, index, 4)}
                                      type="text" 
                                      value={row.concernPerson || ""} 
                                      onChange={(e) => handleCellChange(row.id, 'concernPerson', e.target.value)} 
                                      placeholder="Concern Person" 
                                      className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none text-gray-900" 
                                  />
                              </td>
                              <td className="border border-gray-200">
                                  <input 
                                      data-row={index}
                                      data-col={5}
                                      onKeyDown={(e) => handleKeyDown(e, index, 5)}
                                      type="text" 
                                      value={row.billOfMonth || ""} 
                                      onChange={(e) => handleCellChange(row.id, 'billOfMonth', e.target.value)} 
                                      placeholder="e.g. Feb 2026" 
                                      className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none text-gray-900" 
                                  />
                              </td>
                          </>
                      )}

                      <td className="border border-gray-200">
                        <input 
                          data-row={index}
                          data-col={amountCol}
                          onKeyDown={(e) => handleKeyDown(e, index, amountCol)}
                          type="number" 
                          value={row.amount || ""} 
                          onChange={(e) => handleCellChange(row.id, 'amount', e.target.value)} 
                          placeholder="0.00" 
                          className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none text-right font-black text-blue-700 bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        />
                      </td>
                      <td className="border border-gray-200">
                        <input 
                          data-row={index}
                          data-col={remarksCol}
                          onKeyDown={(e) => handleKeyDown(e, index, remarksCol)}
                          type="text" 
                          value={row.remarks || ""} 
                          onChange={(e) => handleCellChange(row.id, 'remarks', e.target.value)} 
                          placeholder="..." 
                          className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none bg-transparent text-gray-900" 
                        />
                      </td>
                      <td className="border border-gray-200 text-center">
                        <button 
                          tabIndex={-1}
                          onClick={() => removeRow(row.id)} 
                          className="text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-between items-center text-gray-900">
            <button onClick={() => addNewRow(true)} disabled={isSaving} className="flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest disabled:opacity-50">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-center"><svg className="w-4 h-4 text-center" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg></div>
                Insert New Row
            </button>
            <div className="flex gap-4">
                <button onClick={handleSaveToDatabase} disabled={isSaving} className={`px-10 py-2.5 text-white font-black text-xs rounded-lg shadow-xl transition-all flex items-center gap-3 uppercase tracking-[0.2em] ${isSaving ? 'bg-gray-400 cursor-wait' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-100'}`}>
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}