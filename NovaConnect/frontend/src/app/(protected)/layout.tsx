"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import AIChatAssistant from "../components/AIChatAssistant";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoadingAuth, logout } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!isLoadingAuth && !user) {
            router.push("/");
        }
    }, [user, isLoadingAuth, router]);

    if (isLoadingAuth || !user) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
            <Sidebar role={user.role} />
            
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <TopBar user={user} onLogout={() => { logout(); router.push('/'); }} />
                
                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto pb-12">
                        {children}
                    </div>
                </main>
            </div>
            {/* AI Chat Assistant - available on all pages */}
            <AIChatAssistant />
        </div>
    );
}
