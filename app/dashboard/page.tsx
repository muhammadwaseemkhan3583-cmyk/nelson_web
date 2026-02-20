"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardMasterPage() {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userRole = userDoc.data().role;
          setRole(userRole);
          
          // Redirect non-admins to their specific dashboards
          if (userRole === "Finance") {
            router.push("/dashboard/fin_dashboard");
          } else if (userRole === "Security") {
            router.push("/dashboard/security_dashboard");
          } else if (userRole === "Operation") {
            router.push("/dashboard/operation_dashboard");
          }
          // Admins will stay on this page
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (!role || role !== "Admin") {
    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
            <div className="flex items-center gap-4 text-white">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Redirecting to your dashboard...</span>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8 font-sans overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-orange-600/5 blur-[120px]"></div>
        <div className="absolute bottom-[-5%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[100px]"></div>
        
        <div className="max-w-5xl w-full relative z-10">
            <div className="text-center mb-16">
                <span className="inline-block px-4 py-1.5 bg-orange-600/10 border border-orange-600/20 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-500 mb-6">
                    Central Management Hub
                </span>
                <h1 className="text-6xl font-black text-white tracking-tighter leading-none uppercase">
                    Select <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">Command</span> <br/> 
                    Module
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Admin Module */}
                <Link href="/dashboard/admin_dashboard" className={`group relative bg-gray-900/50 border border-white/10 rounded-3xl p-8 hover:bg-orange-600/10 hover:border-orange-600/30 transition-all ${role !== 'Admin' ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-orange-500 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
                    </div>
                    <h3 className="text-white font-black uppercase tracking-widest text-lg leading-tight">System Admin</h3>
                    <p className="text-gray-500 text-[10px] font-bold mt-2 uppercase">User Control</p>
                </Link>

                {/* Finance Module */}
                <Link href="/dashboard/fin_dashboard" className={`group relative bg-gray-900/50 border border-white/10 rounded-3xl p-8 hover:bg-green-600/10 hover:border-green-600/30 transition-all ${(role as string) !== 'Finance' && (role as string) !== 'Admin' ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-green-500 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 className="text-white font-black uppercase tracking-widest text-lg leading-tight">Finance Ops</h3>
                    <p className="text-gray-500 text-[10px] font-bold mt-2 uppercase">Petty Cash</p>
                </Link>

                {/* Security Module */}
                <Link href="/dashboard/security_dashboard" className={`group relative bg-gray-900/50 border border-white/10 rounded-3xl p-8 hover:bg-blue-600/10 hover:border-blue-600/30 transition-all ${(role as string) !== 'Security' && (role as string) !== 'Admin' ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                    </div>
                    <h3 className="text-white font-black uppercase tracking-widest text-lg leading-tight">Site Security</h3>
                    <p className="text-gray-500 text-[10px] font-bold mt-2 uppercase">Personnel Logs</p>
                </Link>

                {/* Operation Module */}
                <Link href="/dashboard/operation_dashboard" className={`group relative bg-gray-900/50 border border-white/10 rounded-3xl p-8 hover:bg-amber-600/10 hover:border-amber-600/30 transition-all ${(role as string) !== 'Operation' && (role as string) !== 'Admin' ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-amber-500 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    </div>
                    <h3 className="text-white font-black uppercase tracking-widest text-lg leading-tight">Operation Hub</h3>
                    <p className="text-gray-500 text-[10px] font-bold mt-2 uppercase">Pass & Assets Control</p>
                </Link>
            </div>

            <div className="mt-16 text-center">
                <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">
                    System Security Version 3.4.0 (Protected)
                </p>
            </div>
        </div>
    </div>
  );
}
