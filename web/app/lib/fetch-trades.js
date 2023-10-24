'use server'
import { cache } from 'react'

const fetchTrades = cache(async (limit, defaultSymbol, interval, startTime, endTime) => {
    let url = `https://data-api.binance.vision/api/v3/uiKlines?symbol=${defaultSymbol}&interval=${interval}&limit=${limit}`;
    if (startTime || endTime) {
        url = `https://data-api.binance.vision/api/v3/uiKlines?symbol=${defaultSymbol}&interval=${interval}&limit=${limit}&startTime=${startTime}&endTime=${endTime}`
    }
    const res = await fetch(
        url,
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
export default fetchTrades