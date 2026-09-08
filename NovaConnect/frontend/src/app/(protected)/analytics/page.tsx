"use client";
import { useApp } from "../../context/AppContext";
import Analytics from "../../components/Analytics";

export default function AnalyticsRoute() {
    const { user } = useApp();
    if (!user) return null;
    return <Analytics user={user} />;
}
