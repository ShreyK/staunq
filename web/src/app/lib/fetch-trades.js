'use server'
import { cache } from 'react'

// https://developer.mozilla.org/docs/Web/API/ReadableStream#convert_async_iterator_to_stream
function iteratorToStream(iterator) {
    return new ReadableStream({
        async pull(controller) {
            const { value, done } = await iterator.next()

            if (done) {
                controller.close()
            } else {
                controller.enqueue(value)
            }
        },
    })
}

const fetchTrades = cache(async () => {
    const res = await fetch(
        `https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1s`,
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
    // const stream = iteratorToStream(res.body)
    // return new Response(stream)
})
export default fetchTrades