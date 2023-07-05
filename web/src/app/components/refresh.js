"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function Refresh() {
    const router = useRouter()
    useEffect(() => {
        const handle = setInterval(async () => {
            router.replace(window.location.href)
        }, 30000);

        return () => {
            clearInterval(handle)
        };
    }, []);

    return <></>;
}