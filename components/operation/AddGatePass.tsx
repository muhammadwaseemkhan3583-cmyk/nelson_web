"use client";

import { useState, useEffect } from "react";
import { authenticatedFetch } from "@/lib/utils";
import GatePassPrint from "@/components/security/GatePassPrint";

interface AddGatePassProps {
  onSuccess: () => void;
  userData?: any;
}

export default function AddGatePass({ onSuccess, userData }: AddGatePassProps) {
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [passType, setPassType] = useState<"Returnable" | "Non-Returnable" | "Outdoor">("Returnable");
  const [savedPass, setSavedPass] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  const [serverDate, setServerDate] = useState("");
  const [suggestions, setSuggestions] = useState({
      places: [], authPersons: [], purposes: [], departments: [], carriers: []
  });

  const getTodayFormatted = () => {
    if (serverDate) return serverDate;
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getNextDayFormatted = () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const [header, setHeader] = useState({
    date: "",
    purpose: "",
    toPlace: "",
    authorizedBy: userData?.name || "",
    department: userData?.department || userData?.role || "",
    carrierName: "",
    vehicleNumber: "",
    remarks: "",
    destination: "",
    expectedReturnDate: getNextDayFormatted(),
    // Outdoor specific
    employeeName: "",
    employeeId: "",
    employeeDesignation: "",
    outTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  });

  const [items, setItems] = useState([{ id: Date.now(), item: "", qty: "1" }]);

  useEffect(() => {
    const initData = async () => {
        setMounted(true);
        try {
            const timeRes = await authenticatedFetch("/api/utils/server-time");
            const timeData = await timeRes.json();
            if (timeData.success) {
                setServerDate(timeData.serverDate);
                setHeader(prev => ({ ...prev, date: timeData.serverDate, authorizedBy: userData?.name || prev.authorizedBy, department: userData?.department || userData?.role || prev.department }));
            } else {
                setHeader(prev => ({ ...prev, date: getTodayFormatted(), authorizedBy: userData?.name || prev.authorizedBy, department: userData?.department || userData?.role || prev.department }));
            }

            const histRes = await authenticatedFetch(`/api/operation/gate-passes?view=personal&type=${passType}`);
            const histData = await histRes.json();
            if (histData.success) {
                setSuggestions({
                    places: Array.from(new Set(histData.passes.map((p: any) => p.toPlace || p.whereToGo))).filter(Boolean),
                    authPersons: Array.from(new Set(histData.passes.map((p: any) => p.authorizedBy))).filter(Boolean),
                    purposes: Array.from(new Set(histData.passes.map((p: any) => p.purpose))).filter(Boolean),
                    departments: Array.from(new Set(histData.passes.map((p: any) => p.department))).filter(Boolean),
                    carriers: Array.from(new Set(histData.passes.map((p: any) => p.carrierName))).filter(Boolean),
                } as any);
            }
        } catch (e) {
            setHeader(prev => ({ ...prev, date: getTodayFormatted(), authorizedBy: userData?.name || prev.authorizedBy, department: userData?.department || userData?.role || prev.department }));
        }
    };
    
    initData();
  }, [passType, userData]);

  const handleHeaderChange = (field: string, value: string) => {
    setHeader({ ...header, [field]: value });
  };

  const handleItemChange = (id: number, field: string, value: string) => {
    setItems(items.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const addNewItem = () => {
    setItems([...items, { id: Date.now(), item: "", qty: "1" }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleSaveToDatabase = async () => {
    const isOutdoor = passType === "Outdoor";
    const hasHeaderData = isOutdoor ? (header.employeeName && header.purpose) : (header.toPlace && header.purpose);
    const hasItems = isOutdoor || items.some(it => it.item.trim() !== "");

    if (!hasHeaderData || !hasItems) {
        alert("Please enter required fields (Purpose and Destination/Name).");
        return;
    }

    setIsSaving(true);
    try {
      const passData = {
          ...header,
          items: items.filter(it => it.item.trim() !== ""),
          destination: header.toPlace || (header as any).destination
      };

      const response = await authenticatedFetch("/api/operation/gate-passes/save", {
        method: "POST",
        body: JSON.stringify({ 
            passes: [passData],
            type: passType
        }),
      });

      const result = await response.json();
      if (result.success) {
        const passNum = result.message.match(/[A-Z]+-[0-9]+/)?.[0] || "GEN-REF-XXX";
        setSavedPass({ ...passData, passNumber: passNum, type: passType, status: "Issued" });
        setShowPrintModal(true);
      } else {
        alert("Error: " + result.message);
      }
    } catch (err) {
      alert("Database Connection Error.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return null;

  const labelClass = "text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block";
  const inputClass = "w-full bg-white border border-gray-300 px-3 py-2 text-[11px] font-bold focus:border-orange-600 focus:ring-1 focus:ring-orange-600 outline-none transition-all placeholder:text-gray-300";

  return (
    <div className="flex flex-col h-full animate-fadeIn w-full mx-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-300 overflow-hidden flex flex-col w-full min-h-[600px]">
        
        {/* Card Header */}
        <div className="bg-slate-900 px-8 py-8 flex flex-wrap justify-between items-center text-white gap-4 sticky top-0 z-20 border-b border-white/5">
            <div className="flex items-center gap-8">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter leading-none">Gate Pass Issuance</h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">Identity & Authorization Protocol</p>
                </div>
                
                <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-white/5">
                    {["Returnable", "Non-Returnable", "Outdoor"].map((type) => (
                        <button
                            key={type}
                            onClick={() => { setPassType(type as any); setSavedPass(null); }}
                            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${passType === type ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-slate-400 hover:text-white'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>
            <div className="hidden lg:flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Secure Node Linked</span>
            </div>
        </div>

        <div className="p-6 bg-slate-50 flex flex-col gap-6">
            {/* 1. MATERIAL DETAIL (ITEMS) */}
            {passType !== "Outdoor" && (
                <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-slate-100 px-6 py-2.5 border-b-2 border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Material Items Detail</h3>
                        </div>
                        <button onClick={addNewItem} className="bg-orange-600 hover:bg-orange-700 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-md shadow-sm transition-all flex items-center gap-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                            Add New Item
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest w-16 border-r border-slate-200 text-center">SR#</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Detailed Description of Materials</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest w-32 text-center border-r border-slate-200">Quantity</th>
                                    <th className="px-6 py-3 w-16 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {items.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-orange-50/30 transition-colors group">
                                        <td className="px-6 py-3 text-[10px] font-black text-slate-300 border-r border-slate-200 text-center">{index + 1}</td>
                                        <td className="px-6 py-1.5 border-r border-slate-200">
                                            <input 
                                                type="text" 
                                                value={item.item} 
                                                onChange={(e) => handleItemChange(item.id, 'item', e.target.value)} 
                                                placeholder="Enter full item description..." 
                                                className="w-full bg-transparent border-none focus:ring-0 text-[11px] font-bold text-slate-900 placeholder:text-slate-300 outline-none" 
                                            />
                                        </td>
                                        <td className="px-6 py-1.5 border-r border-slate-200">
                                            <input 
                                                type="number" 
                                                value={item.qty} 
                                                onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)} 
                                                className="w-full bg-transparent border-none focus:ring-0 text-[11px] font-mono font-black text-center text-slate-900 outline-none" 
                                            />
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <button 
                                                onClick={() => removeItem(item.id)} 
                                                className="text-slate-300 hover:text-red-600 transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                                            >
                                                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 2. LOGISTICS DETAILS GRID */}
            <div className="bg-white rounded-xl border-2 border-slate-300 shadow-md overflow-hidden">
                <div className="bg-slate-800 px-6 py-3 border-b-2 border-slate-900 flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-white">Logistics & Authorization Information</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                    <div className="p-4 bg-slate-100">
                        <label className={labelClass}>Issue Date</label>
                        <input readOnly type="text" value={header.date} className={`${inputClass} bg-slate-100 cursor-not-allowed`} />
                    </div>
                    {passType === "Outdoor" ? (
                        <>
                            <div className="p-4">
                                <label className={labelClass}>Employee Name</label>
                                <input type="text" value={header.employeeName} onChange={(e) => handleHeaderChange('employeeName', e.target.value)} placeholder="Full Name" className={inputClass} />
                            </div>
                            <div className="p-4 bg-slate-50">
                                <label className={labelClass}>Employee ID</label>
                                <input type="text" value={header.employeeId} onChange={(e) => handleHeaderChange('employeeId', e.target.value)} placeholder="EMP-XXX" className={inputClass} />
                            </div>
                            <div className="p-4">
                                <label className={labelClass}>Designation</label>
                                <input type="text" value={header.employeeDesignation} onChange={(e) => handleHeaderChange('employeeDesignation', e.target.value)} placeholder="Position" className={inputClass} />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-4">
                                <label className={labelClass}>Department</label>
                                <input readOnly type="text" value={header.department} className={`${inputClass} bg-slate-100 cursor-not-allowed`} />
                            </div>
                            <div className="p-4 bg-slate-50">
                                <label className={labelClass}>Recipient / To Place</label>
                                <input list="places" type="text" value={header.toPlace} onChange={(e) => handleHeaderChange('toPlace', e.target.value)} placeholder="Destination" className={inputClass} />
                            </div>
                            <div className="p-4">
                                <label className={labelClass}>Authorized By</label>
                                <input readOnly type="text" value={header.authorizedBy} className={`${inputClass} bg-slate-100 cursor-not-allowed`} />
                            </div>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-t border-slate-200">
                    {passType === "Outdoor" && (
                        <div className="p-4 bg-slate-50">
                            <label className={labelClass}>Department</label>
                            <input readOnly type="text" value={header.department} className={`${inputClass} bg-slate-100 cursor-not-allowed`} />
                        </div>
                    )}
                    <div className="p-4">
                        <label className={labelClass}>{passType === "Outdoor" ? "Authorized By" : "Carrier / Driver Name"}</label>
                        {passType === "Outdoor" ? (
                            <input readOnly type="text" value={header.authorizedBy} className={`${inputClass} bg-slate-100 cursor-not-allowed`} />
                        ) : (
                            <input list="carriers" type="text" value={header.carrierName} onChange={(e) => handleHeaderChange('carrierName', e.target.value)} placeholder="Who is carrying?" className={inputClass} />
                        )}
                    </div>
                    {passType !== "Outdoor" ? (
                        <>
                            <div className="p-4 bg-slate-50">
                                <label className={labelClass}>Vehicle Number</label>
                                <input type="text" value={header.vehicleNumber} onChange={(e) => handleHeaderChange('vehicleNumber', e.target.value)} placeholder="ABC-1234" className={inputClass} />
                            </div>
                            <div className="p-4">
                                <label className={labelClass}>Expected Return</label>
                                {passType === "Returnable" ? (
                                    <input type="date" value={header.expectedReturnDate} onChange={(e) => handleHeaderChange('expectedReturnDate', e.target.value)} className={`${inputClass} text-orange-600`} />
                                ) : (
                                    <div className="text-[10px] font-black text-slate-300 mt-2 uppercase">Not Applicable</div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-4 bg-slate-50">
                                <label className={labelClass}>Current Out-Time</label>
                                <input type="text" value={header.outTime} onChange={(e) => handleHeaderChange('outTime', e.target.value)} className={`${inputClass} font-mono`} />
                            </div>
                        </>
                    )}
                    <div className={`p-4 ${passType === 'Outdoor' ? 'bg-white' : 'bg-slate-50'}`}>
                        <label className={labelClass}>System Status</label>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-100 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse"></span>
                            <span className="text-[9px] font-black tracking-widest uppercase">Drafting</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 border-t border-slate-200">
                    <div className="p-4 bg-white">
                        <label className={labelClass}>Purpose of Issuance</label>
                        <input list="purposes" type="text" value={header.purpose} onChange={(e) => handleHeaderChange('purpose', e.target.value)} placeholder="Specify official reason for movement..." className={inputClass} />
                    </div>
                    <div className="p-4 bg-slate-50">
                        <label className={labelClass}>{passType === "Outdoor" ? "Personnel Destination" : "Additional Special Remarks"}</label>
                                                        <input 
                                                            type="text" 
                                                            value={(passType === "Outdoor" ? (header as any).destination : header.remarks) || ""} 
                                                            onChange={(e) => handleHeaderChange(passType === "Outdoor" ? 'destination' : 'remarks', e.target.value)} 
                                                            placeholder={passType === "Outdoor" ? "Where is staff going?" : "Any specific instructions for security check..."} 
                                                            className={inputClass} 
                                                        />                    </div>
                </div>
            </div>

            {passType === "Outdoor" && (
                 <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Personnel Official Movement</h4>
                        <p className="text-[10px] text-blue-700 font-bold mt-1 leading-relaxed">Ensure the staff member is carrying their official ID. Out-time is captured automatically but can be adjusted.</p>
                    </div>
                 </div>
            )}
        </div>

        <div className="bg-slate-900 px-8 py-5 border-t border-slate-800 flex flex-wrap justify-between items-center text-white gap-6">
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Module</span>
                    <span className="text-xs font-black text-orange-500 uppercase tracking-widest">{passType} Authorization</span>
                </div>
                <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
                <div className="hidden sm:flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Items Count</span>
                    <span className="text-xs font-black text-white uppercase tracking-widest">{passType === 'Outdoor' ? '1 Person' : `${items.filter(i => i.item).length} Materials`}</span>
                </div>
            </div>
            
            <div className="flex gap-4 w-full sm:w-auto">
                {savedPass && (
                    <button onClick={() => setShowPrintModal(true)} className="flex-1 sm:flex-none px-6 py-3 bg-slate-700 text-white font-black text-[10px] rounded-lg shadow-xl hover:bg-slate-600 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        Re-Print
                    </button>
                )}
                <button onClick={handleSaveToDatabase} disabled={isSaving} className={`flex-1 sm:flex-none px-12 py-3 text-white font-black text-[10px] rounded-lg shadow-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] ${isSaving ? 'bg-slate-600 cursor-wait' : 'bg-orange-600 hover:bg-orange-500 hover:scale-[1.02] active:scale-[0.98]'}`}>
                    {isSaving ? 'Processing...' : 'Authenticate & Issue Pass'}
                </button>
            </div>
        </div>
      </div>

      {showPrintModal && savedPass && (
          <GatePassPrint pass={savedPass} onClose={() => { setShowPrintModal(false); onSuccess(); }} />
      )}

      {/* Datalists for Suggestions */}
      <datalist id="places">{suggestions.places.map((s, i) => <option key={i} value={s} />)}</datalist>
      <datalist id="auth-persons">{suggestions.authPersons.map((s, i) => <option key={i} value={s} />)}</datalist>
      <datalist id="purposes">{suggestions.purposes.map((s, i) => <option key={i} value={s} />)}</datalist>
      <datalist id="depts">{suggestions.departments.map((s, i) => <option key={i} value={s} />)}</datalist>
      <datalist id="carriers">{suggestions.carriers.map((s, i) => <option key={i} value={s} />)}</datalist>
    </div>
  );
}
