"use client";
import { useApp } from "../../context/AppContext";
import Courses from "../../components/Courses";

export default function CoursesRoute() {
    const { user } = useApp();

    if (!user) return null;

    return <Courses user={user} />;
}
