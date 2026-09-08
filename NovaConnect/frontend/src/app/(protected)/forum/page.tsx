"use client";
import { useApp } from "../../context/AppContext";
import Forum from "../../components/Forum";

export default function ForumRoute() {
    const { user } = useApp();
    if (!user) return null;
    return <Forum user={user} />;
}
