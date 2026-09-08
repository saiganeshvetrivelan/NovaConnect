"use client";
import { useApp } from "../../context/AppContext";
import Dashboard from "../../components/Dashboard";
import AdminDashboard from "../../components/AdminDashboard";

export default function DashboardRoute() {
    const { user } = useApp();

    if (!user) return null;

    if (user.role === 'Admin') {
        return <AdminDashboard user={user} />;
    }

    return <Dashboard user={user} />;
}
