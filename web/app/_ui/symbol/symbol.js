'use client'
import { symbols } from '@/app/_utils/symbolUtils'
import styles from './symbol.module.css'
import { Suspense } from "react"
import { useRouter } from 'next/navigation'

export async function Symbol({ data, currentSymbol }) {
    const router = useRouter()
    let options = symbols

    const onSelect = (event) => {
        router.push(`${window.location.origin}/view/${event.target.value}?interval=1m`)
    }
    const onClick = () => {
        router.push(`${window.location.origin}/view/${currentSymbol}?interval=1m`)
    }

    return (
        <Suspense fallback={<div className={styles.cardBackground}>Loading...</div>}>
            <div className={styles.cardBackground}>
                <select id="symbolSelect" className={styles.minWidth} defaultValue={"BTCUSDT"} onChange={onSelect}>
                    {options.map((value) => {
                        return <option key={value.value} value={value.value}>{value.label}</option>
                    })}
                </select>
                <button className={styles.button} onClick={onClick}>Go</button>
            </div>
        </Suspense>
    )
}
