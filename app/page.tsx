import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans selection:bg-orange-500 selection:text-white flex flex-col">
      {/* Navbar */}
      <nav className="bg-gray-900 shadow-md border-b border-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-white">
              Admin<span className="text-orange-500">Soft</span>
              <span className="ml-3 text-xs uppercase tracking-widest text-gray-400 border-l border-gray-700 pl-3">Internal Systems</span>
            </span>
          </div>
            <div className="hidden md:flex space-x-6 items-center">
              <span className="text-gray-400 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                System Operational
              </span>
              <Link href="/login">
                <button className="bg-gray-800 text-gray-300 px-4 py-1.5 rounded border border-gray-700 hover:text-white hover:border-gray-500 transition-colors text-sm font-medium">
                  Authorized Login
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full text-center mb-12">
          <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold uppercase tracking-wide mb-6 border border-yellow-200">
            Restricted Access
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Administration <br/>
            <span className="text-orange-600">Enterprise Resource Planning</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            This system is for authorized Administration personnel only. 
            Unauthorized access is prohibited and monitored.
          </p>
        </div>

        {/* System Modules Grid */}
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Module 1: Inventory */}
          <div className="bg-white p-6 rounded shadow-sm border-t-4 border-orange-600 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900">Inventory Control</h3>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Real-time tracking of raw materials, batch processing, and warehouse logistics.
            </p>
            <ul className="text-xs text-gray-500 space-y-1 font-mono">
              <li>• Stock Level Monitoring</li>
              <li>• Batch Traceability</li>
              <li>• Reorder Alerts</li>
            </ul>
          </div>

          {/* Module 2: Documentation */}
          <div className="bg-white p-6 rounded shadow-sm border-t-4 border-gray-600 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900">Documentation & SOPs</h3>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Centralized repository for technical data sheets, safety manuals, and compliance records.
            </p>
            <ul className="text-xs text-gray-500 space-y-1 font-mono">
              <li>• Safety Data Sheets (SDS)</li>
              <li>• QA/QC Protocols</li>
              <li>• Compliance Reports</li>
            </ul>
          </div>

          {/* Module 3: Reporting */}
          <div className="bg-white p-6 rounded shadow-sm border-t-4 border-blue-600 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900">Operational Reporting</h3>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Advanced analytics for production efficiency, labor utilization, and output metrics.
            </p>
            <ul className="text-xs text-gray-500 space-y-1 font-mono">
              <li>• Daily Shift Reports</li>
              <li>• Yield Analysis</li>
              <li>• Cost Variances</li>
            </ul>
          </div>

        </div>

        <div className="mt-12 text-center">
            <Link href="/login">
                <button className="px-8 py-3 bg-orange-600 text-white font-bold rounded shadow hover:bg-orange-700 transition-colors">
                    Access Admin Dashboard
                </button>
            </Link>
            <p className="mt-4 text-xs text-gray-400 max-w-lg mx-auto">
                By accessing this system, you agree to the Administration Acceptable Use Policy. 
                All activities are logged.
            </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Administration. Internal Use Only. v2.4.0
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
             <span className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">Support</span>
             <span className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">IT Helpdesk</span>
             <span className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
