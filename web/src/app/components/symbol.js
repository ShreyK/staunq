'use client'
import styles from './card.module.css'
import { Suspense } from "react"
import Select, { defaultTheme } from 'react-select'

export async function Symbol({ data, info, currentSymbol }) {
    let symbols = info?.symbols

    const options = symbols?.map((value) => {
        return { value: value.symbol, label: value.symbol }
    })

    return (
        <Suspense fallback={<div className={styles.cardBackground}>Loading...</div>}>
            <div className={styles.cardBackground}>
                <Select theme={{ ...defaultTheme, colors: { primary: 'black', neutral0: 'black' } }} options={options} defaultValue={{ value: currentSymbol, label: currentSymbol }} name={"symbols"} id={"symbolSelect"} onChange={(e) => {
                    window.location.replace(`${window.location.origin}/view/${e.value}`)
                }} />
                Price: {data && Number(data[0].price).toPrecision(7)}
            </div>
        </Suspense>
    )
}
