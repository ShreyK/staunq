'use client'
import { symbols } from '@/app/_utils/symbolUtils'
import styles from './symbol.module.css'
import { Suspense } from "react"

export async function Symbol({ data, currentSymbol }) {

    let options = symbols

    return (
        <Suspense fallback={<div className={styles.cardBackground}>Loading...</div>}>
            <div className={styles.cardBackground}>

                <select id="symbolSelect" className={styles.minWidth} defaultValue={"BTCUSDT"} onChange={(event) => {
                    window.location.replace(`${window.location.origin}/view/${event.target.value}`)
                }}>
                    {options.map((value) => {
                        return <option key={value.value} value={value.value}>{value.label}</option>
                    })}
                </select>
                <button className={styles.button} onClick={(e) => { return window.location.replace(`${window.location.origin}/view/${currentSymbol}`) }}>Go</button>

            </div>
        </Suspense>
    )
}
