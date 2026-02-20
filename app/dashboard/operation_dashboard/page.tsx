"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { signOutUser, auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import PassForm from "@/components/security/PassForm";
import GatePassPrint from "@/components/security/GatePassPrint";
import AddGatePass from "@/components/operation/AddGatePass";
import { authenticatedFetch } from "@/lib/utils";

export default function OperationDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [passes, setPasses] = useState<any[]>([]);
  const [selectedPassForPrint, setSelectedPassForPrint] = useState<any>(null);
  
  // Advanced Filters
  const [filterType, setFilterType] = useState("All");
  const [filterTimeframe, setFilterTimeframe] = useState("24h"); // Default to 24 hours
  
  const router = useRouter();

  const fetchPasses = async () => {
      setIsLoading(true);
      try {
          const types = ["Returnable", "Non-Returnable", "Outdoor"];
          const allPasses: any[] = [];

          for (const type of types) {
              const endpoint = `/api/operation/gate-passes?view=personal&type=${type}`;
              const response = await authenticatedFetch(endpoint);
              const result = await response.json();
              if (result.success) {
                  allPasses.push(...result.passes.map((p: any) => ({ ...p, type })));
              }
          }
          
          setPasses(allPasses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (error) {
          console.error("Fetch Error:", error);
      } finally {
          setIsLoading(false);
      }
  };

  const filteredPasses = useMemo(() => {
      return passes.filter(p => {
          const pDate = new Date(p.createdAt);
          const now = new Date();
          
          // 1. Type Filter
          if (filterType !== "All" && p.type !== filterType) return false;

          // 2. Timeframe Filter
          if (filterTimeframe === "24h") {
              const diffHours = (now.getTime() - pDate.getTime()) / (1000 * 60 * 60);
              if (diffHours > 24) return false;
          }

          return true;
      });
  }, [passes, filterType, filterTimeframe]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as any;
          if (data.role !== "Operation" && data.role !== "Admin") {
              router.push("/dashboard");
              return;
          }
          setUserData(data);
          fetchPasses();
        }
      } else {
          router.push("/login");
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (isLoading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 overflow-x-hidden">
      {/* Operation Header */}
      <header className="bg-gray-900 text-white shadow-xl h-16 flex items-center justify-between px-8 sticky top-0 z-50 border-b border-gray-800">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-full hover:bg-white/10 transition-all focus:outline-none"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          
          <div className="flex items-center gap-2 select-none cursor-default">
            <span className="font-black text-xl tracking-tighter text-white uppercase">
              Admin<span className="text-orange-500 italic">Soft</span>
            </span>
            <div className="h-4 w-px bg-gray-700 mx-2 hidden sm:block"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hidden sm:block">Operation Hub</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 relative">
          <div className="hidden sm:flex flex-col items-end border-r border-gray-800 pr-4">
             <span className="text-xs font-black uppercase tracking-tight text-white">{userData?.name || "Executive"}</span>
             <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">Operations Active</span>
          </div>
          
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-all outline-none"
          >
            <div className="w-9 h-9 bg-orange-600 rounded-full border-2 border-orange-500/30 flex items-center justify-center shadow-lg">
                <span className="text-xs font-black text-white">{userData?.name ? userData.name.substring(0, 2).toUpperCase() : "..."}</span>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 animate-slideDown overflow-hidden text-gray-900">
                <div className="px-4 py-2 border-b border-gray-50 mb-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Executive ID</p>
                    <p className="text-xs font-bold text-gray-900 text-left uppercase">{userData?.code || "OP-REF-XXX"}</p>
                </div>
                <button 
                    onClick={() => signOutUser()}
                    className="w-full text-left px-4 py-2 text-xs font-black text-red-500 hover:bg-red-50 transition-colors flex items-center gap-3 uppercase tracking-widest"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Logout System
                </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 relative">
        <aside 
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-gray-300 transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } pt-20 shadow-2xl flex flex-col border-r border-gray-800`}
        >
          <div className="px-6 py-4 flex-grow">
             <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Operations Modules</h3>
             <nav className="space-y-2">
               <button 
                  onClick={() => { setActiveTab("overview"); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'overview' ? 'bg-gray-800 text-white shadow-lg' : 'hover:bg-gray-800 hover:text-white'}`}
               >
                  Recent History
               </button>
               <button 
                  onClick={() => { setActiveTab("entry_sheet"); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'entry_sheet' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'hover:bg-gray-800 hover:text-white'}`}
               >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                  Entry Sheet
               </button>
             </nav>
          </div>
          <div className="px-6 py-6 border-t border-gray-800 bg-gray-950/50">
            <Link href="/dashboard" className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors group">
              <svg className="w-4 h-4 mr-3 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              Master Portal
            </Link>
          </div>
        </aside>

        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        <main className="flex-grow p-4 sm:p-8 bg-gray-50 overflow-auto">
            <div className="max-w-7xl mx-auto space-y-8">
                {activeTab === "entry_sheet" && (
                    <AddGatePass userData={userData} onSuccess={() => { setActiveTab("overview"); fetchPasses(); }} />
                )}

                {activeTab === "overview" && (
                    <div className="space-y-6">
                        {/* Professional Heading & Filter Bar */}
                        <div className="bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden border border-white/5">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[100px] rounded-full"></div>
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-none">Operational Ledger</h2>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">Industrial Movement Control Center</p>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-1">Type Filter</label>
                                        <select 
                                            value={filterType} 
                                            onChange={(e) => setFilterType(e.target.value)}
                                            className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-white focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer"
                                        >
                                            <option value="All">All Passes</option>
                                            <option value="Returnable">Returnable</option>
                                            <option value="Non-Returnable">Non-Returnable</option>
                                            <option value="Outdoor">Outdoor</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-1">Time Horizon</label>
                                        <select 
                                            value={filterTimeframe} 
                                            onChange={(e) => setFilterTimeframe(e.target.value)}
                                            className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-white focus:ring-2 focus:ring-orange-600 outline-none cursor-pointer"
                                        >
                                            <option value="24h">Last 24 Hours</option>
                                            <option value="all">Full Archive</option>
                                        </select>
                                    </div>

                                    <button 
                                        onClick={fetchPasses} 
                                        className="mt-4 lg:mt-0 p-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-all shadow-lg shadow-orange-900/40 active:scale-95 self-end"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[900px]">
                                    <thead className="bg-slate-900 text-slate-400">
                                    <tr>
                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest">Identification</th>
                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest">Category</th>
                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest">Subject Details</th>
                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest">Route / Purpose</th>
                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-center">Lifecycle Status</th>
                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-center">Action Center</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 uppercase">
                                    {filteredPasses.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900 tracking-tight">{p.passNumber}</span>
                                                    <span className="text-[8px] font-bold text-slate-400 mt-1">{new Date(p.date).toLocaleDateString('en-GB')} {new Date(p.date).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'})}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`text-[8px] font-black px-2.5 py-1 rounded-md border shadow-sm ${
                                                    p.type === 'Returnable' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                    p.type === 'Non-Returnable' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                    'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>
                                                    {p.type}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-slate-800">{p.employeeName || p.subject || "N/A"}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 mt-0.5">{p.employeeId || p.department || "General"}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-600 truncate max-w-[150px]">{p.whereToGo || p.toPlace}</span>
                                                    <span className="text-[9px] font-medium text-slate-400 normal-case italic line-clamp-1">{p.purpose}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                {(() => {
                                                    let dotColor = "bg-slate-300";
                                                    let textColor = "text-slate-500";
                                                    let statusText = p.status;
                                                    let isLive = p.status !== "Cleared" && p.status !== "Returned" && p.status !== "Completed";

                                                    if (p.status === "Issued") { 
                                                        dotColor = "bg-amber-500"; 
                                                        textColor = "text-amber-600"; 
                                                        statusText = "Security Pending";
                                                    }
                                                    else if (p.status === "Verified") { 
                                                        dotColor = "bg-blue-500"; 
                                                        textColor = "text-blue-600"; 
                                                        statusText = p.type === "Returnable" ? "Material OUT" : "OUT";
                                                    }
                                                    else if (p.status === "Returned") { 
                                                        dotColor = "bg-indigo-500"; 
                                                        textColor = "text-indigo-600"; 
                                                        statusText = "Security IN / Pending Receipt";
                                                    }
                                                    else if (p.status === "Cleared" || p.status === "Completed") { 
                                                        dotColor = "bg-emerald-500"; 
                                                        textColor = "text-emerald-600"; 
                                                        statusText = "Process Completed";
                                                    }

                                                    return (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border border-current/10 bg-slate-50/50 ${textColor}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isLive ? 'animate-pulse' : ''}`}></span>
                                                                <span className="text-[9px] font-black tracking-widest">{statusText}</span>
                                                            </div>
                                                            {((p as any).securityClearBy || (p as any).securityClearedBy) && (
                                                                <span className="text-[8px] font-bold text-slate-400 normal-case">
                                                                    Verified by {(p as any).securityClearBy || (p as any).securityClearedBy}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    {p.type === "Returnable" && p.status === "Returned" && (
                                                        <button 
                                                            onClick={async () => {
                                                                if(confirm("Confirm that you have RECEIVED the materials back? This will complete the pass lifecycle.")) {
                                                                    const res = await authenticatedFetch('/api/operation/gate-passes', {
                                                                        method: 'PUT',
                                                                        body: JSON.stringify({ id: p.id, action: 'received', type: p.type })
                                                                    });
                                                                    if ((await res.json()).success) fetchPasses();
                                                                }
                                                            }}
                                                            className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                            Mark Received
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => setSelectedPassForPrint(p)} 
                                                        className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm group active:scale-90"
                                                        title="View / Print"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredPasses.length === 0 && <tr><td colSpan={6} className="py-20 text-center text-slate-300 font-black text-xs uppercase tracking-widest bg-white">No matches in current timeframe</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </main>
      </div>

      {selectedPassForPrint && (
          <GatePassPrint pass={selectedPassForPrint} onClose={() => setSelectedPassForPrint(null)} />
      )}
    </div>
  );
}
