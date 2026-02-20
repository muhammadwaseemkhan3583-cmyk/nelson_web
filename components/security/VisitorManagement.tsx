"use client";

import { useState, useEffect } from "react";
import { authenticatedFetch } from "@/lib/utils";

export default function VisitorManagement() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    visitorName: "",
    fromWhere: "",
    toMeet: "",
    purpose: "",
    itemsCarried: "",
    contactNumber: "",
    visitorIdNumber: "",
    remarks: ""
  });

  const fetchVisitors = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch("/api/security/visitor-passes?status=In");
      const result = await response.json();
      if (result.success) {
        setVisitors(result.visitors);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await authenticatedFetch("/api/security/visitor-passes", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        setFormData({ visitorName: "", fromWhere: "", toMeet: "", purpose: "", itemsCarried: "", contactNumber: "", visitorIdNumber: "", remarks: "" });
        setShowAddForm(false);
        fetchVisitors();
      } else {
        alert("Server Error: " + (result.message || "Failed to record visitor."));
      }
    } catch (e: any) {
      alert("Network Error: " + (e.message || "Failed to connect to server."));
    } finally {
      setIsSaving(false);
    }
  };

  const markOut = async (id: string) => {
    if (!confirm("Confirm Visitor Departure (OUT)?")) return;
    try {
      const response = await authenticatedFetch("/api/security/visitor-passes", {
        method: "PUT",
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (result.success) {
        fetchVisitors();
      }
    } catch (e) {
      alert("Error marking visitor out.");
    }
  };

  const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1";
  const inputClass = "w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-600 focus:bg-white outline-none transition-all placeholder:text-slate-300 text-slate-900";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 p-8 rounded-3xl text-white shadow-2xl gap-4">
        <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 rotate-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
            <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Visitor Management</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Active Entry Control</p>
            </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
            <button 
                onClick={() => setShowAddForm(true)}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                New Visitor Entry
            </button>
            <button onClick={fetchVisitors} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
        </div>
      </div>

      {/* ACTIVE VISITORS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Currently Inside Premise</span>
              <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full">{visitors.length} Visitors</span>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse uppercase">
                  <thead className="bg-white text-slate-400 border-b border-slate-100">
                      <tr>
                          <th className="px-8 py-5 text-[9px] font-black tracking-widest">Entry Time</th>
                          <th className="px-8 py-5 text-[9px] font-black tracking-widest">Visitor Name</th>
                          <th className="px-8 py-5 text-[9px] font-black tracking-widest">From / Source</th>
                          <th className="px-8 py-5 text-[9px] font-black tracking-widest">To Meet</th>
                          <th className="px-8 py-5 text-[9px] font-black tracking-widest">Items / Purpose</th>
                          <th className="px-8 py-5 text-[9px] font-black tracking-widest text-center">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {isLoading ? (
                          <tr><td colSpan={6} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs animate-pulse">Fetching Visitor Records...</td></tr>
                      ) : visitors.length > 0 ? (
                          visitors.map((v) => (
                              <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                                  <td className="px-8 py-6">
                                      <div className="flex flex-col">
                                          <span className="text-xs font-black text-slate-900">{new Date(v.inTime).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'})}</span>
                                          <span className="text-[8px] font-bold text-slate-400 mt-1">{new Date(v.date).toLocaleDateString('en-GB')}</span>
                                      </div>
                                  </td>
                                  <td className="px-8 py-6">
                                      <div className="flex flex-col">
                                          <span className="text-[11px] font-black text-slate-800">{v.visitorName}</span>
                                          <span className="text-[9px] font-bold text-slate-400">{v.contactNumber || "No Contact"}</span>
                                      </div>
                                  </td>
                                  <td className="px-8 py-6">
                                      <span className="text-[10px] font-black text-slate-600">{v.fromWhere}</span>
                                  </td>
                                  <td className="px-8 py-6">
                                      <span className="text-[10px] font-black text-blue-600">{v.toMeet}</span>
                                  </td>
                                  <td className="px-8 py-6">
                                      <div className="flex flex-col max-w-[200px]">
                                          <span className="text-[10px] font-black text-slate-700 truncate">{v.purpose}</span>
                                          <span className="text-[9px] font-medium text-slate-400 normal-case italic line-clamp-1">{v.itemsCarried || "No items"}</span>
                                      </div>
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                      <button 
                                          onClick={() => markOut(v.id)}
                                          className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border border-red-100"
                                      >
                                          Mark OUT
                                      </button>
                                  </td>
                              </tr>
                          ))
                      ) : (
                          <tr><td colSpan={6} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No visitors currently inside</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* ADD VISITOR MODAL */}
      {showAddForm && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md" onClick={() => !isSaving && setShowAddForm(false)}></div>
              <form onSubmit={handleSubmit} className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp">
                  <div className="bg-blue-600 px-10 py-10 text-white flex justify-between items-center">
                      <div>
                          <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">New Visitor Entry</h3>
                          <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">Identity & Purpose Registration</p>
                      </div>
                      <button type="button" onClick={() => setShowAddForm(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                  </div>

                  <div className="p-10 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className={labelClass}>Visitor Full Name</label>
                              <input name="visitorName" required value={formData.visitorName} onChange={handleInputChange} className={inputClass} placeholder="Enter Name" />
                          </div>
                          <div className="space-y-2">
                              <label className={labelClass}>Contact Number</label>
                              <input name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className={inputClass} placeholder="03xx-xxxxxxx" />
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className={labelClass}>Coming From (Source)</label>
                              <input name="fromWhere" required value={formData.fromWhere} onChange={handleInputChange} className={inputClass} placeholder="Company or City" />
                          </div>
                          <div className="space-y-2">
                              <label className={labelClass}>Whom To Meet</label>
                              <input name="toMeet" required value={formData.toMeet} onChange={handleInputChange} className={inputClass} placeholder="Staff Name / Dept" />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className={labelClass}>Purpose of Visit</label>
                          <input name="purpose" required value={formData.purpose} onChange={handleInputChange} className={inputClass} placeholder="e.g. Official Meeting, Delivery, etc." />
                      </div>

                      <div className="space-y-2">
                          <label className={labelClass}>Items / Equipment Carried</label>
                          <input name="itemsCarried" value={formData.itemsCarried} onChange={handleInputChange} className={inputClass} placeholder="What are they bringing in?" />
                      </div>

                      <button 
                          type="submit" 
                          disabled={isSaving}
                          className="w-full bg-slate-900 hover:bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-[0.98]"
                      >
                          {isSaving ? <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div> : "Authorize Entry & Save"}
                      </button>
                  </div>
              </form>
          </div>
      )}
    </div>
  );
}
