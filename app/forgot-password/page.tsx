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

      // 2. If exists, send the real Firebase reset email
      console.log("Verified in Firestore, sending Firebase reset email to:", email);
      await sendPasswordResetEmail(auth, email);
      console.log("Firebase accepted the reset request.");
      setMessage("Account verified. Recovery email has been sent to your inbox.");
      setEmail("");
    } catch (err: any) {
      console.error(err);
      setError("An error occurred. Please contact the IT administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-900 text-white font-black text-2xl font-serif">A</div>
            <span className="font-bold text-2xl tracking-tight text-gray-900 uppercase">Administration<span className="text-orange-600">Soft</span></span>
          </Link>
        </div>
        <h2 className="text-center text-3xl font-black text-gray-900 uppercase tracking-tight">Access Recovery</h2>
        <p className="mt-2 text-center text-sm font-bold text-gray-500 uppercase tracking-tighter italic">Verification required for internal accounts</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-4 shadow-2xl border border-gray-100 rounded-3xl sm:px-10">
          {message && <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-xs font-bold uppercase animate-fadeIn">{message}</div>}
          {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase animate-shake">{error}</div>}
          
          <form className="space-y-6" onSubmit={handleReset}>
            <div>
              <label htmlFor="email" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee Corporate Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@admin.com"
                className="mt-1 block w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-gray-900 font-bold focus:border-orange-600 outline-none transition-all shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-4 rounded-xl shadow-xl text-xs font-black text-white uppercase tracking-[0.2em] transition-all transform active:scale-95 items-center gap-3 ${isLoading ? 'bg-gray-400 cursor-wait' : 'bg-gray-900 hover:bg-orange-600 shadow-orange-100'}`}
            >
              {isLoading ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : "Verify & Send Recovery Link"}
            </button>
          </form>

          <div className="mt-8 text-center border-t pt-6">
            <Link href="/login" className="font-black text-gray-400 hover:text-orange-600 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              Return to Authentication
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
