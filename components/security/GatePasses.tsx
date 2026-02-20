"use client";

import { useState, useEffect } from "react";
import { authenticatedFetch } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import GatePassPrint from "./GatePassPrint";

export default function GatePasses() {
  const [passes, setPasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [selectedPassForPrint, setSelectedPassForPrint] = useState<any>(null);
  
  // Security Action Modal State
  const [securityAction, setSecurityAction] = useState<{ id: string, type: string, action: string, passNumber: string } | null>(null);
  const [securityRemarks, setSecurityRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPasses = async () => {
    setIsLoading(true);
    try {
      const types = ["Returnable", "Non-Returnable", "Outdoor"];
      const fetchedPasses: any[] = [];

      for (const type of types) {
          const response = await authenticatedFetch(`/api/operation/gate-passes?view=security&type=${type}`);
          const result = await response.json();
          if (result.success) {
              fetchedPasses.push(...result.passes.map((p: any) => ({ ...p, type })));
          }
      }
      setPasses(fetchedPasses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role);
          setUserName(data.name);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAction = (id: string, type: string, action: string, passNumber: string) => {
      setSecurityAction({ id, type, action, passNumber });
      setSecurityRemarks("");
  };

  const executeSecurityAction = async () => {
      if (!securityAction) return;
      setIsProcessing(true);
      try {
          const endpoint = `/api/operation/gate-passes`;
          const response = await authenticatedFetch(endpoint, {
              method: "PUT",
              body: JSON.stringify({ 
                  id: securityAction.id, 
                  action: securityAction.action, 
                  type: securityAction.type, 
                  verifiedByName: userName, 
                  securityRemarks 
              })
          });
          const result = await response.json();
          if (result.success) {
              fetchPasses();
              setSecurityAction(null);
          } else {
              alert(result.message);
          }
      } catch (error) {
          alert(`Error performing action.`);
      } finally {
          setIsProcessing(false);
      }
  };

    return (
      <div className="space-y-6 animate-fadeIn text-slate-900 px-2 sm:px-0">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-2xl shadow-slate-200 gap-4">
              <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 rotate-3">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  </div>
                  <div>
                      <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter leading-none">Pass Verification</h2>
                      <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.3em] mt-2">Operational Integrity Protocol</p>
                  </div>
              </div>
              <button onClick={fetchPasses} className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  Refresh Active Passes
              </button>
            </div>
  
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden sm:overflow-visible">
              {/* Desktop Table View */}
              <table className="w-full text-left border-collapse min-w-[800px] hidden sm:table">
                  <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                      <tr>
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest">Identification</th>
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest">Type</th>
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest">Subject Information</th>
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest">Logistics</th>
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-center">Status</th>
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-center">Verification Controls</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 uppercase">
                      {isLoading ? (
                          <tr><td colSpan={6} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs animate-pulse">Syncing Encrypted Logs...</td></tr>
                      ) : passes.length > 0 ? (
                          passes.map((pass) => (
                              <tr key={pass.id} className="hover:bg-slate-50/50 transition-colors group">
                                  <td className="px-8 py-6 whitespace-nowrap">
                                      <div className="flex flex-col">
                                          <span className="text-xs font-black text-slate-900 tracking-tight">{pass.passNumber}</span>
                                          <span className="text-[8px] font-bold text-slate-400 mt-1">{new Date(pass.createdAt).toLocaleDateString('en-GB')}</span>
                                      </div>
                                  </td>
                                  <td className="px-8 py-6">
                                      <span className={`text-[8px] font-black px-2.5 py-1 rounded-md border shadow-sm ${
                                          pass.type === 'Returnable' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                          pass.type === 'Non-Returnable' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                          'bg-blue-50 text-blue-600 border-blue-100'
                                      }`}>
                                          {pass.type}
                                      </span>
                                  </td>
                                  <td className="px-8 py-6">
                                      <div className="flex flex-col">
                                          <span className="text-[11px] font-black text-slate-800">{pass.employeeName || pass.subject}</span>
                                          <span className="text-[9px] font-bold text-slate-400 mt-0.5">{pass.employeeId || pass.department || "General"}</span>
                                      </div>
                                  </td>
                                  <td className="px-8 py-6">
                                      <div className="flex flex-col max-w-[200px]">
                                          <span className="text-[10px] font-black text-slate-600 truncate">{pass.whereToGo || pass.toPlace}</span>
                                          <span className="text-[9px] font-medium text-slate-400 normal-case italic line-clamp-1">{pass.purpose}</span>
                                      </div>
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                      {(() => {
                                          let dotColor = "bg-slate-300";
                                          let textColor = "text-slate-500";
                                          let isLive = pass.status !== "Cleared" && pass.status !== "Returned" && pass.status !== "Completed";

                                          if (pass.status === "Issued") { dotColor = "bg-amber-500"; textColor = "text-amber-600"; }
                                          else if (pass.status === "Verified") { dotColor = "bg-blue-500"; textColor = "text-blue-600"; }
                                          else if (pass.status === "Returned" || pass.status === "Cleared" || pass.status === "Completed") { dotColor = "bg-emerald-500"; textColor = "text-emerald-600"; }

                                          return (
                                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border border-current/10 bg-slate-50/50 ${textColor}`}>
                                                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isLive ? 'animate-pulse' : ''}`}></span>
                                                  <span className="text-[9px] font-black tracking-widest">{pass.status}</span>
                                              </div>
                                          );
                                      })()}
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                      <div className="flex items-center justify-center gap-3">
                                          {(pass.status === "Issued" && userRole === 'Security') && (
                                              <button 
                                                  onClick={() => handleAction(pass.id, pass.type, "out", pass.passNumber)}
                                                  className={`${pass.type === 'Returnable' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95`}
                                              >
                                                  {pass.type === 'Returnable' ? 'Mark OUT' : 'Clear OUT'}
                                              </button>
                                          )}
                                          {pass.type === "Returnable" && pass.status === "Verified" && userRole === 'Security' && (
                                              <button 
                                                  onClick={() => handleAction(pass.id, pass.type, "in", pass.passNumber)}
                                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all active:scale-95"
                                              >
                                                  Mark IN
                                              </button>
                                          )}
                                          <button 
                                              onClick={() => setSelectedPassForPrint(pass)}
                                              className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm group"
                                              title="View / Print"
                                          >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))
                      ) : (
                          <tr><td colSpan={6} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No entries in the current verification archive</td></tr>
                      )}
                  </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="sm:hidden space-y-4 p-4">
                    {isLoading ? (
                        <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs animate-pulse">Syncing Encrypted Logs...</div>
                    ) : passes.length > 0 ? (
                        passes.map((pass) => (
                            <div key={pass.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pass No.</span>
                                        <span className="text-sm font-black text-slate-900 tracking-tight">{pass.passNumber}</span>
                                    </div>
                                    <span className={`text-[8px] font-black px-2.5 py-1 rounded-md border shadow-sm ${
                                        pass.type === 'Returnable' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                        pass.type === 'Non-Returnable' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                        'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>
                                        {pass.type}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</span>
                                        <span className="text-xs font-black text-slate-800">{pass.employeeName || pass.subject}</span>
                                        <span className="text-[9px] font-medium text-slate-400 normal-case italic line-clamp-1">{pass.employeeId || pass.department || "General"}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To Place</span>
                                        <span className="text-xs font-black text-slate-600 truncate">{pass.whereToGo || pass.toPlace}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                                    {(() => {
                                        let dotColor = "bg-slate-300";
                                        let textColor = "text-slate-500";
                                        let isLive = pass.status !== "Cleared" && pass.status !== "Returned" && pass.status !== "Completed";

                                        if (pass.status === "Issued") { dotColor = "bg-amber-500"; textColor = "text-amber-600"; }
                                        else if (pass.status === "Verified") { dotColor = "bg-blue-500"; textColor = "text-blue-600"; }
                                        else if (pass.status === "Returned" || pass.status === "Cleared" || pass.status === "Completed") { dotColor = "bg-emerald-500"; textColor = "text-emerald-600"; }

                                        return (
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border border-current/10 bg-slate-50/50 ${textColor}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isLive ? 'animate-pulse' : ''}`}></span>
                                                <span className="text-[9px] font-black tracking-widest">{pass.status}</span>
                                            </div>
                                        );
                                    })()}
                                    <button 
                                        onClick={() => setSelectedPassForPrint(pass)}
                                        className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                        title="View / Print"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                    </button>
                                </div>
                                <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                                    <div className="flex items-center justify-center gap-3 w-full">
                                        {(pass.status === "Issued" && userRole === 'Security') && (
                                            <button 
                                                onClick={() => handleAction(pass.id, pass.type, "out", pass.passNumber)}
                                                className={`${pass.type === 'Returnable' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 w-1/2`}
                                            >
                                                {pass.type === 'Returnable' ? 'Mark OUT' : 'Clear OUT'}
                                            </button>
                                        )}
                                        {pass.type === "Returnable" && pass.status === "Verified" && userRole === 'Security' && (
                                            <button 
                                                onClick={() => handleAction(pass.id, pass.type, "in", pass.passNumber)}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all active:scale-95 w-1/2"
                                            >
                                                Mark IN
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No entries in the current verification archive</div>
                    )}
              </div>
            </div>
            {selectedPassForPrint && (
                <GatePassPrint pass={selectedPassForPrint} onClose={() => setSelectedPassForPrint(null)} />
            )}

            {/* SECURITY ACTION MODAL */}
            {securityAction && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md transition-opacity" onClick={() => !isProcessing && setSecurityAction(null)}></div>
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp border border-white/20">
                        <div className={`px-10 py-10 text-white flex flex-col gap-2 relative ${securityAction.action === 'in' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Security Clearance</h3>
                                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">Final Verification Required</p>
                                </div>
                                <button onClick={() => setSecurityAction(null)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                            
                            <div className="mt-6 bg-black/10 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Pass Identifier</span>
                                <span className="text-xl font-black tracking-tight">{securityAction.passNumber}</span>
                            </div>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border-2 border-slate-100">
                                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${securityAction.action === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Standard Protocol</p>
                                    <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                                        {securityAction.action === 'out' 
                                            ? "Confirm material description and quantity. Ensure authorized person is present before clearance." 
                                            : "Inspect returned items for damage or quantity mismatch. Mark any issues in remarks below."}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Security Inspection Notes</label>
                                <textarea 
                                    value={securityRemarks}
                                    onChange={(e) => setSecurityRemarks(e.target.value)}
                                    placeholder="Enter observation notes (e.g. OK, Items Checked, etc.)"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:border-blue-600 focus:bg-white outline-none transition-all h-32 resize-none placeholder:text-slate-300"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setSecurityAction(null)}
                                    className="flex-1 py-5 bg-slate-100 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={executeSecurityAction}
                                    disabled={isProcessing}
                                    className={`flex-[2] py-5 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${isProcessing ? 'bg-slate-400 cursor-wait' : (securityAction.action === 'in' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100')}`}
                                >
                                    {isProcessing ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                            Confirm & Dispatch
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
      </div>
    );
}
