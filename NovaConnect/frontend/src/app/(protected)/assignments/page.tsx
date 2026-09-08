"use client";
import { useApp } from "../../context/AppContext";
import AssignmentUI from "../../components/AssignmentUI";

export default function AssignmentsRoute() {
    const { user } = useApp();
    if (!user) return null;
    return <AssignmentUI user={user} />;
}
