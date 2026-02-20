"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { signOutUser, auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import GatePasses from "@/components/security/GatePasses";
import VisitorManagement from "@/components/security/VisitorManagement";

export default function SecurityDashboardPage() {
  const [activeTab, setActiveTab] = useState("passes");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState<{ name: string; role: string; code: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as any;
          if (data.role !== "Security" && data.role !== "Admin") {
              router.push("/dashboard");
              return;
          }
          setUserData(data);
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900 overflow-x-hidden">
      {/* Security Header */}
      <header className="bg-slate-900 text-white shadow-xl h-16 flex items-center justify-between px-8 sticky top-0 z-50 border-b border-slate-800">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-full hover:bg-white/10 transition-all focus:outline-none"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          
          <div className="flex items-center gap-2 select-none cursor-default">
            <span className="font-black text-xl tracking-tighter text-white uppercase">
              Admin<span className="text-orange-500 italic">Soft</span>
            </span>
            <div className="h-4 w-px bg-slate-700 mx-2 hidden sm:block"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hidden sm:block">Security Portal</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 relative">
          <div className="hidden sm:flex flex-col items-end border-r border-slate-800 pr-4">
             <span className="text-xs font-black uppercase tracking-tight text-white">{userData?.name || "Officer"}</span>
             <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Active Duty</span>
          </div>
          
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-all outline-none"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-full border-2 border-blue-500/30 flex items-center justify-center shadow-lg">
                <span className="text-xs font-black text-white">{userData?.name ? userData.name.substring(0, 2).toUpperCase() : "..."}</span>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 animate-slideDown overflow-hidden text-gray-900">
                <div className="px-4 py-2 border-b border-gray-50 mb-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Badge ID</p>
                    <p className="text-xs font-bold text-gray-900 text-left uppercase">{userData?.code || "SEC-REF-XXX"}</p>
                </div>
                <button 
                    onClick={() => signOutUser()}
                    className="w-full text-left px-4 py-2 text-xs font-black text-red-500 hover:bg-red-50 transition-colors flex items-center gap-3 uppercase tracking-widest"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    End Shift
                </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 relative">
        <aside 
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } pt-20 shadow-2xl flex flex-col border-r border-slate-800`}
        >
          <div className="px-6 py-4 flex-grow">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Security Ops</h3>
             <nav className="space-y-2">
               <button 
                  onClick={() => { setActiveTab("passes"); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'passes' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'hover:bg-slate-800 hover:text-white'}`}
               >
                  Verify Gate Passes
               </button>
               <button 
                  onClick={() => { setActiveTab("visitors"); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'visitors' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'hover:bg-slate-800 hover:text-white'}`}
               >
                  Visitor Pass
               </button>
             </nav>
          </div>
          <div className="px-6 py-6 border-t border-slate-800 bg-slate-950/50">
            <Link href="/dashboard" className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors group">
              <svg className="w-4 h-4 mr-3 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              Return Home
            </Link>
          </div>
        </aside>

        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        <main className="flex-grow p-8 bg-slate-50 overflow-auto">
            <div className="max-w-7xl mx-auto">
                {activeTab === "passes" && <GatePasses />}
                {activeTab === "visitors" && <VisitorManagement />}
            </div>
        </main>
      </div>
    </div>
  );
}
