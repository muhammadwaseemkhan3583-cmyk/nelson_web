"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
import { authenticatedFetch } from "@/lib/utils";

export default function UserManagement() {
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<any>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    email: "",
    password: "",
    access: "Finance"
  });

  // Real-time listener
  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userList);
    });
    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(appliedSearch.toLowerCase()) || 
    u.code?.toLowerCase().includes(appliedSearch.toLowerCase())
  );

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    setAppliedSearch(searchInput);
  };

  const handleCreateUser = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await authenticatedFetch("/api/admin/create-user", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        alert("Account Created!");
        setIsAddingUser(false);
        setFormData({ name: "", code: "", email: "", password: "", access: "Finance" });
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("API Connection Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (deleteConfirmText !== "DELETE USER") return;
    
    setIsLoading(true);
    try {
      const response = await authenticatedFetch("/api/admin/delete-user", {
        method: "POST",
        body: JSON.stringify({ uid: isDeletingUser.uid }),
      });
      const result = await response.json();
      if (result.success) {
        alert("User Deleted Successfully");
        setIsDeletingUser(null);
        setDeleteConfirmText("");
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("API Connection Error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn w-[90vw] mx-auto overflow-hidden relative">
      
      {/* Search and Action Bar */}
      <div className="bg-white p-6 rounded-t-xl border border-gray-200 shadow-sm flex flex-wrap justify-between items-end gap-4 text-gray-900">
        <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee Search</span>
                <input 
                    type="text" 
                    placeholder="Name or Emp Code..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="border-2 border-gray-100 rounded-lg px-4 py-2 text-sm font-bold focus:border-orange-600 outline-none w-64 transition-all"
                />
            </div>
            <button 
                onClick={handleSearch}
                className="bg-gray-900 text-white px-8 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md active:scale-95"
            >
                Search Directory
            </button>
        </div>

        <button 
            onClick={() => setIsAddingUser(true)}
            className="bg-orange-600 text-white px-6 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-orange-700 transition-all shadow-lg active:scale-95"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
            Enroll New User
        </button>
      </div>

      {/* USER LIST TABLE */}
      <div className="flex-grow bg-white border-x border-b border-gray-200 rounded-b-xl overflow-hidden flex flex-col h-[70vh]">
        <div className="flex-grow overflow-auto bg-gray-50 p-px custom-scrollbar">
            <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-200 text-gray-600">
                        <th className="w-12 border border-gray-300 py-3 text-[9px] font-black uppercase text-center">#</th>
                        <th className="w-48 border border-gray-300 py-3 text-[9px] font-black uppercase text-left px-4">Employee Name</th>
                        <th className="w-32 border border-gray-300 py-3 text-[9px] font-black uppercase text-center">Emp Code</th>
                        <th className="w-64 border border-gray-300 py-3 text-[9px] font-black uppercase text-left px-4">Email Account</th>
                        <th className="w-40 border border-gray-300 py-3 text-[9px] font-black uppercase text-center">Access Level</th>
                        <th className="border border-gray-300 py-3 text-[9px] font-black uppercase text-center text-gray-400">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user, index) => (
                            <tr key={user.id} className="hover:bg-blue-50 transition-colors group">
                                <td className="border-r border-gray-200 text-center text-[10px] font-bold text-gray-400 bg-gray-50/50">{index + 1}</td>
                                <td className="border-r border-gray-200 px-4 py-3 text-xs font-black text-gray-900 uppercase tracking-tight">{user.name}</td>
                                <td className="border-r border-gray-200 text-center text-xs font-bold text-orange-600 bg-orange-50/30 font-mono">{user.code}</td>
                                <td className="border-r border-gray-200 px-4 py-3 text-xs font-medium text-gray-500">{user.email}</td>
                                <td className="border-r border-gray-200 text-center">
                                    <span className={`text-[8px] font-black px-3 py-1 rounded-full border uppercase tracking-tighter ${user.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                        {user.role === 'Admin' ? 'Super Admin' : 'Finance Officer'}
                                    </span>
                                </td>
                                <td className="text-center px-4">
                                    <button 
                                        onClick={() => setIsDeletingUser(user)}
                                        className="text-[9px] font-black uppercase text-red-400 hover:text-red-600 transition-colors flex items-center gap-1 mx-auto"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={6} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs bg-white">No matching records</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* ADD USER MODAL */}
      {isAddingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => !isLoading && setIsAddingUser(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-slideUp">
                <div className="bg-gray-900 px-8 py-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3 font-black uppercase tracking-widest">Enroll Account</div>
                    {!isLoading && <button onClick={() => setIsAddingUser(false)} className="text-gray-400 hover:text-white transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>}
                </div>
                <form onSubmit={handleCreateUser} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6 text-gray-900">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee Name</label>
                            <input name="name" value={formData.name} onChange={handleInputChange} required type="text" placeholder="Full Name" className="border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-orange-600 outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Code</label>
                            <input name="code" value={formData.code} onChange={handleInputChange} required type="text" placeholder="e.g. ADM-102" className="border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-orange-600 outline-none uppercase font-mono" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Designation & Access</label>
                        <select name="access" value={formData.access} onChange={handleInputChange} className="border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-orange-600 outline-none bg-white text-gray-900 font-black uppercase">
                            <option value="Finance">Finance Officer (Finance Dashboard)</option>
                            <option value="Admin">Super Admin (Admin Dashboard)</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Login Email</label>
                            <input name="email" value={formData.email} onChange={handleInputChange} required type="email" placeholder="name@admin.com" className="border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-orange-600 outline-none text-gray-900" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Security Password</label>
                            <input name="password" value={formData.password} onChange={handleInputChange} required type="password" placeholder="••••••••" className="border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-orange-600 outline-none text-gray-900" />
                        </div>
                    </div>
                    <button type="submit" disabled={isLoading} className={`w-full py-4 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 ${isLoading ? 'bg-gray-400 cursor-wait' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-100'}`}>
                        {isLoading ? 'Processing...' : 'Save User Account'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeletingUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-red-900/80 backdrop-blur-md" onClick={() => !isLoading && setIsDeletingUser(null)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-shake">
                <div className="bg-red-600 px-8 py-6 text-white text-center">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <h3 className="text-xl font-black uppercase tracking-widest">Confirm Deletion</h3>
                    <p className="text-xs font-bold text-red-100 mt-2">You are about to remove <span className="underline">{isDeletingUser.name}</span></p>
                </div>
                <div className="p-8 space-y-6 text-center">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">To confirm, type <span className="text-red-600">DELETE USER</span> below:</p>
                    <input 
                        type="text" 
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type here..."
                        className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-center text-sm font-black text-red-600 focus:border-red-600 outline-none uppercase"
                    />
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setIsDeletingUser(null)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-black uppercase tracking-widest text-[10px] rounded-lg">Cancel</button>
                        <button 
                            onClick={handleDeleteUser}
                            disabled={deleteConfirmText !== "DELETE USER" || isLoading}
                            className={`flex-1 py-3 text-white font-black uppercase tracking-widest text-[10px] rounded-lg transition-all ${deleteConfirmText === "DELETE USER" && !isLoading ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200' : 'bg-gray-300 cursor-not-allowed'}`}
                        >
                            {isLoading ? 'Removing...' : 'Confirm Remove'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}