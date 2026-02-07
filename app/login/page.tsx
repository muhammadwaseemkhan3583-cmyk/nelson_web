"use client";

import Link from "next/link";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;
        if (role === "Admin") router.push("/dashboard/admin_dashboard");
        else if (role === "Finance") router.push("/dashboard/fin_dashboard");
        else router.push("/dashboard");
      } else {
        setError("Unauthorized: Employee profile not found.");
      }
    } catch (err: any) {
      setError("Invalid credentials. Please verify your email and password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-white font-sans selection:bg-orange-500 selection:text-white overflow-hidden">
      {/* LEFT SIDE: PREMIUM BRANDING - COMPACT VERSION */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 relative flex-col justify-between p-12 overflow-hidden border-r border-white/10 shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-5%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[100px]"></div>
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 30c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20 -rotate-6">
                <span className="text-white font-black text-xl">A</span>
            </div>
            <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter text-white uppercase italic leading-none">Admin<span className="text-orange-500 not-italic">Soft</span></span>
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500 mt-1">Industrial ERP</span>
            </div>
          </div>

          <div className="max-w-lg">
            <div className="inline-block px-3 py-1 bg-orange-600/10 border border-orange-600/20 rounded-full text-[9px] font-black uppercase tracking-widest text-orange-500 mb-6">
                Enterprise v3.0
            </div>
            <h2 className="text-5xl font-black text-white tracking-tighter leading-[0.9] uppercase mb-6">
                Master <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">Operations</span> <br/>
                Gateway
            </h2>
            <p className="text-base text-gray-400 font-medium leading-relaxed mb-10 max-w-sm">
                Securely manage assets and financial integrity with our advanced ecosystem.
            </p>

            <div className="flex gap-6">
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Security</span>
                    <span className="text-xs font-bold text-gray-400">AES-256 Auth</span>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Protocol</span>
                    <span className="text-xs font-bold text-gray-400">TLS 1.3 Secure</span>
                </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between pt-6 border-t border-white/5">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-green-500 flex items-center gap-2 uppercase tracking-tighter">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Systems Operational
                </span>
            </div>
            <p className="text-[8px] font-bold text-gray-700 uppercase tracking-widest">© 2026 Administration Soft</p>
        </div>
      </div>

      {/* RIGHT SIDE: COMPACT LOGIN FORM */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-white relative overflow-y-auto">
        <div className="absolute top-8 right-8">
            <Link href="/" className="group flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-orange-600 transition-all">
                Public Portal
                <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </Link>
        </div>

        <div className="w-full max-w-xs sm:max-w-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">Authorized <br/> <span className="text-orange-600 text-2xl">Credential Login</span></h2>
            <p className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Identity Management System</p>
          </div>

          <div className="space-y-6">
            {error && (
                <div className="p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                    {error}
                </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="group space-y-1.5">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-orange-600 transition-colors ml-1">Account ID</label>
                    <div className="relative">
                        <input 
                            type="email" 
                            required 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="Email address" 
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-bold text-gray-900 focus:border-orange-600 focus:bg-white outline-none transition-all placeholder:text-gray-300" 
                        />
                    </div>
                </div>

                <div className="group space-y-1.5">
                    <div className="flex justify-between items-end px-1">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-orange-600 transition-colors">Access Key</label>
                        <Link href="/forgot-password" className="text-[8px] font-black uppercase text-orange-600 hover:text-orange-700 tracking-tighter transition-colors">Reset?</Link>
                    </div>
                    <div className="relative">
                        <input 
                            type="password" 
                            required 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="Password" 
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-bold text-gray-900 focus:border-orange-600 focus:bg-white outline-none transition-all placeholder:text-gray-300" 
                        />
                    </div>
                </div>
              </div>

              <div className="pt-2">
                <button 
                    type="submit" 
                    disabled={isLoading} 
                    className={`w-full flex justify-center py-3.5 rounded-xl shadow-lg text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all transform active:scale-[0.98] items-center gap-3 ${isLoading ? 'bg-gray-400' : 'bg-gray-900 hover:bg-orange-600 shadow-orange-900/10'}`}
                >
                    {isLoading ? "Authenticating..." : "Establish Access"}
                </button>
              </div>
            </form>

            <div className="pt-6 text-center">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                    Secure Administrative Access System. <br/> Monitoring Protocol Active.
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}