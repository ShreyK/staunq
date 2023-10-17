'use client'
import { symbols } from '@/app/_utils/symbolUtils'
import styles from './symbol.module.css'
import { Suspense, cache } from "react"
import Select, { defaultTheme } from 'react-select'

export async function Symbol({ data, currentSymbol }) {

    let options = symbols

    return (
        <Suspense fallback={<div className={styles.cardBackground}>Loading...</div>}>
            <div className={styles.cardBackground}>
                <Select theme={{ ...defaultTheme, colors: { primary: 'black', neutral0: 'black' } }} options={options} defaultValue={{ value: currentSymbol, label: currentSymbol }} name={"symbols"} id={"symbolSelect"} onChange={(e) => {
                    window.location.replace(`${window.location.origin}/view/${e.value}`)
                }} />
                <button className={styles.button} onClick={(e) => { return window.location.replace(`${window.location.origin}/view/${currentSymbol}`) }}>Go</button>

            </div>
        </Suspense>
    )
}
