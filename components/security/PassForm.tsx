"use client";

import { useState, useEffect } from "react";
import { authenticatedFetch } from "@/lib/utils";
import GatePassPrint from "@/components/security/GatePassPrint";

export default function PassForm({ type, issuerName, onSuccess }: { type: string, issuerName: string, onSuccess: () => void }) {
  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState({
      names: [], codes: [], depts: [], places: [], authPersons: []
  });
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [submittedPass, setSubmittedPass] = useState<any>(null); // New state for submitted pass
  const [selectedPassForPrint, setSelectedPassForPrint] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);


  const [formData, setFormData] = useState<any>({
    // Shared
    purpose: "",
    authorizedBy: "",
    
    // Material Passes (Returnable/Non-Returnable)
    items: [{ item: "", qty: 1 }],
    toPlace: "",
    officerRemarks: "",
    expectedReturnDate: "",
    
    // Outdoor Pass
    employeeName: "",
    employeeId: "",
    employeeDesignation: "",
    whereToGo: "",
    outTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
  });

  const fetchSuggestions = async () => {
    try {
      // Reusing the outdoor-passes API to get historical data for suggestions
      const response = await authenticatedFetch("/api/operation/gate-passes?view=personal&type=Outdoor");
      const result = await response.json();
      if (result.success) {
        setAllLogs(result.passes);
        setSuggestions({
            names: Array.from(new Set(result.passes.map((l: any) => l.employeeName))).sort(),
            codes: Array.from(new Set(result.passes.map((l: any) => l.employeeId))).sort(),
            depts: Array.from(new Set(result.passes.map((l: any) => l.employeeDesignation))).sort(),
            places: Array.from(new Set(result.passes.map((l: any) => l.whereToGo))).sort(),
            authPersons: Array.from(new Set(result.passes.map((l: any) => l.authorizedBy))).sort(),
        } as any);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  useEffect(() => {
      fetchSuggestions();
  }, []);

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleAddItem = () => {
    setFormData({ ...formData, items: [...formData.items, { item: "", qty: 1 }] });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) return;
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleEmployeeSelect = (name: string) => {
      const selectedUser = allLogs.find((l: any) => l.employeeName === name);
      if (selectedUser) {
          setFormData((prev: any) => ({
              ...prev,
              employeeName: name,
              employeeId: selectedUser.employeeId || "",
              employeeDesignation: selectedUser.employeeDesignation || ""
          }));
      } else {
          setFormData((prev: any) => ({ ...prev, employeeName: name }));
      }
  };

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        let payload = { ...formData, type };
  
        // Map employeeName to subject for outdoor pass, to align with API
        if (type === "Outdoor") {
            payload.subject = formData.employeeName;
        }
  
        try {
          const response = await authenticatedFetch("/api/operation/gate-passes", {
            method: "POST",
            body: JSON.stringify(payload),
          });      const result = await response.json();
      if (result.success) {
        setSubmittedPass(result.pass); // Set submitted pass
        setSelectedPassForPrint(result.pass);
        setShowPrintModal(true); // Show print modal immediately
      } else {
        alert(result.message || "Failed to issue pass.");
      }
    } catch (error) {
      alert("System error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 text-sm font-bold focus:border-orange-600 focus:bg-white outline-none transition-all placeholder:text-slate-300";
  const itemInputClass = "w-full bg-white border border-slate-200 rounded-none px-3 py-2 text-sm font-medium focus:border-blue-400 outline-none transition-all placeholder:text-slate-300";
  const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1";

    return (
      <div className="min-h-screen py-8 flex flex-col justify-between max-w-4xl mx-auto px-4">
          {!submittedPass ? (
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden animate-slideUp flex flex-col">
                  {/* Form Header */}
                  <div className="bg-slate-900 px-8 py-8 text-white flex justify-between items-center flex-shrink-0">
                      <div>
                          <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">{type} Pass</h3>
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Authorization Form v2.0</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center rotate-3 shadow-lg shadow-orange-600/20">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                      </div>
                  </div>
  
                  <div className="p-6 sm:p-10 space-y-6 flex-grow">
                      {/* Material Passes: Items & Qty */}
                      {(type === "Returnable" || type === "Non-Returnable") && (
                          <div className="space-y-6 animate-fadeIn">                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-6 bg-orange-600 rounded-full"></div>
                                        <label className="text-sm font-black uppercase tracking-tighter text-slate-900">Material Specification</label>
                                    </div>
                                    <button type="button" onClick={handleAddItem} className="flex items-center gap-2 text-orange-600 font-black text-[10px] uppercase tracking-widest bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition-all border border-orange-100 shadow-sm">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                                        Add Row
                                    </button>
                                </div>
                                <div className="flex px-1 mb-2">
                                    <div className="w-4/5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2">Item Description</div>
                                    <div className="w-1/5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2">Qty</div>
                                    <div className="w-10"></div> {/* Spacer for remove button */}
                                </div>
                                <div className="space-y-1">
                                    {formData.items.map((item: any, index: number) => (
                                        <div key={index} className="flex items-center gap-4 animate-slideDown border-b border-slate-100 py-2">
                                            <div className="w-4/5">
                                                <input 
                                                    required
                                                    type="text" 
                                                    placeholder="Description of Items..." 
                                                    value={item.item} 
                                                    onChange={(e) => handleItemChange(index, 'item', e.target.value)} 
                                                    className={itemInputClass}
                                                />
                                            </div>
                                            <div className="w-1/5 flex gap-3">
                                                <input 
                                                    required
                                                    type="number" 
                                                    placeholder="Qty" 
                                                    value={item.qty} 
                                                    onChange={(e) => handleItemChange(index, 'qty', e.target.value)} 
                                                    className={`${itemInputClass} text-center font-mono`}
                                                />
                                                {formData.items.length > 1 && (
                                                    <button type="button" onClick={() => handleRemoveItem(index)} className="p-3.5 bg-red-50 text-red-500 rounded-none hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm w-10 flex-shrink-0">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
    
                        {/* Outdoor Pass: Employee Details */}
                        {type === "Outdoor" && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                                    <label className="text-sm font-black uppercase tracking-tighter text-slate-900">Personnel Information</label>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className={labelClass}>Staff Full Name</label>
                                        <input list="history-names" required name="employeeName" value={formData.employeeName} onChange={(e) => handleEmployeeSelect(e.target.value)} className={inputClass} placeholder="Select or type name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelClass}>Employee ID Code</label>
                                        <input list="history-codes" required name="employeeId" value={formData.employeeId} onChange={handleInputChange} className={`${inputClass} font-mono uppercase`} placeholder="EMP-XXX" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelClass}>Job Designation</label>
                                        <input list="history-depts" required name="employeeDesignation" value={formData.employeeDesignation} onChange={handleInputChange} className={inputClass} placeholder="Position Title" />
                                    </div>
                                </div>
                            </div>
                        )}
    
                        {/* Logistics Info */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-6 bg-slate-800 rounded-full"></div>
                                <label className="text-sm font-black uppercase tracking-tighter text-slate-900">Logistics & Authorization</label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className={labelClass}>Official Purpose</label>
                                    <input required name="purpose" value={formData.purpose} onChange={handleInputChange} className={inputClass} placeholder="Reason for movement" />
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>{type === 'Outdoor' ? 'Destination' : 'To Place (Recipient)'}</label>
                                    <input list="history-places" required name={type === 'Outdoor' ? 'whereToGo' : 'toPlace'} value={type === 'Outdoor' ? formData.whereToGo : formData.toPlace} onChange={handleInputChange} className={inputClass} placeholder="Target location" />
                                </div>
                            </div>
    
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className={labelClass}>Authorized By</label>
                                    <input list="history-auth" required name="authorizedBy" value={formData.authorizedBy} onChange={handleInputChange} className={inputClass} placeholder="Approving Authority Name" />
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>{type === 'Outdoor' ? 'Current Out-Time' : 'Officer Remarks'}</label>
                                    {type === 'Outdoor' ? (
                                        <input required name="outTime" value={formData.outTime} onChange={handleInputChange} className={`${inputClass} font-mono`} />
                                    ) : (
                                        <input name="officerRemarks" value={formData.officerRemarks} onChange={handleInputChange} className={inputClass} placeholder="Additional instructions..." />
                                    )}
                                </div>
                            </div>
                        </div>
    
                        {/* Additional Info for Returnable */}
                        {type === "Returnable" && (
                            <div className="pt-6 border-t border-slate-100 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] ml-1">Expected Return Date</label>
                                        <input required type="date" name="expectedReturnDate" value={formData.expectedReturnDate} onChange={handleInputChange} className={`${inputClass} text-orange-600 font-bold border-orange-100`} />
                                    </div>
                                    <div className="flex items-center px-6 text-[10px] font-bold text-slate-400 italic">
                                        Note: This pass requires mandatory security verification upon return of materials.
                                    </div>
                                </div>
                            </div>
                        )}
    
                        <div className="pt-8">
                            <button 
                                type="submit" 
                                disabled={isSaving} 
                                className="w-full bg-slate-900 hover:bg-orange-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs shadow-2xl shadow-slate-200 transition-all active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-4"
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                        Authenticate & Dispatch
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
    
                    {/* Datalists for Suggestions */}
                    <datalist id="history-names">{suggestions.names.map((n, i) => <option key={i} value={n} />)}</datalist>
                    <datalist id="history-codes">{suggestions.codes.map((n, i) => <option key={i} value={n} />)}</datalist>
                    <datalist id="history-depts">{suggestions.depts.map((n, i) => <option key={i} value={n} />)}</datalist>
                    <datalist id="history-places">{suggestions.places.map((n, i) => <option key={i} value={n} />)}</datalist>
                    <datalist id="history-auth">{suggestions.authPersons.map((n, i) => <option key={i} value={n} />)}</datalist>
                            </form>
                                ) : (
                                    <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/50 p-6 sm:p-10 animate-slideUp flex flex-col flex-grow h-[95vh] overflow-y-auto">
                                        <div className="flex justify-between items-center mb-6 border-b pb-4 flex-shrink-0">
                                            <h3 className="text-2xl font-black uppercase tracking-tighter leading-none text-slate-900">
                                                {type} Pass <span className="text-orange-600">Issued!</span>
                                            </h3>                                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center rotate-3 shadow-lg shadow-emerald-600/20">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                </div>
                
                                <div className="space-y-4 mb-8">
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Pass Details</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pass Number</p>
                                            <p className="text-sm font-bold text-slate-900">{submittedPass.passNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pass Type</p>
                                            <p className="text-sm font-bold text-slate-900">{type}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Issued</p>
                                            <p className="text-sm font-bold text-slate-900">{new Date(submittedPass.date).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized By</p>
                                            <p className="text-sm font-bold text-slate-900">{submittedPass.authorizedBy}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purpose</p>
                                            <p className="text-sm font-bold text-slate-900">{submittedPass.purpose}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{type === 'Outdoor' ? 'Destination' : 'To Place'}</p>
                                            <p className="text-sm font-bold text-slate-900">{submittedPass.whereToGo || submittedPass.toPlace}</p>
                                        </div>
                                        {type === "Returnable" && (
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Return Date</p>
                                                <p className="text-sm font-bold text-slate-900">{new Date(submittedPass.expectedReturnDate).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                        {type === "Outdoor" && (
                                            <>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Name</p>
                                                    <p className="text-sm font-bold text-slate-900">{submittedPass.employeeName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID</p>
                                                    <p className="text-sm font-bold text-slate-900">{submittedPass.employeeId}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation</p>
                                                    <p className="text-sm font-bold text-slate-900">{submittedPass.employeeDesignation}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Out Time</p>
                                                    <p className="text-sm font-bold text-slate-900">{submittedPass.outTime}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                
                                {(type === "Returnable" || type === "Non-Returnable") && (
                                    <div className="space-y-4 mb-8">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Items</p>
                                        <div className="border border-slate-200 rounded-md overflow-hidden">
                                            <div className="flex bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest px-4 py-2">
                                                <div className="w-3/4">Item</div>
                                                <div className="w-1/4 text-right">Qty</div>
                                            </div>
                                            {submittedPass.items && submittedPass.items.map((item: any, index: number) => (
                                                <div key={index} className="flex border-t border-slate-100 px-4 py-2">
                                                    <div className="w-3/4 text-sm text-slate-800">{item.item}</div>
                                                    <div className="w-1/4 text-right text-sm text-slate-800 font-mono">{item.qty}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                
                                <div className="pt-8 mt-auto flex gap-4">
                                    <button 
                                        onClick={() => setShowPrintModal(true)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-4"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                        Print Pass
                                    </button>
                                    <button 
                                        onClick={() => { setSubmittedPass(null); setSelectedPassForPrint(null); setShowPrintModal(false); onSuccess(); }}
                                        className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-slate-50 transition-all active:scale-[0.98] flex items-center justify-center gap-4"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                        Create New Pass
                                    </button>
                                </div>
                                        </div>
                                    )}
                                    {showPrintModal && selectedPassForPrint && (
                                        <GatePassPrint 
                                            pass={{ ...selectedPassForPrint, type: type }} 
                                            onClose={() => { 
                                                setSelectedPassForPrint(null); 
                                                setShowPrintModal(false); 
                                                // Do not reset submittedPass here, allow user to stay on receipt view
                                                // unless "Create New Pass" is clicked.
                                            }} 
                                        />
                                    )}
                                </div>      );
    }
