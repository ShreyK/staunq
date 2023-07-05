import { cache } from 'react'
import 'server-only'

const fetchData = cache(async () => {
    const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&x_cg_api_key=${process.env.API_KEY}`,
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