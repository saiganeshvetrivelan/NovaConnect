"use client";
import { useState, useEffect } from 'react';
import { UserCheck, CheckCircle2, UserX, Clock, CalendarDays, Activity, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Attendance({ user }: { user: any }) {
    const { token } = useApp();
    const [records, setRecords] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

    // Faculty specific
    const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState('Present');
    const [students, setStudents] = useState<any[]>([]);
    const [successMsg, setSuccessMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchCourses = async () => {
        if (!token) return;
        const res = await fetch('http://localhost:5000/api/courses', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            setCourses(data);
            if (data.length > 0) setSelectedCourse(data[0].id);
        }
    };

    const fetchStudents = async (courseId: number) => {
        if (!token) return;
        try {
            const res = await fetch(`http://localhost:5000/api/attendance/students/${courseId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
                if (data.length > 0) setSelectedStudent(data[0].id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchAttendance = async () => {
        if (!token) return;
        let url = 'http://localhost:5000/api/attendance';
        if (user?.role === 'Faculty' && selectedCourse) {
            url += `?course_id=${selectedCourse}`;
        }
        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setRecords(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => { fetchCourses(); }, []);

    useEffect(() => {
        if (selectedCourse) {
            fetchAttendance();
            if (user?.role === 'Faculty') fetchStudents(selectedCourse);
        }
    }, [selectedCourse]);

    const handleMarkAttendance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !selectedCourse || !selectedStudent || !date) return;
        setSubmitting(true);
        try {
            const res = await fetch('http://localhost:5000/api/attendance/mark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ course_id: selectedCourse, student_id: selectedStudent, date, status })
            });
            if (res.ok) {
                setSuccessMsg('Attendance saved!');
                setTimeout(() => setSuccessMsg(''), 2500);
                fetchAttendance();
            } else {
                const err = await res.json();
                setSuccessMsg(`Error: ${err.error || 'Failed'}`);
                setTimeout(() => setSuccessMsg(''), 3000);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const getStats = () => {
        const total = records.length;
        if (total === 0) return { present: 0, absent: 0, late: 0, percentage: 0 };
        const present = records.filter(r => r.status === 'Present').length;
        const absent = records.filter(r => r.status === 'Absent').length;
        const late = records.filter(r => r.status === 'Late').length;
        const percentage = Math.round(((present + (late * 0.5)) / total) * 100);
        return { present, absent, late, percentage };
    };

    const stats = getStats();

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-140px)]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Attendance Tracking</h2>
                    <p className="text-sm font-medium text-gray-500 mt-1">{user?.role === 'Faculty' ? 'Manage course attendance registers' : 'Your academic attendance summary'}</p>
                </div>
                {courses.length > 0 && user?.role === 'Faculty' && (
                    <select
                        value={selectedCourse || ''}
                        onChange={e => setSelectedCourse(parseInt(e.target.value))}
                        className="border border-gray-200 text-gray-800 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        {courses.map(c => <option key={c.id} value={c.id}>{c.course_code} – {c.course_name || c.name}</option>)}
                    </select>
                )}
            </div>

            <div className="flex-1 overflow-y-auto w-full custom-scrollbar p-6 bg-gray-50/30">

                {/* STUDENT VIEW */}
                {user?.role === 'Student' && (
                    <div className="w-full">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-indigo-600 text-white rounded-2xl p-6 shadow-md shadow-indigo-200">
                                <h3 className="font-bold flex items-center gap-2 mb-2"><Activity size={18} /> Total Rate</h3>
                                <p className="text-4xl font-black">{stats.percentage}%</p>
                                <p className="text-indigo-200 text-xs mt-1 font-medium">{records.length} total records</p>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2 mb-2"><CheckCircle2 size={16} className="text-emerald-500" /> Present</h3>
                                <p className="text-3xl font-black text-gray-800">{stats.present}</p>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2 mb-2"><UserX size={16} className="text-red-500" /> Absent</h3>
                                <p className="text-3xl font-black text-gray-800">{stats.absent}</p>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2 mb-2"><Clock size={16} className="text-amber-500" /> Late</h3>
                                <p className="text-3xl font-black text-gray-800">{stats.late}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-gray-800">Attendance History</h3>
                                <button onClick={fetchAttendance} className="text-xs text-gray-500 flex items-center gap-1 hover:text-indigo-600 transition-colors font-medium">
                                    <RefreshCw size={12} /> Refresh
                                </button>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50/80 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-gray-700">Course</th>
                                        <th className="px-6 py-4 font-bold text-gray-700">Date</th>
                                        <th className="px-6 py-4 font-bold text-gray-700 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map(r => (
                                        <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-900">{r.course?.course_code || 'General'}</td>
                                            <td className="px-6 py-4 font-medium text-gray-500">{new Date(r.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${r.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : r.status === 'Absent' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {records.length === 0 && (
                                        <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400 font-medium">No attendance records found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* FACULTY VIEW */}
                {user?.role === 'Faculty' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><UserCheck size={18} className="text-indigo-500" /> Mark Register</h3>
                                <form onSubmit={handleMarkAttendance} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Student</label>
                                        {students.length === 0 ? (
                                            <p className="text-sm text-gray-400 italic">No enrolled students found for this course.</p>
                                        ) : (
                                            <select
                                                value={selectedStudent || ''}
                                                onChange={e => setSelectedStudent(parseInt(e.target.value))}
                                                className="w-full border ring-1 ring-gray-200 rounded-xl p-2.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                required
                                            >
                                                {students.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} {s.roll_number ? `(${s.roll_number})` : ''}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
                                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border ring-1 ring-gray-200 rounded-xl p-2.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                                            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border ring-1 ring-gray-200 rounded-xl p-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" required>
                                                <option value="Present">Present</option>
                                                <option value="Absent">Absent</option>
                                                <option value="Late">Late</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <button type="submit" disabled={submitting || students.length === 0} className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                                            {submitting ? 'Saving...' : 'Log Attendance'}
                                        </button>
                                        {successMsg && (
                                            <p className={`text-center text-xs font-bold mt-3 flex items-center justify-center gap-1 ${successMsg.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
                                                <CheckCircle2 size={12} /> {successMsg}
                                            </p>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><CalendarDays size={16} /> Daily Roster Logs</h3>
                                <button onClick={fetchAttendance} className="text-xs text-gray-500 flex items-center gap-1 hover:text-indigo-600 transition-colors font-medium">
                                    <RefreshCw size={12} /> Refresh
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white">
                                        <tr>
                                            <th className="px-4 py-2 font-bold text-gray-400 text-xs uppercase">Student</th>
                                            <th className="px-4 py-2 font-bold text-gray-400 text-xs uppercase">Roll No</th>
                                            <th className="px-4 py-2 font-bold text-gray-400 text-xs uppercase">Date</th>
                                            <th className="px-4 py-2 font-bold text-gray-400 text-xs uppercase text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {records.map(r => (
                                            <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3 font-bold text-gray-900">{r.student?.name || 'Unknown'}</td>
                                                <td className="px-4 py-3 text-gray-500 font-medium text-xs">{r.student?.roll_number || '—'}</td>
                                                <td className="px-4 py-3 font-medium text-gray-500">{new Date(r.date).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${r.status === 'Present' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : r.status === 'Absent' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {records.length === 0 && <div className="text-center py-10 text-gray-400 font-medium text-sm">No records yet. Mark attendance to see them here.</div>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
