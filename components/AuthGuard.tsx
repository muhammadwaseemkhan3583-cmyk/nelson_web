"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth, db, signOutUser } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const INACTIVITY_TIMEOUT = 3 * 60 * 60 * 1000; // 3 Hours

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const resetTimer = useCallback(() => {
    localStorage.setItem("lastActivity", Date.now().toString());
  }, []);

  useEffect(() => {
    const checkInactivity = () => {
      const lastActivity = parseInt(localStorage.getItem("lastActivity") || "0");
      if (Date.now() - lastActivity > INACTIVITY_TIMEOUT && auth.currentUser) {
        console.log("Session timed out due to inactivity.");
        signOutUser();
      }
    };

    const timer = setInterval(checkInactivity, 60000); // Check every minute
    
    // Activity Listeners
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("scroll", resetTimer);

    // Initial reset
    resetTimer();

    return () => {
      clearInterval(timer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };
  }, [resetTimer]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      // Check Role for specialized dashboards
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      const role = userData?.role;

      if (pathname.includes("admin_dashboard") && role !== "Admin") {
        router.push("/dashboard/fin_dashboard");
      } else if (pathname.includes("fin_dashboard") && role !== "Finance") {
        router.push("/dashboard/admin_dashboard");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-gray-500">System Authenticating</p>
      </div>
    );
  }

  return <>{children}</>;
}
