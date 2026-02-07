"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import UserManagement from "@/components/admin/UserManagement";
import ExpenseReports from "@/components/fin/ExpenseReports";
import { signOutUser, auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("reports");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState<{ name: string; role: string; code: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as any);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 overflow-x-hidden">
      {/* Premium Header */}
      <header className="bg-gray-900 text-white shadow-xl h-16 flex items-center justify-between px-8 sticky top-0 z-50 print:hidden border-b border-gray-800">
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
            <span className="font-black text-xl tracking-tighter text-white uppercase text-center">
              Admin<span className="text-orange-500 italic">Soft</span>
            </span>
            <div className="h-4 w-px bg-gray-700 mx-2 hidden sm:block"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hidden sm:block text-center">Security Portal</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 relative">
          <div className="hidden sm:flex flex-col items-end border-r border-gray-800 pr-4">
             <span className="text-xs font-black uppercase tracking-tight text-white">{userData?.name || "Loading..."}</span>
             <span className="text-[9px] font-bold text-purple-500 uppercase tracking-widest">{userData?.role === 'Admin' ? 'Super Admin' : 'Finance Officer'}</span>
          </div>
          
          {/* User Profile Trigger */}
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-all outline-none"
          >
            <div className="w-9 h-9 bg-purple-600 rounded-full border-2 border-purple-500/30 flex items-center justify-center shadow-lg ring-2 ring-transparent hover:ring-purple-500/20 transition-all">
                <span className="text-xs font-black text-white">{userData?.name ? userData.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : "..."}</span>
            </div>
            <svg className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
          </button>

          {/* User Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 animate-slideDown overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-50 mb-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Administrative ID</p>
                    <p className="text-xs font-bold text-gray-900 text-left uppercase">{userData?.code || "EMP-REF-XXX"}</p>
                </div>
                <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-orange-600 transition-colors flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    Security Settings
                </button>
                <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    System Logs
                </button>
                <div className="h-px bg-gray-50 my-2"></div>
                <button 
                    onClick={() => { setIsProfileOpen(false); signOutUser(); }}
                    className="w-full text-left px-4 py-2 text-xs font-black text-red-500 hover:bg-red-50 transition-colors flex items-center gap-3 uppercase tracking-widest"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Sign Out System
                </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 relative" onClick={() => setIsProfileOpen(false)}>
        {/* Sidebar Navigation */}
        <aside 
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-gray-300 transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } pt-20 shadow-2xl flex flex-col border-r border-gray-800`}
        >
          <div className="px-6 py-4 flex-grow overflow-y-auto">
             <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Core Administration</h3>
             <nav className="space-y-2">
               <button
                  onClick={() => { setActiveTab("reports"); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                    activeTab === "reports" ? "bg-orange-600 text-white shadow-lg shadow-orange-900/40" : "hover:bg-gray-800 hover:text-white"
                  }`}
               >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Master Reports
               </button>
               <button
                  onClick={() => { setActiveTab("users"); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                    activeTab === "users" ? "bg-orange-600 text-white shadow-lg shadow-orange-900/40" : "hover:bg-gray-800 hover:text-white"
                  }`}
               >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                  Manage Users
               </button>
             </nav>
          </div>
          <div className="px-6 py-6 border-t border-gray-800 bg-gray-950/50">
            <div className="p-4 bg-gray-800/50 rounded-2xl">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">System Engine</p>
                <p className="text-[10px] font-bold text-green-500 uppercase mt-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Verified & Online
                </p>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-all" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        {/* Main Content Area */}
        <main className="flex-grow p-8 bg-gray-50 overflow-auto">
          <div className="max-w-7xl mx-auto">
                {/* Module Views */}
                {activeTab === "users" && (
                    <div className="space-y-6 animate-fadeIn">
                        <header className="mb-2">
                            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Identity Management</h1>
                            <p className="text-gray-500 font-medium">Configure corporate user access levels and authentication.</p>
                        </header>
                        <UserManagement />
                    </div>
                )}
                
                {activeTab === "reports" && (
                    <div className="space-y-6 animate-fadeIn">
                        <header className="mb-2 px-10">
                            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight text-center">Global Analysis</h1>
                            <p className="text-gray-500 font-medium text-center">Real-time consolidated data from across the enterprise.</p>
                        </header>
                        <ExpenseReports />
                    </div>
                )}
          </div>
        </main>
      </div>
    </div>
  );
}