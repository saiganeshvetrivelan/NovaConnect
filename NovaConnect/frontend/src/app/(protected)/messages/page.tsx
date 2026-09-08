"use client";
import { useApp } from "../../context/AppContext";
import Messaging from "../../components/Messaging";

export default function MessagesRoute() {
    const { user } = useApp();
    if (!user) return null;
    return <Messaging user={user} />;
}
