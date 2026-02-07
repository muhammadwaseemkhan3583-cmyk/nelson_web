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
      // 1. Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Fetch User Role from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role; // "Admin" or "Finance"

        // 3. Role-Based Redirection
        if (role === "Admin") {
          router.push("/dashboard/admin_dashboard");
        } else if (role === "Finance") {
          router.push("/dashboard/fin_dashboard");
        } else {
          router.push("/dashboard");
        }
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
    <div className="min-h-screen flex bg-white font-sans">
      {/* Branding Column - Modern Corporate Look */}
      <div className="hidden lg:flex lg:w-3/5 bg-gray-950 relative flex-col justify-between p-16 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-orange-600/20 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[100px]"></div>
        
        {/* Abstract Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-16">
            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-600/20 rotate-12">
                <span className="text-white font-black text-2xl">A</span>
            </div>
            <span className="font-black text-3xl tracking-tighter text-white uppercase italic">
              Admin<span className="text-orange-500 not-italic">Soft</span>
            </span>
          </div>

          <div className="max-w-xl">
            <h2 className="text-6xl font-black text-white tracking-tighter leading-[0.9] uppercase mb-8">
              Digital <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">Governance</span> <br/>
              Platform
            </h2>
            <p className="text-xl text-gray-400 font-medium leading-relaxed mb-12">
              The next generation of enterprise resource planning. 
              Designed for precision, built for security, and scaled for excellence.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
                {["Secure Auth", "Real-time Auditing", "Financial Analytics", "Cloud Sync"].map((f: string) => (
                    <span key={f} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-300 backdrop-blur-sm">
                        {f}
                    </span>
                ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1">System Core</span>
                <span className="text-xs font-bold text-green-500 flex items-center gap-2 uppercase tracking-widest">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                    Encrypted Connection
                </span>
            </div>
            <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                &copy; {new Date().getFullYear()} Industrial Excellence. v2.8.4
            </div>
        </div>
      </div>

      {/* Form Column */}
      <div className="flex-1 flex flex-col justify-center py-12 px-8 sm:px-12 lg:px-24 bg-white relative">
        <div className="absolute top-8 right-8 print:hidden">
            <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-orange-600 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Public Portal
            </Link>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <div className="mb-12">
            <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Authorized <br/> <span className="text-orange-600">Access</span></h2>
            <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Enterprise Identity Management</p>
          </div>

          <div className="mt-10">
            {error && (
                <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-600 text-red-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-shake">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                    {error}
                </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-6">
                <div className="relative group">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-orange-600 transition-colors">Corporate Identity</label>
                    <div className="relative">
                        <input 
                            type="email" 
                            required 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="username@admin.com" 
                            className="block w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 font-bold focus:border-orange-600 focus:bg-white outline-none transition-all placeholder:text-gray-300" 
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-orange-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        </div>
                    </div>
                </div>

                <div className="relative group">
                    <div className="flex justify-between items-end mb-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-orange-600 transition-colors">Security Token</label>
                        <Link href="/forgot-password" title="Recover your password" className="text-[9px] font-black uppercase text-orange-600 hover:underline tracking-widest">Forgot?</Link>
                    </div>
                    <div className="relative">
                        <input 
                            type="password" 
                            required 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="••••••••••••" 
                            className="block w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 font-bold focus:border-orange-600 focus:bg-white outline-none transition-all placeholder:text-gray-300" 
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-orange-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </div>
                    </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading} 
                className={`w-full flex justify-center py-5 rounded-2xl shadow-2xl shadow-orange-900/10 text-[10px] font-black text-white uppercase tracking-[0.3em] transition-all transform active:scale-[0.98] items-center gap-4 ${isLoading ? 'bg-gray-400 cursor-wait' : 'bg-gray-900 hover:bg-orange-600 hover:shadow-orange-600/20'}`}
              >
                {isLoading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        Verifying Identity
                    </>
                ) : (
                    <>
                        Verify Credentials
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}