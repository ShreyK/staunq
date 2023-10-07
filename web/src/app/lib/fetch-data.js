'use server'
import { cache } from 'react'

const fetchData = cache(async () => {
    const res = await fetch(
        `https://data-api.binance.vision/api/v3/trades?symbol=BTCUSDT`,
        {
            next: {
                revalidate: 10
            }
        }
    )

    if (res.status !== 200) {
        throw new Error(`Status ${res.status}`)
    }
    return res.json()
})

export default fetchData