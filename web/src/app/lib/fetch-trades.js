'use server'
import { cache } from 'react'

const fetchTrades = cache(async (defaultSymbol, interval) => {
    const res = await fetch(
        `https://data-api.binance.vision/api/v3/klines?symbol=${defaultSymbol}&interval=${interval}`,
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
    // const stream = iteratorToStream(res.body)
    // return new Response(stream)
})
export default fetchTrades