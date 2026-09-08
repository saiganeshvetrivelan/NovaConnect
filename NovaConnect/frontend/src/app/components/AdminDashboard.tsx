"use client";
import React, { useState, useEffect } from "react";
import { Users, BookOpen, Settings, ShieldCheck, Activity, Edit2, Trash2, X } from "lucide-react";

export default function AdminDashboard({ user }: { user: any }) {
    const [users, setUsers] = useState<any[]>([]);
    const [formData, setFormData] = useState({ name: '', email: '', roll_number: '', role: 'Student', department: '', password: '' });
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('All');
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editFormData, setEditFormData] = useState({ id: 0, name: '', email: '', roll_number: '', role: 'Student', department: '' });
    const [coursesCount, setCoursesCount] = useState(0);
    const [systemHealth, setSystemHealth] = useState('Checking...');

    useEffect(() => {
        fetchUsers();
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        const token = localStorage.getItem('token');
        try {
            const courseRes = await fetch('http://localhost:5000/api/courses', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (courseRes.ok) {
                const courseData = await courseRes.json();
                setCoursesCount(courseData.length || 0);
                setSystemHealth('Optimal');
            } else {
                setSystemHealth('Degraded');
            }
        } catch (e) {
            setSystemHealth('Offline');
        }
    };

    const fetchUsers = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5000/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setUsers(await res.json());
        } catch (e) {
            console.error("Failed to fetch users");
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5000/api/admin/users/create', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(`Success: Created ${formData.role} ${formData.name}`);
                setFormData({ name: '', email: '', roll_number: '', role: 'Student', department: '', password: '' });
                fetchUsers();
            } else {
                setMessage(`Error: ${data.error}`);
            }
        } catch (e) {
            setMessage("Server error occurred while creating user.");
        }
    };

    const handleDeleteUser = async (id: number, name: string) => {
        if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
        
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMessage(`User ${name} deleted successfully.`);
                fetchUsers();
            } else {
                const data = await res.json();
                setMessage(`Error: ${data.error || 'Failed to delete user.'}`);
            }
        } catch (e) {
            setMessage("Server error occurred while deleting user.");
        }
    };

    const handleEditClick = (u: any) => {
        setEditingUser(u);
        setEditFormData({
            id: u.id,
            name: u.name,
            email: u.email,
            roll_number: u.roll_number || '',
            role: u.role,
            department: u.department || ''
        });
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${editFormData.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editFormData)
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(`Success: Updated user ${editFormData.name}`);
                setEditingUser(null);
                fetchUsers();
            } else {
                setMessage(`Error: ${data.error}`);
            }
        } catch (e) {
            setMessage("Server error occurred while updating user.");
        }
    };

    const uniqueDepartments = Array.from(new Set(users.map(u => u.department).filter(d => d))).map(String).sort();

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Administration</h1>
                    <p className="text-gray-500 mt-1">Manage users, roles, and platform settings.</p>
                </div>
                <div className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg shadow-sm border border-indigo-200 flex items-center shadow-inner">
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    <strong>Master Admin Privileges Active</strong>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mr-4">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Users</p>
                        <h3 className="text-2xl font-bold text-gray-900">{users.length}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl mr-4">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Active Courses</p>
                        <h3 className="text-2xl font-bold text-gray-900">{coursesCount}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
                    <div className={`p-3 rounded-xl mr-4 ${
                        systemHealth === 'Optimal' ? 'bg-purple-50 text-purple-600' :
                        systemHealth === 'Offline' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">System Health</p>
                        <h3 className={`text-2xl font-bold ${
                            systemHealth === 'Optimal' ? 'text-green-600' :
                            systemHealth === 'Offline' ? 'text-red-600' : 'text-amber-600'
                        }`}>{systemHealth}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Provision New Account</h3>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Full Name</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Institutional Email</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Roll / Employee ID</label>
                            <input type="text" value={formData.roll_number} onChange={e => setFormData({...formData, roll_number: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Role</label>
                                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                                    <option value="Student">Student</option>
                                    <option value="Faculty">Faculty</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Department</label>
                                <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Temporary Password</label>
                            <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
                        </div>
                        <button type="submit" className="w-full py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition">Create User Account</button>
                    </form>
                    {message && <div className="mt-4 p-3 bg-gray-50 border rounded text-sm text-gray-700 text-center">{message}</div>}
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="p-6 border-b flex flex-wrap lg:flex-nowrap justify-between items-center bg-gray-50/50 gap-4">
                        <h3 className="text-lg font-bold text-gray-900 whitespace-nowrap">User Directory</h3>
                        <div className="flex bg-white gap-2 flex-1 max-w-lg">
                            <select 
                                value={filterDept} 
                                onChange={(e) => setFilterDept(e.target.value)} 
                                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none max-w-[140px] truncate bg-white"
                            >
                                <option value="All">All Depts</option>
                                {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <input 
                                type="text"
                                placeholder="Search by name, email, ID, or role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-4 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <button onClick={fetchUsers} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap">Refresh</button>
                    </div>
                    <div className="overflow-auto flex-1 p-0">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 border-b text-xs uppercase font-semibold text-gray-500 tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">ID</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3">Department</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.filter(u => {
                                    const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                        u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                        (u.roll_number && u.roll_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                                        u.role.toLowerCase().includes(searchTerm.toLowerCase());
                                    const matchDept = filterDept === 'All' || u.department === filterDept;
                                    return matchSearch && matchDept;
                                }).map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <div>{u.name}</div>
                                            <div className="text-xs text-gray-500 font-normal">{u.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{u.roll_number || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                u.role === 'Admin' ? 'bg-indigo-100 text-indigo-800' :
                                                u.role === 'Faculty' ? 'bg-blue-100 text-blue-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{u.department || '-'}</td>
                                        <td className="px-6 py-4 flex gap-2 justify-end">
                                            {u.email !== user?.email && (
                                                <>
                                                    <button onClick={() => handleEditClick(u)} title="Edit user" className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDeleteUser(u.id, u.name)} title="Delete user" className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"><Trash2 size={16} /></button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading directory...</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Edit User Details</h3>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Full Name</label>
                                <input type="text" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Institutional Email</label>
                                <input type="email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Roll / Employee ID</label>
                                <input type="text" value={editFormData.roll_number} onChange={e => setEditFormData({...editFormData, roll_number: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Role</label>
                                    <select value={editFormData.role} onChange={e => setEditFormData({...editFormData, role: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                                        <option value="Student">Student</option>
                                        <option value="Faculty">Faculty</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Department</label>
                                    <input type="text" value={editFormData.department} onChange={e => setEditFormData({...editFormData, department: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-2 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
