"use client";
import { useApp } from "../../context/AppContext";
import Attendance from "../../components/Attendance";

export default function AttendanceRoute() {
    const { user } = useApp();
    if (!user) return null;
    return <Attendance user={user} />;
}
