"use client";
import { useState, useEffect } from 'react';
import { UploadCloud, FileText, Video, ImageIcon, BookOpen, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Resources({ user }: { user?: any }) {
    const { token } = useApp();
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
    const [resources, setResources] = useState<any[]>([]);
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        const fetchCourses = async () => {
            if (!token) return;
            try {
                const res = await fetch('http://localhost:5000/api/courses', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data);
                    if (data.length > 0) setSelectedCourse(data[0].id);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchCourses();
    }, [token]);


    useEffect(() => {
        const fetchResources = async () => {
             if (!selectedCourse) return;
             if (!token) return;
             try {
                 const res = await fetch(`http://localhost:5000/api/resources/${selectedCourse}`, {
                     headers: { 'Authorization': `Bearer ${token}` }
                 });
                 if (res.ok) setResources(await res.json());
             } catch (err) {
                 console.error(err);
             }
        };
        fetchResources();
    }, [selectedCourse, token]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !file || !selectedCourse) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('course_id', selectedCourse.toString());

        try {
            const res = await fetch('http://localhost:5000/api/resources/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                setTitle('');
                setFile(null);
                const updatedRes = await fetch(`http://localhost:5000/api/resources/${selectedCourse}`, { headers: { 'Authorization': `Bearer ${token}` } });
                setResources(await updatedRes.json());
            }
        } catch (err) {
            console.error(err);
        }
    };

    const categories = [
        { id: 'All', icon: BookOpen },
        { id: 'Notes', icon: FileText },
        { id: 'Slides', icon: ImageIcon },
        { id: 'Labs', icon: UploadCloud },
        { id: 'Videos', icon: Video }
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-140px)]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Course Materials</h2>
                <select 
                    value={selectedCourse?.toString() || ""}
                    onChange={e => setSelectedCourse(parseInt(e.target.value))}
                    className="border border-gray-200 text-gray-800 rounded-xl px-4 py-2 text-sm font-semibold tracking-wide shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={courses.length === 0}
                >
                    {courses.length === 0 ? <option>No Courses Available</option> : null}
                    {courses.map(c => <option key={c.id} value={c.id}>{c.course_name || c.name || c.course_code}</option>)}
                </select>
            </div>

            <div className="flex gap-4 px-6 pt-4 border-b border-gray-100 overflow-x-auto custom-scrollbar">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <button 
                            key={cat.id}
                            onClick={() => setActiveFilter(cat.id)}
                            className={`flex items-center gap-2 pb-3 text-sm font-bold transition-colors relative whitespace-nowrap ${activeFilter === cat.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            <Icon size={16} />
                            {cat.id}
                            {activeFilter === cat.id && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>}
                        </button>
                    )
                })}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 custom-scrollbar">
                {resources.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <FolderOpen size={48} className="text-gray-200 mb-3" />
                        <p className="font-medium text-sm">No materials available for this course yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {resources.map(r => (
                            <div key={r.id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm line-clamp-2">{r.title}</p>
                                        <p className="text-[11px] text-gray-400 mt-1 font-medium">{new Date(r.uploaded_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <a 
                                    href={`http://localhost:5000${r.file_url}`} 
                                    target="_blank" 
                                    className="flex items-center justify-center gap-2 w-full py-2 bg-gray-50 hover:bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold transition-colors border border-gray-100 hover:border-indigo-100"
                                >
                                    <Download size={14} /> Download File
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {user?.role === 'Faculty' && (
                <div className="p-5 border-t border-indigo-100 bg-indigo-50/50 rounded-b-2xl">
                    <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2"><UploadCloud size={16}/> Upload Material</h3>
                    <form onSubmit={handleUpload} className="flex gap-3">
                        <input 
                            type="text" placeholder="Document Title (e.g. Week 1 Slides)" 
                            value={title} onChange={e => setTitle(e.target.value)} required
                            className="flex-1 border-0 ring-1 ring-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 text-sm bg-white shadow-sm"
                        />
                        <div className="relative">
                            <input 
                                type="file" onChange={e => setFile(e.target.files?.[0] || null)} required
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="border border-gray-300 border-dashed rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 text-center w-48 shadow-sm">
                                {file ? file.name : 'Choose File...'}
                            </div>
                        </div>
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all">
                            Upload
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

// Temporary inline icon for empty state since I didn't import FolderOpen top level:
function FolderOpen(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="M2 10h20"/></svg>; }
