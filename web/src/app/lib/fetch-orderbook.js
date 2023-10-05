import { cache } from 'react'
import 'server-only'

const fetchBinanceBook = cache(async () => {
    const res = await fetch(
        `https://data-api.binance.vision/api/v3/depth?symbol=BTCUSDT`,
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

export default fetchBinanceBook