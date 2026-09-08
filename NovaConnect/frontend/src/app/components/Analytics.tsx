"use client";
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, BookOpen, Clock, Activity, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Analytics({ user }: { user: any }) {
    const { token } = useApp();
    const [stats, setStats] = useState<any>({
        users: 0, courses: 0, activeNow: 12, storageUsed: '45%' 
    });
    
    useEffect(() => {
        const fetchStats = async () => {
            if(!token) return;
            try {
                const usersRes = await fetch('http://localhost:5000/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } });
                const users = await usersRes.json();
                
                const coursesRes = await fetch('http://localhost:5000/api/courses', { headers: { 'Authorization': `Bearer ${token}` } });
                const courses = await coursesRes.json();

                const subsRes = await fetch('http://localhost:5000/api/assignments/submissions', { headers: { 'Authorization': `Bearer ${token}` } });
                const subs = await subsRes.json();
                
                let submissionsCount = 0;
                const activeNow = 12; // Placeholder
                const storageUsed = '45%'; // Placeholder

                if (Array.isArray(subs)) {
                    submissionsCount = subs.length;
                    
                    // Simple logic for chart: map past 7 days submissions
                    const past7Days = Array.from({length: 7}).map((_, i) => {
                        const d = new Date(); d.setDate(d.getDate() - (6 - i));
                        return d.toISOString().split('T')[0];
                    });

                    const counts = past7Days.map(date => subs.filter((s: any) => s.submitted_at.startsWith(date)).length);
                    // To make chart visible, calculate percentage against max
                    const maxS = Math.max(...counts, 1);
                    setActivityData({ labels: past7Days.map(d => d.slice(5)), heights: counts.map(c => Math.round((c/maxS)*100)), raw: counts });
                }

                setStats((p: any) => ({ ...p, users: users.length || 0, courses: courses.length || 0, submissions: submissionsCount }));
            } catch (err) {
                console.error("Error fetching analytics stats", err);
            }
        };
        fetchStats();
    }, []);

    const [activityData, setActivityData] = useState({ labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], heights: [40, 65, 30, 85, 55, 95, 20], raw: [4, 6, 3, 8, 5, 9, 2] });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Analytics</h1>
                    <p className="text-gray-500 mt-1">Real-time metrics and platform usage statistics.</p>
                </div>
                <button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-bold shadow-sm transition-all flex items-center gap-2">
                    <TrendingUp size={18} className="text-indigo-600" /> Export Report
                </button>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Users</p>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={18}/></div>
                    </div>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-black text-gray-900">{stats.users}</h3>
                        <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md mb-1">+12%</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Courses</p>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><BookOpen size={18}/></div>
                    </div>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-black text-gray-900">{stats.courses}</h3>
                        <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md mb-1">+5%</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Submissions</p>
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><FileText size={18}/></div>
                    </div>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-black text-gray-900">{stats.submissions || 0}</h3>
                        <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md mb-1">Total</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Active Now</p>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Activity size={18}/></div>
                    </div>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-black text-gray-900">{stats.activeNow}</h3>
                        <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-md mb-1">Live</span>
                    </div>
                </div>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-80">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2"><BarChart3 className="text-indigo-500" size={18}/> Weekly Activity</h3>
                        <select className="text-sm border-gray-200 rounded-lg px-2 py-1 text-gray-600 outline-none">
                            <option>This Week</option>
                            <option>Last Week</option>
                        </select>
                    </div>
                    <div className="flex-1 flex items-end gap-4 px-2">
                        {/* CSS Bar Chart Simulation */}
                        {activityData.heights.map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end group">
                                <div 
                                    className="w-full bg-gradient-to-t from-indigo-500 to-blue-400 rounded-t-lg transition-all duration-500 group-hover:opacity-80 relative"
                                    style={{ height: `${h}%` }}
                                >
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {activityData.raw[i]}
                                    </div>
                                </div>
                                <p className="text-center text-xs font-bold text-gray-400 mt-3 uppercase">
                                    {activityData.labels[i]}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl shadow-md border border-gray-800 p-6 flex flex-col h-80 text-white">
                    <h3 className="font-bold text-gray-100 mb-6 flex items-center gap-2"><Clock className="text-indigo-400" size={18}/> System Storage</h3>
                    
                    <div className="flex-1 flex flex-col justify-center items-center relative">
                        {/* CSS Pie Chart Simulation */}
                        <div className="w-40 h-40 rounded-full border-8 border-gray-800 flex items-center justify-center relative shadow-inner">
                            <div 
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: `conic-gradient(from 0deg, #6366f1 0%, #3b82f6 ${stats.storageUsed}, transparent ${stats.storageUsed})`
                                }}
                            ></div>
                            <div className="w-32 h-32 bg-gradient-to-br from-gray-900 to-indigo-950 rounded-full z-10 flex flex-col items-center justify-center shadow-inner">
                                <span className="text-3xl font-black text-white">{stats.storageUsed}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Used</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between text-xs font-bold">
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Documents (25%)</div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Media (20%)</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
