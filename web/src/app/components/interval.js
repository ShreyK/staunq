'use client'

import styles from './card.module.css'
import { Suspense, cache } from "react"
import Select, { defaultTheme } from 'react-select'
import { intervalsOptions } from './symbolUtils'

export async function Interval({ currInterval, setCurrInterval }) {

    let options = intervalsOptions

    return (
        <Suspense fallback={<div className={styles.cardBackground}>Loading...</div>}>
            <Select theme={{ ...defaultTheme, colors: { primary: 'black', neutral0: 'black' } }} options={options} defaultValue={{ value: currInterval, label: currInterval }} name={"symbols"} id={"symbolSelect"} onChange={(e) => {
                setCurrInterval(e.value)
            }} />
        </Suspense>
    )
}
