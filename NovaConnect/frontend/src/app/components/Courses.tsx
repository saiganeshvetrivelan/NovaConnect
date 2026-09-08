"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Users, ArrowRight, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const COLORS = [
    { bg: 'bg-blue-100', text: 'text-blue-600', badge: 'bg-blue-600' },
    { bg: 'bg-indigo-100', text: 'text-indigo-600', badge: 'bg-indigo-600' },
    { bg: 'bg-purple-100', text: 'text-purple-600', badge: 'bg-purple-600' },
    { bg: 'bg-emerald-100', text: 'text-emerald-600', badge: 'bg-emerald-600' },
    { bg: 'bg-amber-100', text: 'text-amber-600', badge: 'bg-amber-600' },
    { bg: 'bg-rose-100', text: 'text-rose-600', badge: 'bg-rose-600' },
];

export default function Courses({ user }: { user?: any }) {
    const { token } = useApp();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCourses = async () => {
            if (!token) return;
            try {
                const res = await fetch('http://localhost:5000/api/courses', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setCourses(await res.json());
                } else {
                    setError('Failed to load courses.');
                }
            } catch {
                setError('Cannot connect to server.');
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, [token]);

    const role = user?.role || 'Student';

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">My Courses</h2>
                <p className="text-sm font-medium text-gray-500 mt-1">
                    {role === 'Faculty' ? 'Manage the courses you teach.' : 'Browse your enrolled courses.'}
                </p>
            </div>

            {loading && (
                <div className="flex items-center justify-center h-48">
                    <Loader2 size={36} className="animate-spin text-indigo-400" />
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.length === 0 ? (
                        <div className="col-span-full py-16 text-center text-gray-400">
                            <BookOpen size={52} className="mx-auto mb-3 text-gray-200" />
                            <p className="font-semibold">No courses available yet.</p>
                        </div>
                    ) : (
                        courses.map((course, index) => {
                            const color = COLORS[index % COLORS.length];
                            return (
                                <Link
                                    key={course.id}
                                    href={`/courses/${course.id}`}
                                    className="group bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col"
                                >
                                    <div className={`w-12 h-12 ${color.bg} ${color.text} rounded-xl flex items-center justify-center mb-4`}>
                                        <BookOpen size={24} />
                                    </div>
                                    <div className={`self-start px-3 py-1 ${color.badge} text-white text-xs font-bold rounded-lg mb-3`}>
                                        {course.course_code}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                                        {course.course_name || course.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 line-clamp-2 flex-1">
                                        {course.description || 'Click to view resources, assignments, and discussions.'}
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                                        <span className="text-gray-500 flex items-center gap-1">
                                            <Users size={13} /> {course.enrolled || 0} enrolled
                                        </span>
                                        {course.faculty?.name && (
                                            <span className="text-xs text-gray-400 truncate max-w-[120px]">📋 {course.faculty.name}</span>
                                        )}
                                        <span className={`${color.text} font-bold text-xs flex items-center gap-1 group-hover:gap-2 transition-all`}>
                                            Open <ArrowRight size={13} />
                                        </span>
                                    </div>

                                </Link>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
