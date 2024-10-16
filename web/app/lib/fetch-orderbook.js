'use server'
import { cache } from 'react'

const fetchBinanceBook = cache(async (defaultSymbol) => {
    const res = await fetch(
        `https://data-api.binance.vision/api/v3/depth?symbol=${defaultSymbol}&limit=5000`,
        {
            next: {
                revalidate: 1000
            }
        }
    )

    if (res.status !== 200) {
        throw new Error(`Status ${res.status}`)
    }
    return res.json();
})

export default fetchBinanceBook;