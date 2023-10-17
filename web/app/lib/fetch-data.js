'use server'
import { cache } from 'react'

const fetchData = cache(async (symbol) => {
    const res = await fetch(
        `https://data-api.binance.vision/api/v3/trades?symbol=${symbol}`,
        {
            next: {
                revalidate: 1000
            }
        }
    )

    if (res.status !== 200) {
        throw new Error(`Status ${res.status}`)
    }
    return res.json()
})

export default fetchData