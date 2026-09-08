"use client";
import { useState, useEffect } from 'react';
import { BookOpen, FileText, MessageSquare, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Dashboard({ user }: { user: any }) {
    const { token } = useApp();
    const [stats, setStats] = useState({ courses: 0, pendingAssignments: 0, unreadMessages: 0, attendance: 0, pendingGrading: 0 });
    const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
    const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            if(!token) return;
            try {
                const coursesRes = await fetch('http://localhost:5000/api/courses', { headers: { 'Authorization': `Bearer ${token}` } });
                const courses = await coursesRes.json();
                
                const assignmentRes = await fetch('http://localhost:5000/api/assignments', { headers: { 'Authorization': `Bearer ${token}` }});
                const assignments = await assignmentRes.json();

                let pendingAssignments = 0;
                let unreadMessages = 0;
                let attendance = 100;
                let pendingGrading = 0;

                const subsRes = await fetch('http://localhost:5000/api/assignments/submissions', { headers: { 'Authorization': `Bearer ${token}` }});
                const submissions = await subsRes.json();

                const forumRes = await fetch('http://localhost:5000/api/forum-messages/recent', { headers: { 'Authorization': `Bearer ${token}` }});
                if (forumRes.ok) setRecentMessages(await forumRes.json());

                if (user?.role === 'Faculty') {
                    pendingAssignments = assignments.length || 0;
                    if(Array.isArray(submissions)) {
                        const ungraded = submissions.filter((s: any) => !s.grade);
                        pendingGrading = ungraded.length;
                        setRecentSubmissions(ungraded.slice(0, 5));
                    }
                } else {
                    if (Array.isArray(assignments) && Array.isArray(submissions)) {
                        const submittedIds = submissions.map(s => s.assignment_id);
                        const pending = assignments.filter(a => !submittedIds.includes(a.id));
                        pendingAssignments = pending.length;
                        setUpcomingDeadlines(pending.slice(0, 5));
                    }
                    
                    const msgsRes = await fetch('http://localhost:5000/api/messages/inbox', { headers: { 'Authorization': `Bearer ${token}` }});
                    const messages = await msgsRes.json();
                    unreadMessages = Array.isArray(messages) ? messages.length : 0;

                    const attRes = await fetch('http://localhost:5000/api/attendance', { headers: { 'Authorization': `Bearer ${token}` }});
                    const attendanceRecords = await attRes.json();
                    if (Array.isArray(attendanceRecords) && attendanceRecords.length > 0) {
                        const present = attendanceRecords.filter((a: any) => a.status === 'Present').length;
                        attendance = Math.round((present / attendanceRecords.length) * 100);
                    }
                }
                
                setStats({
                    courses: Array.isArray(courses) ? courses.length : 0,
                    pendingAssignments,
                    unreadMessages,
                    attendance,
                    pendingGrading,
                });
            } catch (err) {
                console.error("Error fetching dashboard stats", err);
            }
        };
        fetchStats();
    }, [user?.role]);

    if (user?.role === 'Faculty') {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Faculty Overview</h2>
                        <p className="text-gray-500 font-medium">Manage your courses, grading, and moderation.</p>
                    </div>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2">
                        <FileText size={18} /> New Assignment
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <DashboardCard title="Active Courses" value={stats.courses} icon={BookOpen} color="blue" />
                    <DashboardCard title="Assignments Created" value={stats.pendingAssignments} icon={FileText} color="indigo" />
                    <DashboardCard title="Pending Grading" value={stats.pendingGrading} icon={Clock} color="amber" />
                    <DashboardCard title="Recent Activity" value={recentMessages.length} icon={AlertCircle} color="teal" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[300px]">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={18}/> Ungraded Submissions</h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                             {recentSubmissions.length === 0 && <p className="text-sm text-gray-400 italic">No pending submissions.</p>}
                             {recentSubmissions.map(sub => (
                                 <div key={sub.id} className="p-3 border border-gray-100 rounded-xl bg-gray-50 flex justify-between items-center transition-colors hover:bg-indigo-50/50">
                                     <div>
                                         <p className="font-bold text-sm text-gray-800">{sub.assignment?.title}</p>
                                         <p className="text-xs text-gray-500">Submitted by {sub.student?.name}</p>
                                     </div>
                                     <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold uppercase tracking-wide">Needs Grading</span>
                                 </div>
                             ))}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[300px]">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><MessageSquare className="text-indigo-500" size={18}/> Recent Forum Logs</h3>
                        <div className="flex-1 overflow-y-auto space-y-3 border-l-2 border-indigo-100 pl-4 custom-scrollbar">
                            {recentMessages.length === 0 && <p className="text-sm text-gray-400 italic">No recent forum activity.</p>}
                            {recentMessages.map(msg => (
                                <div key={msg.id} className="group cursor-pointer">
                                    <p className="font-bold text-sm text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{msg.message_text}</p>
                                    <p className="text-xs text-gray-500">Posted by {msg.sender?.name} in {msg.course?.course_code} • {new Date(msg.created_at).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Student Dashboard</h2>
                    <p className="text-gray-500 font-medium">Here's what's happening in your classes today.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard title="Enrolled Courses" value={stats.courses} icon={BookOpen} color="blue" />
                <DashboardCard title="Due Assignments" value={stats.pendingAssignments} icon={FileText} color="amber" />
                <DashboardCard title="Unread Messages" value={stats.unreadMessages} icon={MessageSquare} color="teal" />
                <DashboardCard title="Attendance Rate" value={`${stats.attendance}%`} icon={CheckCircle2} color={stats.attendance > 75 ? 'emerald' : 'red'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[300px]">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FileText className="text-amber-500" size={18}/> Upcoming Deadlines</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {upcomingDeadlines.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <CheckCircle2 size={48} className="text-emerald-200 mb-2" />
                                <p className="text-sm font-medium text-emerald-600">You're all caught up!</p>
                            </div>
                        ) : (
                            upcomingDeadlines.map(a => (
                                <div key={a.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex items-center justify-between">
                                    <div className="flex gap-3 items-center">
                                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex justify-center items-center"><FileText size={16}/></div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{a.title}</p>
                                            <p className="text-xs text-gray-500">{a.course?.course_code}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 shadow-sm">
                                        Due: {new Date(a.deadline).toLocaleDateString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-lg border border-indigo-500 text-white flex flex-col h-[300px]">
                    <h3 className="font-bold text-indigo-100 flex items-center gap-2 mb-4 border-b border-white/20 pb-2"><AlertCircle size={18}/> Latest Announcements</h3>
                    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                        {recentMessages.length === 0 ? (
                            <p className="text-indigo-200 text-sm italic">No recent announcements.</p>
                        ) : (
                            recentMessages.slice(0, 3).map(msg => (
                                <div key={msg.id} className="border-l-2 border-indigo-300 pl-3 group cursor-pointer hover:bg-white/5 p-1 rounded-r-lg transition-colors">
                                    <p className="font-bold text-white text-sm line-clamp-2">{msg.message_text}</p>
                                    <p className="text-[10px] text-indigo-200 uppercase tracking-widest mt-1">{msg.course?.course_code} • {msg.sender?.name}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DashboardCard({ title, value, icon: Icon, color }: any) {
    const colorMap: Record<string, string> = {
        blue: 'from-blue-50 to-indigo-50 border-blue-100 text-blue-700',
        indigo: 'from-indigo-50 to-purple-50 border-indigo-100 text-indigo-700',
        amber: 'from-amber-50 to-orange-50 border-amber-100 text-amber-700',
        emerald: 'from-emerald-50 to-teal-50 border-emerald-100 text-emerald-700',
        teal: 'from-teal-50 to-cyan-50 border-teal-100 text-teal-700',
        red: 'from-red-50 to-rose-50 border-red-100 text-red-700',
    };

    return (
        <div className={`p-6 bg-gradient-to-br ${colorMap[color]} border rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-sm tracking-wide opacity-80 uppercase">{title}</h3>
                <Icon size={20} className="opacity-70" />
            </div>
            <p className="text-4xl font-black drop-shadow-sm">{value}</p>
        </div>
    );
}
