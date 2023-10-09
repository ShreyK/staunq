import fetchBinanceBook from '@/app/lib/fetch-orderbook';
import { Chart } from '@/app/components/chart';
import fetchTrades from '@/app/lib/fetch-trades';
import { Symbol } from '@/app/components/symbol';
import fetchData from '@/app/lib/fetch-data';

export const dynamicParams = true;

export default async function ViewPage(props) {
    const defaultSymbol = props?.params?.id ?? "BTCUSDT"
    const data = await fetchData(defaultSymbol)
    const trades = await fetchTrades(defaultSymbol)
    const orderBook = await fetchBinanceBook(defaultSymbol)

    return (
        <>
            <Symbol data={data} currentSymbol={defaultSymbol} />
            <Chart symbol={defaultSymbol} trades={trades} orderBook={orderBook} />
        </>
    )
}