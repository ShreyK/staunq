import fetchData from '../lib/fetch-data'
import styles from './card.module.css'
import { Suspense } from "react"

export async function Card(props) {
    let data = await fetchData()
    return (
        <Suspense fallback={<div className={styles.cardBackground}>Loading...</div>}>
            <div className={styles.cardBackground}>
                BTC: {data && Number(data[0].price).toPrecision(7)}
            </div>
        </Suspense>
    )
}
