"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
    const [token, setToken] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem("admin_token");
        if (!storedToken) {
            router.push("/admin/login");
        } else {
            setToken(storedToken);
        }
    }, [router]);

    const logout = () => {
        localStorage.removeItem("admin_token");
        router.push("/admin/login");
    };

    return { token, logout };
}
