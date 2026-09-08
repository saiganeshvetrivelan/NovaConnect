"use client";
import { useState, useEffect } from 'react';
import { FileText, CheckCircle2, AlertCircle, PlusCircle, PenTool, UploadCloud, Star, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AssignmentUI({ user }: { user: any }) {
    const { token } = useApp();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);

    const [activeTab, setActiveTab] = useState('active');

    // Student submission state
    const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
    const [fileText, setFileText] = useState('');
    const [submitStatus, setSubmitStatus] = useState('');
    const [plagiarismScore, setPlagiarismScore] = useState<number | null>(null);
    const [flagged, setFlagged] = useState(false);

    // Faculty create state
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');

    // Faculty grading state
    const [selectedSub, setSelectedSub] = useState<any>(null);
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');
    const [gradingStatus, setGradingStatus] = useState('');

    const fetchCourses = async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:5000/api/courses', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
                if (data.length > 0) setSelectedCourse(data[0].id);
            }
        } catch (e) { console.error(e); }
    };

    const fetchAssignments = async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:5000/api/assignments', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setAssignments(data);
                if (data.length > 0 && !selectedAssignment) setSelectedAssignment(data[0].id);
            }
        } catch (e) { console.error(e); }
    };

    const fetchSubmissions = async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:5000/api/assignments/submissions', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setSubmissions(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchAssignments();
        if (user?.role === 'Faculty') fetchCourses();
    }, [user?.role]);

    useEffect(() => {
        if (activeTab === 'submissions' || activeTab === 'grading') {
            fetchSubmissions();
        }
    }, [activeTab]);

    // STUDENT: submit assignment with plagiarism check
    const handleSubmitStudent = async () => {
        if (!fileText.trim() || !selectedAssignment) return;
        setSubmitStatus('Submitting & analyzing for plagiarism...');
        setPlagiarismScore(null);

        let similarity = null;
        let isFlagged = false;

        try {
            const aiRes = await fetch('http://localhost:8000/ai/plagiarism-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    new_submission_text: fileText,
                    existing_submissions_texts: [
                        "The mitochondria is the powerhouse of the cell.",
                        "Normalization is the process of organizing data in a database."
                    ]
                })
            });
            if (aiRes.ok) {
                const aiData = await aiRes.json();
                similarity = aiData.max_similarity_score;
                isFlagged = aiData.is_flagged;
            }
        } catch (e) {
            console.error("AI service error:", e);
        }

        try {
            const res = await fetch('http://localhost:5000/api/assignments/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    assignment_id: selectedAssignment,
                    file_url: `data:text/plain,${encodeURIComponent(fileText)}`
                })
            });
            if (res.ok) {
                setPlagiarismScore(similarity);
                setFlagged(isFlagged);
                setSubmitStatus('Submission recorded successfully!');
                setFileText('');
                fetchSubmissions();
            } else {
                setSubmitStatus('Submission failed. Please try again.');
            }
        } catch (e) {
            setSubmitStatus('Network error. Please try again.');
        }
    };

    // FACULTY: create assignment
    const handleCreateAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !selectedCourse || !title || !deadline) return;
        try {
            const res = await fetch('http://localhost:5000/api/assignments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ course_id: selectedCourse, title, description, deadline })
            });
            if (res.ok) {
                setTitle(''); setDescription(''); setDeadline('');
                fetchAssignments();
                setActiveTab('active');
            }
        } catch (e) { console.error(e); }
    };

    // FACULTY: grade submission
    const handleGrade = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSub || !grade) return;
        try {
            const res = await fetch('http://localhost:5000/api/assignments/grade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ submission_id: selectedSub.id, grade, feedback })
            });
            if (res.ok) {
                setGradingStatus('Graded successfully!');
                setGrade(''); setFeedback(''); setSelectedSub(null);
                setTimeout(() => setGradingStatus(''), 2500);
                fetchSubmissions();
            }
        } catch (e) { console.error(e); }
    };

    const isOverdue = (deadline: string) => new Date(deadline) < new Date();

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-140px)]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-4">Assignments</h2>
                    <div className="flex gap-6">
                        <button onClick={() => setActiveTab('active')} className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'active' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>
                            <span className="flex items-center gap-1"><FileText size={16} /> Active</span>
                            {activeTab === 'active' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />}
                        </button>
                        <button onClick={() => setActiveTab('submissions')} className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'submissions' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>
                            <span className="flex items-center gap-1"><UploadCloud size={16} /> {user?.role === 'Faculty' ? 'All Submissions' : 'My Submissions'}</span>
                            {activeTab === 'submissions' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />}
                        </button>
                        {user?.role === 'Faculty' && (
                            <button onClick={() => setActiveTab('grading')} className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'grading' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>
                                <span className="flex items-center gap-1"><PenTool size={16} /> Grading</span>
                                {activeTab === 'grading' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />}
                            </button>
                        )}
                    </div>
                </div>
                {user?.role === 'Faculty' && activeTab === 'active' && (
                    <button onClick={() => setActiveTab('create')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2 text-sm mb-2">
                        <PlusCircle size={16} /> New Assignment
                    </button>
                )}
                {activeTab !== 'create' && (
                    <button onClick={() => { fetchAssignments(); fetchSubmissions(); }} className="text-gray-400 hover:text-indigo-600 mb-2 transition-colors" title="Refresh">
                        <RefreshCw size={16} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 custom-scrollbar">

                {/* ACTIVE ASSIGNMENTS */}
                {activeTab === 'active' && (
                    <div className="space-y-4">
                        {assignments.length === 0 && <p className="text-gray-400 font-medium text-center py-10">No active assignments found.</p>}
                        {assignments.map(a => (
                            <div key={a.id} className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-start justify-between group">
                                <div className="flex gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isOverdue(a.deadline) ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-600'}`}>
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{a.title}</h3>
                                        {a.description && <p className="text-gray-500 text-sm mt-0.5">{a.description}</p>}
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-gray-400 text-xs font-medium">Course: {a.course?.course_code}</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isOverdue(a.deadline) ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {isOverdue(a.deadline) ? '⚠ Overdue' : `Due: ${new Date(a.deadline).toLocaleDateString()}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {user?.role === 'Student' && (
                                    <button onClick={() => { setSelectedAssignment(a.id); setActiveTab('submissions'); }}
                                        className="opacity-0 group-hover:opacity-100 text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg transition-all">
                                        Submit Work
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* STUDENT SUBMIT / MY SUBMISSIONS */}
                {activeTab === 'submissions' && user?.role === 'Student' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Submit form */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><UploadCloud size={18} className="text-indigo-500" /> Submit Assignment</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Target Assignment</label>
                                <select value={selectedAssignment || ''} onChange={e => setSelectedAssignment(parseInt(e.target.value))}
                                    className="w-full border ring-1 ring-gray-200 rounded-xl p-3 text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none">
                                    {assignments.map(a => <option key={a.id} value={a.id}>{a.title} (Due {new Date(a.deadline).toLocaleDateString()})</option>)}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Paste Content</label>
                                <textarea className="w-full h-40 border ring-1 ring-gray-200 rounded-xl p-4 text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none resize-none leading-relaxed"
                                    placeholder="Paste your assignment text here for AI plagiarism evaluation..."
                                    value={fileText} onChange={e => setFileText(e.target.value)} />
                            </div>
                            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                <button onClick={handleSubmitStudent}
                                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl shadow-md hover:bg-indigo-700 font-bold text-sm transition-all">
                                    Submit & Analyze
                                </button>
                                <span className="text-sm text-gray-500 font-medium">{submitStatus || 'Awaiting submission'}</span>
                            </div>
                            {plagiarismScore !== null && (
                                <div className={`mt-5 p-4 rounded-xl border flex items-start gap-3 ${flagged ? 'bg-red-50/80 border-red-200 text-red-900' : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'}`}>
                                    {flagged ? <AlertCircle size={20} className="mt-0.5 text-red-600" /> : <CheckCircle2 size={20} className="mt-0.5 text-emerald-600" />}
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-sm uppercase tracking-wide">AI Plagiarism Report</h3>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${flagged ? 'bg-red-200 text-red-800' : 'bg-emerald-200 text-emerald-800'}`}>{flagged ? 'Flagged' : 'Clear'}</span>
                                        </div>
                                        {plagiarismScore !== null && <p className="text-sm font-medium">Similarity score: <span className="font-bold">{plagiarismScore.toFixed(2)}%</span></p>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* My past submissions */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500" /> Past Submissions</h3>
                            {submissions.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-8">No submissions yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {submissions.map(s => (
                                        <div key={s.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="font-bold text-gray-900 text-sm">{s.assignment?.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Submitted: {new Date(s.submitted_at).toLocaleString()}</p>
                                            {s.grade && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"><Star size={11} /> Grade: {s.grade}</span>
                                                    {s.feedback && <span className="text-xs text-gray-600 italic">"{s.feedback}"</span>}
                                                </div>
                                            )}
                                            {!s.grade && <span className="mt-1 text-xs text-amber-600 font-bold">Awaiting grade</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* FACULTY: ALL SUBMISSIONS */}
                {activeTab === 'submissions' && user?.role === 'Faculty' && (
                    <div className="space-y-3">
                        {submissions.length === 0 && <p className="text-gray-400 text-center py-10">No student submissions yet.</p>}
                        {submissions.map(s => (
                            <div key={s.id} className="bg-white p-5 border border-gray-100 rounded-xl shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-gray-900">{s.student?.name}
                                        {s.student?.roll_number && <span className="text-xs text-gray-400 ml-2 font-normal">({s.student.roll_number})</span>}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-0.5">{s.assignment?.title} • Submitted: {new Date(s.submitted_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {s.grade ? (
                                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                                            <Star size={12} /> {s.grade}
                                        </span>
                                    ) : (
                                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-lg">Pending</span>
                                    )}
                                    <button onClick={() => { setSelectedSub(s); setGrade(s.grade || '0'); setFeedback(s.feedback || ''); setActiveTab('grading'); }}
                                        className="text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-all">
                                        {s.grade ? 'Re-grade' : 'Grade'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* FACULTY: GRADING PANEL */}
                {activeTab === 'grading' && user?.role === 'Faculty' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pick a submission */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><PenTool size={18} className="text-indigo-500" /> Select Submission to Grade</h3>
                            {submissions.length === 0 && <p className="text-gray-400 text-sm">No submissions available.</p>}
                            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {submissions.filter(s => !s.grade).map(s => (
                                    <button key={s.id} onClick={() => { setSelectedSub(s); setGrade(''); setFeedback(''); }}
                                        className={`w-full text-left p-3 rounded-xl border transition-all ${selectedSub?.id === s.id ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                        <p className="font-bold text-gray-900 text-sm">{s.student?.name}</p>
                                        <p className="text-xs text-gray-500">{s.assignment?.title}</p>
                                    </button>
                                ))}
                                {submissions.filter(s => !s.grade).length === 0 && <p className="text-emerald-600 text-sm font-medium text-center py-4">🎉 All submissions graded!</p>}
                            </div>
                        </div>

                        {/* Grade form */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Star size={18} className="text-amber-500" /> Grade Entry</h3>
                            {!selectedSub ? (
                                <p className="text-gray-400 text-sm text-center py-8">Select a submission on the left to begin grading.</p>
                            ) : (
                                <form onSubmit={handleGrade} className="space-y-4">
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <p className="font-bold text-gray-900 text-sm">{selectedSub.student?.name}</p>
                                        <p className="text-xs text-gray-500">{selectedSub.assignment?.title}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Grade (e.g. A, B+, 85)</label>
                                        <input type="text" value={grade} onChange={e => setGrade(e.target.value)} placeholder="Enter grade..." required
                                            className="w-full border ring-1 ring-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Feedback (optional)</label>
                                        <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Add feedback for the student..."
                                            className="w-full h-28 border ring-1 ring-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                                    </div>
                                    <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all">
                                        Save Grade
                                    </button>
                                    {gradingStatus && <p className="text-center text-emerald-600 text-sm font-bold">{gradingStatus}</p>}
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {/* FACULTY: CREATE ASSIGNMENT */}
                {activeTab === 'create' && user?.role === 'Faculty' && (
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-2xl mx-auto">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><PlusCircle size={18} className="text-indigo-500" /> Create New Assignment</h3>
                        <form onSubmit={handleCreateAssignment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Target Course</label>
                                <select value={selectedCourse || ''} onChange={e => setSelectedCourse(parseInt(e.target.value))}
                                    className="w-full border ring-1 ring-gray-200 rounded-xl p-3 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.course_code} – {c.course_name || c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                                <input type="text" placeholder="e.g. Midterm Essay" value={title} onChange={e => setTitle(e.target.value)}
                                    className="w-full border ring-1 ring-gray-200 rounded-xl p-3 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief instructions..."
                                    className="w-full h-24 border ring-1 ring-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Deadline</label>
                                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                                    className="w-full border ring-1 ring-gray-200 rounded-xl p-3 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" required />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="submit" className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all">Publish Assignment</button>
                                <button type="button" onClick={() => setActiveTab('active')} className="px-6 border border-gray-200 text-gray-600 p-3 rounded-xl font-bold hover:bg-gray-50 transition-all">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
