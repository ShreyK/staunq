"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from './spinner.module.css';

export const REFRESH_RATE = 10000

export function Refresh() {
    const [refreshing, setRefreshing] = useState(false)
    const router = useRouter()
    useEffect(() => {
        const handle = setInterval(() => {
            setRefreshing(true)
        }, REFRESH_RATE);

        return () => {
            clearInterval(handle)
        };
    }, []);

    useEffect(() => {
        const handle = setInterval(() => {
            if(refreshing){
                router.replace(window.location.href)
                setRefreshing(false)
            }
        }, 500);
        return () => {
            clearInterval(handle)
        };
    }, [refreshing])

    return <>{refreshing ? <div className={styles.spinner} /> : ""}</>;
}