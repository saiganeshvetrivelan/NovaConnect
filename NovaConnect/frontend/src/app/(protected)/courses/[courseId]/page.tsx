"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import { BookOpen, Folder, FileText, MessageSquare, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Tab = 'overview' | 'resources' | 'assignments' | 'forum';

export default function CourseDetailPage() {
    const { courseId } = useParams();
    const { token } = useApp();

    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [course, setCourse] = useState<any>(null);
    const [resources, setResources] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [forumMessages, setForumMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const API = 'http://localhost:5000';

    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        if (!courseId || !token) return;

        const load = async () => {
            setLoading(true);
            try {
                // Fetch all courses and find this one
                const cRes = await fetch(`${API}/api/courses`, { headers });
                const all = await cRes.json();
                const found = Array.isArray(all) ? all.find((c: any) => String(c.id) === String(courseId)) : null;
                setCourse(found);

                // Fetch resources for this course
                const rRes = await fetch(`${API}/api/resources?course_id=${courseId}`, { headers });
                if (rRes.ok) setResources(await rRes.json());

                // Fetch assignments for this course
                const aRes = await fetch(`${API}/api/assignments?course_id=${courseId}`, { headers });
                if (aRes.ok) setAssignments(await aRes.json());

                // Get forum id for this course  then fetch messages
                if (found?.forum?.id) {
                    const fRes = await fetch(`${API}/api/forum-messages/${found.forum.id}`, { headers });
                    if (fRes.ok) setForumMessages(await fRes.json());
                }
            } catch (e) {
                console.error('Error loading course detail', e);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [courseId, token]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !course?.forum?.id) return;
        try {
            const res = await fetch(`${API}/api/forum-messages`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ forum_id: course.forum.id, message_text: newMessage }),
            });
            if (res.ok) {
                const msg = await res.json();
                setForumMessages(prev => [...prev, msg]);
                setNewMessage('');
            }
        } catch (e) {
            console.error('Error sending message', e);
        }
    };

    const TABS = [
        { id: 'overview', label: 'Overview', icon: BookOpen },
        { id: 'resources', label: 'Resources', icon: Folder },
        { id: 'assignments', label: 'Assignments', icon: FileText },
        { id: 'forum', label: 'Forum', icon: MessageSquare },
    ] as const;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="text-center py-24 text-gray-400">
                <BookOpen size={64} className="mx-auto mb-4 text-gray-200" />
                <p className="font-bold text-lg">Course not found.</p>
                <Link href="/courses" className="mt-4 inline-flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline">
                    <ArrowLeft size={14} /> Back to Courses
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-8 text-white shadow-lg">
                <Link href="/courses" className="inline-flex items-center gap-1 text-indigo-200 text-sm font-semibold hover:text-white transition-colors mb-4">
                    <ArrowLeft size={14} /> All Courses
                </Link>
                <h1 className="text-4xl font-black tracking-tight">{course.course_code}</h1>
                <p className="text-indigo-200 text-lg mt-1">{course.course_name || course.name}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-indigo-200">
                    <span className="flex items-center gap-1"><Users size={14} /> {course.enrollments?.length || 0} students</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-100">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all border-b-2 ${
                                    activeTab === tab.id
                                        ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                            >
                                <Icon size={16} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="p-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-900">Course Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Course Code</p>
                                    <p className="text-2xl font-black text-blue-900">{course.course_code}</p>
                                </div>
                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Resources</p>
                                    <p className="text-2xl font-black text-indigo-900">{resources.length}</p>
                                </div>
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Assignments</p>
                                    <p className="text-2xl font-black text-amber-900">{assignments.length}</p>
                                </div>
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                                {course.description || 'No description available for this course.'}
                            </p>
                        </div>
                    )}

                    {/* Resources Tab */}
                    {activeTab === 'resources' && (
                        <div className="space-y-3">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Course Resources</h2>
                            {resources.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Folder size={48} className="mx-auto mb-3 text-gray-200" />
                                    <p className="font-medium">No resources uploaded yet.</p>
                                </div>
                            ) : (
                                resources.map((r: any) => (
                                    <div key={r.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-indigo-50/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                                                <Folder size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900">{r.title}</p>
                                                <p className="text-xs text-gray-500">{r.file_type?.toUpperCase() || 'FILE'}</p>
                                            </div>
                                        </div>
                                        <a
                                            href={`${API}${r.file_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            Download
                                        </a>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Assignments Tab */}
                    {activeTab === 'assignments' && (
                        <div className="space-y-3">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Assignments</h2>
                            {assignments.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <FileText size={48} className="mx-auto mb-3 text-gray-200" />
                                    <p className="font-medium">No assignments for this course.</p>
                                </div>
                            ) : (
                                assignments.map((a: any) => (
                                    <div key={a.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-amber-50/30 transition-colors">
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{a.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Due: {a.deadline ? new Date(a.deadline).toLocaleDateString() : 'No deadline'}</p>
                                        </div>
                                        <Link
                                            href="/assignments"
                                            className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors"
                                        >
                                            View
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Forum Tab */}
                    {activeTab === 'forum' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Discussion Forum</h2>
                            <div className="h-64 overflow-y-auto space-y-3 border border-gray-100 rounded-xl p-4 bg-gray-50 custom-scrollbar">
                                {forumMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <MessageSquare size={40} className="mb-2 text-gray-200" />
                                        <p className="text-sm">No messages yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    forumMessages.map((msg: any) => (
                                        <div key={msg.id} className="bg-white border border-gray-100 rounded-xl p-3">
                                            <p className="font-bold text-xs text-indigo-600">{msg.sender?.name || 'Unknown'}</p>
                                            <p className="text-sm text-gray-800 mt-1">{msg.message_text}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">{new Date(msg.created_at).toLocaleString()}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                                    placeholder="Type a message..."
                                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <button
                                    onClick={sendMessage}
                                    className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
