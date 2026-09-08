"use client";
import { useApp } from "../../context/AppContext";
import Resources from "../../components/Resources";

export default function ResourcesRoute() {
    const { user } = useApp();
    if (!user) return null;
    return <Resources user={user} />;
}
