import fetchBinanceBook from '@/app/lib/fetch-orderbook';
// import { Chart } from '@/app/components/chart';
import fetchTrades from '@/app/lib/fetch-trades';
import { Symbol } from '@/app/components/symbol';
import fetchData from '@/app/lib/fetch-data';
// import { SvgChart } from '@/app/components/svgChart';
import { intervals } from '@/app/components/symbolUtils';
import { Chart } from '@/app/components/chart';

export const dynamicParams = true;

export default async function ViewPage(props) {
    const defaultSymbol = props?.params?.id ?? "BTCUSDT"
    const defaultInterval = intervals["5m"]
    const data = await fetchData(defaultSymbol)
    const trades = await fetchTrades(defaultSymbol, defaultInterval)
    const orderBook = await fetchBinanceBook(defaultSymbol)

    return (
        <>
            <Symbol data={data} currentSymbol={defaultSymbol} />
            {/* <SvgChart symbol={defaultSymbol} trades={trades} orderBook={orderBook} interval={intervals['1m']} /> */}
            <Chart symbol={defaultSymbol} trades={trades} orderBook={orderBook} defaultInterval={defaultInterval} />
        </>
    )
}