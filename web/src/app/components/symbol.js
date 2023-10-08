'use client'
import styles from './card.module.css'
import { Suspense } from "react"

export async function Symbol({data, info, currentSymbol}) {
    let symbols = info.symbols

    return (
        <Suspense fallback={<div className={styles.cardBackground}>Loading...</div>}>
            <div className={styles.cardBackground}>
                <select defaultValue={currentSymbol} name={"symbols"} id={"symbolSelect"} onChange={(e) => {
                    console.log(e)
                    window.location.replace(`${window.location.origin}/view/${e.target.value}`)
                }}>
                    {symbols.map((value) => {
                        return (<option value={value.symbol}>{value.symbol}</option>)
                    })}
                    </select>

                    {currentSymbol}: {data && Number(data[0].price).toPrecision(7)}
            </div>
        </Suspense>
    )
}
