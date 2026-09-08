"use client";
import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Users, Edit2, Trash2, X, Search, RefreshCw, UserPlus } from "lucide-react";

export default function UsersPage() {
    const { token, user } = useApp();
    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('All');
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editFormData, setEditFormData] = useState({ id: 0, name: '', email: '', roll_number: '', role: 'Student', department: '' });
    const [showCreate, setShowCreate] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', roll_number: '', role: 'Student', department: '', password: '' });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const API = 'http://localhost:5000';
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const fetchUsers = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setUsers(await res.json());
        } catch { console.error("Failed to fetch users"); }
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, [token]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API}/api/admin/users/create`, { method: 'POST', headers, body: JSON.stringify(formData) });
            const data = await res.json();
            if (res.ok) {
                setMessage(`✅ Created ${formData.role} "${formData.name}" successfully.`);
                setFormData({ name: '', email: '', roll_number: '', role: 'Student', department: '', password: '' });
                setShowCreate(false);
                fetchUsers();
            } else {
                setMessage(`❌ Error: ${data.error}`);
            }
        } catch { setMessage("❌ Server error while creating user."); }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`${API}/api/admin/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) { setMessage(`✅ Deleted "${name}".`); fetchUsers(); }
            else { const d = await res.json(); setMessage(`❌ ${d.error || 'Delete failed.'}`); }
        } catch { setMessage("❌ Server error while deleting."); }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API}/api/admin/users/${editFormData.id}`, { method: 'PUT', headers, body: JSON.stringify(editFormData) });
            const data = await res.json();
            if (res.ok) { setMessage(`✅ Updated "${editFormData.name}".`); setEditingUser(null); fetchUsers(); }
            else { setMessage(`❌ ${data.error}`); }
        } catch { setMessage("❌ Server error while updating."); }
    };

    const uniqueDepts = Array.from(new Set(users.map(u => u.department).filter(Boolean))).map(String).sort();

    const filtered = users.filter(u => {
        const s = searchTerm.toLowerCase();
        const matchSearch = u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.roll_number?.toLowerCase().includes(s) || u.role?.toLowerCase().includes(s);
        const matchDept = filterDept === 'All' || u.department === filterDept;
        return matchSearch && matchDept;
    });

    const ROLE_COLORS: Record<string, string> = {
        Admin: 'bg-indigo-100 text-indigo-800',
        Faculty: 'bg-blue-100 text-blue-800',
        Student: 'bg-emerald-100 text-emerald-800',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                        <Users className="text-indigo-600" size={24} /> User Directory
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Manage all institutional accounts.</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                >
                    <UserPlus size={16} /> {showCreate ? 'Cancel' : 'Create Account'}
                </button>
            </div>

            {/* Feedback */}
            {message && (
                <div className={`p-3 rounded-xl text-sm font-medium border flex justify-between items-center ${message.startsWith('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {message}
                    <button onClick={() => setMessage('')}><X size={14} /></button>
                </div>
            )}

            {/* Create Form (collapsible) */}
            {showCreate && (
                <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-3">Provision New Account</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Institutional Email</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Roll / Employee ID</label>
                            <input type="text" value={formData.roll_number} onChange={e => setFormData({...formData, roll_number: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Temporary Password</label>
                            <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Role</label>
                            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm">
                                <option>Student</option>
                                <option>Faculty</option>
                                <option>Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Department</label>
                            <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                        </div>
                        <div className="md:col-span-2">
                            <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm">
                                Create User Account
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* User Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Table Toolbar */}
                <div className="p-4 border-b bg-gray-50/50 flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex gap-2 flex-1 max-w-xl">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, ID, role..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <select
                            value={filterDept}
                            onChange={e => setFilterDept(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                            <option value="All">All Depts</option>
                            {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <button onClick={fetchUsers} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b text-xs uppercase font-bold text-gray-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">ID / Email</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Department</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading directory...</td></tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No users found.</td></tr>
                            )}
                            {filtered.map(u => (
                                <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                {u.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{u.name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-gray-700 font-medium">{u.roll_number || '—'}</p>
                                        <p className="text-xs text-gray-400">{u.email}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{u.department || '—'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 justify-end">
                                            {u.email !== user?.email && (
                                                <>
                                                    <button
                                                        onClick={() => { setEditingUser(u); setEditFormData({ id: u.id, name: u.name, email: u.email, roll_number: u.roll_number || '', role: u.role, department: u.department || '' }); }}
                                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(u.id, u.name)}
                                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500 font-medium">
                    Showing {filtered.length} of {users.length} users
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Edit User Details</h3>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"><X size={18}/></button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            {[
                                { label: 'Full Name', key: 'name', type: 'text' },
                                { label: 'Institutional Email', key: 'email', type: 'email' },
                                { label: 'Roll / Employee ID', key: 'roll_number', type: 'text' },
                                { label: 'Department', key: 'department', type: 'text' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{f.label}</label>
                                    <input
                                        type={f.type}
                                        value={(editFormData as any)[f.key]}
                                        onChange={e => setEditFormData({...editFormData, [f.key]: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                        required={f.key !== 'department'}
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Role</label>
                                <select value={editFormData.role} onChange={e => setEditFormData({...editFormData, role: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm">
                                    <option>Student</option><option>Faculty</option><option>Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition text-sm">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition text-sm">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
