"use client";

export default function EmergencyAlerts() {
  return (
    <div className="animate-fadeIn">
      <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-12 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl animate-pulse">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter text-red-600 leading-none">Security Alert Level 1</h2>
        <p className="text-red-400 text-xs font-black uppercase tracking-[0.2em] mt-4">Immediate Emergency Protocol</p>
        
        <div className="mt-12 grid grid-cols-2 gap-4">
          <button className="bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-xl shadow-red-200">
            Broadcast SOS
          </button>
          <button className="bg-white text-red-600 border-2 border-red-100 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-100 transition-all">
            Silent Alarm
          </button>
        </div>
        
        <p className="mt-8 text-[10px] font-bold text-red-300 uppercase tracking-widest">
          Authorized Use Only. False alarms are subject to disciplinary action.
        </p>
      </div>
    </div>
  );
}
