"use client";

import { useState, useEffect } from "react";
import { authenticatedFetch } from "@/lib/utils";

interface AddExpenseProps {
  onClose: () => void;
}

export default function AddExpense({ onClose }: AddExpenseProps) {
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [entryType, setEntryType] = useState<"Petty Cash" | "Cash Voucher">("Petty Cash");
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const emptyPettyRow = () => ({ id: Date.now(), date: new Date().toISOString().split('T')[0], category: "", department: "", empCode: "", empName: "", numPersons: "", numDays: "", amount: "", remarks: "" });
  const emptyCashRow = () => ({ id: Date.now(), date: new Date().toISOString().split('T')[0], department: "", description: "", vendorName: "", concernPerson: "", billOfMonth: "", amount: "", remarks: "" });

  const [expenseRows, setExpenseRows] = useState<any[]>([
    entryType === "Petty Cash" ? emptyPettyRow() : emptyCashRow()
  ]);

  // Reset rows when type changes
  useEffect(() => {
    setExpenseRows([entryType === "Petty Cash" ? emptyPettyRow() : emptyCashRow()]);
  }, [entryType]);

  const handleCellChange = (id: number, field: string, value: string) => {
    setExpenseRows(expenseRows.map((row: any) => row.id === id ? { ...row, [field]: value } : row));
  };

  const addNewRow = () => {
    setExpenseRows([...expenseRows, entryType === "Petty Cash" ? emptyPettyRow() : emptyCashRow()]);
  };

  const removeRow = (id: number) => {
    if (expenseRows.length > 1) {
      setExpenseRows(expenseRows.filter((row: any) => row.id !== id));
    }
  };

  const handleSaveToDatabase = async () => {
    const hasData = expenseRows.some((r: any) => (entryType === "Petty Cash" ? r.category : r.description) && r.amount);
    if (!hasData) {
        alert("Please enter data before saving.");
        return;
    }

    setIsSaving(true);
    try {
      const response = await authenticatedFetch("/api/expenses/save", {
        method: "POST",
        body: JSON.stringify({ expenses: expenseRows.map((r: any) => ({ ...r, type: entryType })) }),
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setExpenseRows([entryType === "Petty Cash" ? emptyPettyRow() : emptyCashRow()]);
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
    <div className="flex flex-col h-full animate-fadeIn w-[95vw] mx-auto overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[75vh] w-full">
        
        {/* Card Header with Type Toggle */}
        <div className="bg-gray-900 px-6 py-3 flex justify-between items-center text-white">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-orange-600 rounded-full"></div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-white">Entry Sheet</h2>
                </div>
                
                <select 
                    value={entryType} 
                    onChange={(e) => setEntryType(e.target.value as any)}
                    className="bg-orange-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-none border border-orange-500 focus:ring-2 focus:ring-white outline-none cursor-pointer shadow-lg"
                >
                    <option value="Petty Cash">Petty Cash Entry</option>
                    <option value="Cash Voucher">Cash Voucher Entry</option>
                </select>
            </div>
            
            <div className="flex items-center gap-4">
                <span className="bg-orange-600/20 text-orange-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-orange-600/30">Excel Paste Enabled</span>
            </div>
        </div>

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
                {expenseRows.map((row: any, index: number) => (
                  <tr key={row.id} className="hover:bg-blue-50 transition-colors group">
                    <td className="border border-gray-200 text-center text-[10px] font-bold text-gray-400 bg-gray-50">{index + 1}</td>
                    <td className="border border-gray-200">
                      <input type="date" value={row.date} onChange={(e) => handleCellChange(row.id, 'date', e.target.value)} className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none font-bold bg-transparent text-gray-900" />
                    </td>

                    {entryType === "Petty Cash" ? (
                        <>
                            <td className="border border-gray-200"><input type="text" value={row.category || ""} onChange={(e) => handleCellChange(row.id, 'category', e.target.value)} placeholder="..." className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900" /></td>
                            <td className="border border-gray-200"><input type="text" value={row.department || ""} onChange={(e) => handleCellChange(row.id, 'department', e.target.value)} placeholder="..." className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" /></td>
                            <td className="border border-gray-200"><input type="text" value={row.empCode || ""} onChange={(e) => handleCellChange(row.id, 'empCode', e.target.value)} placeholder="Code" className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-blue-500 outline-none text-center text-gray-900" /></td>
                            <td className="border border-gray-200"><input type="text" value={row.empName || ""} onChange={(e) => handleCellChange(row.id, 'empName', e.target.value)} placeholder="Employee Name" className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-blue-500 outline-none uppercase font-medium text-gray-900" /></td>
                            <td className="border border-gray-200"><input type="number" value={row.numPersons || ""} onChange={(e) => handleCellChange(row.id, 'numPersons', e.target.value)} placeholder="0" className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-blue-500 outline-none text-center text-gray-900" /></td>
                            <td className="border border-gray-200"><input type="number" value={row.numDays || ""} onChange={(e) => handleCellChange(row.id, 'numDays', e.target.value)} placeholder="0" className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-blue-500 outline-none text-center text-gray-900" /></td>
                        </>
                    ) : (
                        <>
                            <td className="border border-gray-200"><input type="text" value={row.department || ""} onChange={(e) => handleCellChange(row.id, 'department', e.target.value)} placeholder="Department" className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" /></td>
                            <td className="border border-gray-200"><input type="text" value={row.description || ""} onChange={(e) => handleCellChange(row.id, 'description', e.target.value)} placeholder="Description" className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900" /></td>
                            <td className="border border-gray-200"><input type="text" value={row.vendorName || ""} onChange={(e) => handleCellChange(row.id, 'vendorName', e.target.value)} placeholder="Vendor Name" className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" /></td>
                            <td className="border border-gray-200"><input type="text" value={row.concernPerson || ""} onChange={(e) => handleCellChange(row.id, 'concernPerson', e.target.value)} placeholder="Concern Person" className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" /></td>
                            <td className="border border-gray-200"><input type="text" value={row.billOfMonth || ""} onChange={(e) => handleCellChange(row.id, 'billOfMonth', e.target.value)} placeholder="e.g. Feb 2026" className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" /></td>
                        </>
                    )}

                    <td className="border border-gray-200">
                      <input type="number" value={row.amount || ""} onChange={(e) => handleCellChange(row.id, 'amount', e.target.value)} placeholder="0.00" className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none text-right font-black text-blue-700 bg-transparent" />
                    </td>
                    <td className="border border-gray-200">
                      <input type="text" value={row.remarks || ""} onChange={(e) => handleCellChange(row.id, 'remarks', e.target.value)} placeholder="..." className="w-full h-full px-2 py-2 text-xs border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none bg-transparent text-gray-900" />
                    </td>
                    <td className="border border-gray-200 text-center">
                      <button onClick={() => removeRow(row.id)} className="text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-between items-center text-gray-900">
            <button onClick={addNewRow} disabled={isSaving} className="flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest disabled:opacity-50">
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
