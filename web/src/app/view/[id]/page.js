import fetchBinanceBook from '@/app/lib/fetch-orderbook';
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
    return (
        <>
            <Card />
            <Chart trades={trades} orderBook={orderBook} />
        </>
    )
}