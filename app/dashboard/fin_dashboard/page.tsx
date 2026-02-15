"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import AddExpense from "@/components/fin/AddExpense";
import PrintVoucher from "@/components/fin/PrintVoucher";
import ExpenseReports from "@/components/fin/ExpenseReports";
import ViewSheets from "@/components/fin/ViewSheets";
import VoucherRecords from "@/components/fin/VoucherRecords";
import { signOutUser, auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function FinanceDashboardPage() {
  const [activeTab, setActiveTab] = useState("expenses_add");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState<{ name: string; role: string; code: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // First set name from session if available
        if (user.displayName) {
            setUserData(prev => ({ ...prev!, name: user.displayName! }));
        }
        
        // Then fetch detailed profile from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as any;
          setUserData(data);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const isPettyCashSubView = activeTab.startsWith("expenses_");

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
            <span className="font-black text-xl tracking-tighter text-white uppercase">
              Admin<span className="text-orange-500 italic">Soft</span>
            </span>
            <div className="h-4 w-px bg-gray-700 mx-2 hidden sm:block"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hidden sm:block">Internal Systems</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 relative">
          <div className="hidden sm:flex flex-col items-end border-r border-gray-800 pr-4">
             <span className="text-xs font-black uppercase tracking-tight text-white">{userData?.name || "Loading..."}</span>
             <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">{userData?.role === 'Admin' ? 'Super Admin' : 'Finance Officer'}</span>
          </div>
          
          {/* User Profile Trigger */}
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-all outline-none"
          >
            <div className="w-9 h-9 bg-green-600 rounded-full border-2 border-green-500/30 flex items-center justify-center shadow-lg ring-2 ring-transparent hover:ring-green-500/20 transition-all">
                <span className="text-xs font-black text-white">{userData?.name ? userData.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : "..."}</span>
            </div>
            <svg className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
          </button>

          {/* User Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 animate-slideDown overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-50 mb-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Account ID</p>
                    <p className="text-xs font-bold text-gray-900 text-left uppercase">{userData?.code || "EMP-REF-XXX"}</p>
                </div>
                <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-orange-600 transition-colors flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    Employee Profile
                </button>
                <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Preferences
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
             <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Financial Modules</h3>
             <nav className="space-y-2">
               <button
                  onClick={() => { setActiveTab("expenses_add"); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                    isPettyCashSubView ? "bg-orange-600 text-white shadow-lg shadow-orange-900/40" : "hover:bg-gray-800 hover:text-white"
                  }`}
               >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Petty Cash
               </button>
               <button
                  onClick={() => { setActiveTab("scrap"); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                    activeTab === "scrap" ? "bg-orange-600 text-white shadow-lg shadow-orange-900/40" : "hover:bg-gray-800 hover:text-white"
                  }`}
               >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                  Scrap Management
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

        {/* Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-all" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        {/* Main Content Area */}
        <main className="flex-grow flex flex-col min-h-0">
          
          {/* Sub-Navigation for Petty Cash */}
          {isPettyCashSubView && (
            <div className="bg-white border-b border-gray-200 px-8 py-3 sticky top-16 z-30 print:hidden shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
                    <button 
                        onClick={() => setActiveTab("expenses_add")}
                        className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                            activeTab === "expenses_add" ? "bg-orange-600 text-white shadow-lg shadow-orange-900/20" : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                        Add Entry
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-2"></div>
                    <button 
                        onClick={() => setActiveTab("expenses_print")}
                        className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                            activeTab === "expenses_print" ? "bg-orange-600 text-white shadow-lg shadow-orange-900/20" : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                        Generate Voucher
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-2"></div>
                    <button 
                        onClick={() => setActiveTab("expenses_records")}
                        className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                            activeTab === "expenses_records" ? "bg-orange-600 text-white shadow-lg shadow-orange-900/20" : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                        Voucher Records
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-2"></div>
                    <button 
                        onClick={() => setActiveTab("expenses_sheets")}
                        className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                            activeTab === "expenses_sheets" ? "bg-orange-600 text-white shadow-lg shadow-orange-900/20" : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                        View Sheets
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-2"></div>
                    <button 
                        onClick={() => setActiveTab("expenses_reports")}
                        className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                            activeTab === "expenses_reports" ? "bg-orange-600 text-white shadow-lg shadow-orange-900/20" : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                        Reports
                    </button>
                </div>
            </div>
          )}

          <div className="flex-grow p-8 bg-gray-50 overflow-auto">
            <div className="max-w-[1600px] mx-auto h-full">
                {/* Module Views */}
                {activeTab === "expenses_add" && <AddExpense onClose={() => setActiveTab("expenses_sheets")} />}
                {activeTab === "expenses_sheets" && <ViewSheets />}
                {activeTab === "expenses_print" && <PrintVoucher />}
                {activeTab === "expenses_records" && <VoucherRecords />}
                {activeTab === "expenses_reports" && <ExpenseReports onTabChange={setActiveTab} />}
                
                {activeTab === "scrap" && (
                    <div className="flex items-center justify-center h-full">
                        <div className="bg-white p-16 rounded-3xl border border-gray-200 text-center shadow-sm">
                            <svg className="w-16 h-16 text-gray-200 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900">Scrap Management</h2>
                            <p className="text-gray-400 text-sm mt-2 font-medium">Module integration pending secure link.</p>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}