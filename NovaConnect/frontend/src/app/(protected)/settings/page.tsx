"use client";
import { useApp } from "../../context/AppContext";
import Settings from "../../components/Settings";

export default function SettingsRoute() {
    const { user } = useApp();
    if (!user) return null;
    return <Settings user={user} />;
}
