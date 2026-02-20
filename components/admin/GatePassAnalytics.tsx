"use client";

import { useState, useEffect, useMemo } from "react";
import { authenticatedFetch } from "@/lib/utils";

export default function GatePassAnalytics() {
  const [passes, setPasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await authenticatedFetch("/api/operation/gate-passes/all");
        const result = await response.json();
        if (result.success) {
          setPasses(result.passes);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const total = passes.length;
    const returnable = passes.filter(p => p.type === "Returnable");
    const nonReturnable = passes.filter(p => p.type === "Non-Returnable");
    const outdoor = passes.filter(p => p.type === "Outdoor");

    const pendingReturn = returnable.filter(p => p.status !== "Completed").length;
    const outMaterial = passes.filter(p => p.status === "Verified").length;
    const completed = passes.filter(p => p.status === "Completed" || p.status === "Cleared").length;

    // Dept wise distribution
    const depts: any = {};
    passes.forEach(p => {
        const d = p.department || "General";
        depts[d] = (depts[d] || 0) + 1;
    });

    return {
      total,
      returnable: returnable.length,
      nonReturnable: nonReturnable.length,
      outdoor: outdoor.length,
      pendingReturn,
      outMaterial,
      completed,
      deptData: Object.entries(depts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5)
    };
  }, [passes]);

  if (isLoading) return <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Analyzing Movement Patterns...</div>;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Global Volume</span>
            </div>
            <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.total}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Total Passes Issued</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active Status</span>
            </div>
            <p className="text-4xl font-black text-orange-600 tracking-tighter">{stats.outMaterial}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Materials Currently OUT</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Pending Task</span>
            </div>
            <p className="text-4xl font-black text-red-600 tracking-tighter">{stats.pendingReturn}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Returnable Pending IN</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Efficiency</span>
            </div>
            <p className="text-4xl font-black text-emerald-600 tracking-tighter">{stats.completed}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Fully Completed Cycles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CATEGORY BREAKDOWN */}
          <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
              <h3 className="text-lg font-black uppercase tracking-widest mb-10 flex items-center gap-3">
                  <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                  Pass Distribution Analysis
              </h3>
              
              <div className="space-y-10">
                  {[
                      { label: "Returnable Material", val: stats.returnable, color: "bg-orange-500" },
                      { label: "Non-Returnable Material", val: stats.nonReturnable, color: "bg-indigo-500" },
                      { label: "Personnel Outdoor Movement", val: stats.outdoor, color: "bg-blue-500" }
                  ].map((cat, i) => (
                      <div key={i} className="space-y-3">
                          <div className="flex justify-between items-end">
                              <span className="text-xs font-black uppercase tracking-widest text-slate-400">{cat.label}</span>
                              <span className="text-xl font-black">{cat.val} <span className="text-[10px] text-slate-500 ml-1">UNITS</span></span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`${cat.color} h-full transition-all duration-1000`} 
                                style={{ width: `${(cat.val / stats.total) * 100 || 0}%` }}
                              ></div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* TOP DEPARTMENTS */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-8 flex items-center gap-3">
                  <span className="w-2 h-6 bg-slate-900 rounded-full"></span>
                  Top Departments
              </h3>
              <div className="space-y-6">
                  {stats.deptData.map(([dept, count]: any, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:scale-[1.02] transition-transform">
                          <div className="flex items-center gap-4">
                              <span className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm">{i+1}</span>
                              <span className="text-xs font-black uppercase text-slate-700 truncate max-w-[120px]">{dept}</span>
                          </div>
                          <span className="text-xs font-black text-slate-900">{count} <span className="text-[8px] text-slate-400">PASSES</span></span>
                      </div>
                  ))}
                  {stats.deptData.length === 0 && <p className="py-10 text-center text-slate-300 font-bold uppercase text-[10px]">No data available</p>}
              </div>
          </div>
      </div>
    </div>
  );
}
