"use client";

import Link from "next/link";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      // 1. Verify if email exists in our records (Firestore)
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("This email is not registered in our employee directory.");
        setIsLoading(false);
        return;
      }

      // 2. Send Firebase reset email
      await sendPasswordResetEmail(auth, email);
      setMessage("Account verified. Recovery instructions sent to your inbox.");
      setEmail("");
    } catch (err: any) {
      console.error(err);
      setError("An error occurred during verification. Please contact IT.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-white font-sans selection:bg-orange-500 selection:text-white overflow-hidden">
      {/* LEFT SIDE: BRANDING - CONSISTENT WITH LOGIN */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 relative flex-col justify-between p-12 overflow-hidden border-r border-white/10 shadow-2xl">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-5%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[100px]"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg -rotate-6">
                <span className="text-white font-black text-xl">A</span>
            </div>
            <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter text-white uppercase italic leading-none">Admin<span className="text-orange-500 not-italic">Soft</span></span>
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500 mt-1">Access Recovery</span>
            </div>
          </div>

          <div className="max-w-lg text-white">
            <h2 className="text-5xl font-black tracking-tighter leading-[0.9] uppercase mb-6">
                Security <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">Credentials</span> <br/>
                Restoration
            </h2>
            <p className="text-base text-gray-400 font-medium leading-relaxed max-w-sm">
                Follow the standard corporate protocol to restore your authorized access to the administrative dashboard.
            </p>
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/5">
            <p className="text-[8px] font-bold text-gray-700 uppercase tracking-widest">System Security Department © 2026</p>
        </div>
      </div>

      {/* RIGHT SIDE: COMPACT RECOVERY FORM */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-white relative">
        <div className="w-full max-w-xs sm:max-w-sm">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">Identity <br/> <span className="text-orange-600 text-2xl">Verification</span></h2>
            <p className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enter registered email account</p>
          </div>

          <div className="space-y-6">
            {message && (
                <div className="p-4 bg-green-50 border-l-4 border-green-600 text-green-700 text-[9px] font-black uppercase tracking-widest flex items-center gap-3 animate-fadeIn">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    {message}
                </div>
            )}
            
            {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-700 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 animate-shake">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                    {error}
                </div>
            )}
            
            <form onSubmit={handleReset} className="space-y-8">
              <div className="group space-y-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Corporate Email</label>
                  <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="username@admin.com" 
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-bold text-gray-900 focus:border-orange-600 focus:bg-white outline-none transition-all" 
                  />
              </div>

              <button 
                  type="submit" 
                  disabled={isLoading} 
                  className={`w-full flex justify-center py-3.5 rounded-xl shadow-lg text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all transform active:scale-[0.98] items-center gap-3 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-orange-600 shadow-orange-900/10'}`}
              >
                  {isLoading ? "Verifying..." : "Verify & Restore Access"}
              </button>
            </form>

            <div className="pt-8 text-center border-t border-gray-100">
                <Link href="/login" className="group inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-orange-600 transition-all">
                    <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back to Authentication
                </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}