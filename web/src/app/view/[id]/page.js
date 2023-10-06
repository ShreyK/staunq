import fetchBinanceBook from '@/app/lib/fetch-orderbook';
import fetchData from '@/app/lib/fetch-data'
import styles from './view.module.css'
import { Chart } from '@/app/components/chart';
import fetchTrades from '@/app/lib/fetch-trades';
import { Card } from '@/app/components/card';

export const dynamicParams = true;

export async function generateStaticParams() {
    return [1];
}

export default async function ViewPage({ params }) {
    const { page } = params
    const trades = await fetchTrades('')
    const orderBook = await fetchBinanceBook('')

    //   const socket = io("wss://stream.binance.com:9443", {
    //   reconnectionDelayMax: 3000,
    // //   query: {
    // //     "my-key": "my-value"
    // //   }
    // });
    // socket.connect()

    // socket.on('connection', (socket) =>{
    //     console.log('socket connected', socket.id)
    // })

    // console.log(trades)

    return (
        <>
            <Card />
            <Chart trades={trades} orderBook={orderBook}></Chart>
            {/* <div className={styles.cardBackground}>
            </div>

            <div className={styles.cardBackground}>
                {orderBook.asks}
            </div> */}
        </>
    )
}