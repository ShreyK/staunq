// 'use server'

// // const fetchTrades = cache(async () => {
// //     const res = await fetch(
// //         `https://data-api.binance.vision/api/v3/exchangeInfo`,
// //         {
// //             next: {
// //                 revalidate: ['info']
// //             }
// //         }
// //     )

// //     if (res.status !== 200) {
// //         throw new Error(`Status ${res.status}`)
// //     }
// //     return res.json()
// // })
// // export default fetchTrades

// export default fetchTrades