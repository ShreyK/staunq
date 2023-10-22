'use client';
import fetchData from '@/app/lib/fetch-data';
import fetchBinanceBook from '@/app/lib/fetch-orderbook';
import fetchTrades from '@/app/lib/fetch-trades';
import { useParams, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect } from 'react';
import { reduceOrderBook, reduceTrades } from '@/app/_ui/chart/chartUtils';
import { debounce, isEmpty, maxBy } from 'lodash';

const ChartContext = React.createContext(undefined);

export function ChartContextProvider({ params, children }) {
  const symbolParam = useParams()
  const search = useSearchParams()
  const intervalParam = search.get('interval')
  const parsedSymbol = params && params.toString().includes("/view/") ? params.split("/").pop() : "BTCUSDT"
  const [symbol, setSymbol] = React.useState(parsedSymbol);
  const [interval, setInterval] = React.useState(intervalParam);
  const [data, setData] = React.useState(null)
  const [trades, setTrades] = React.useState(null)
  const [orderBook, setOrderBook] = React.useState(null)
  const chartInstanceRef = React.useRef(null)
  const chartSeriesInstanceRef = React.useRef(null)
  const [precision, setPrecision] = React.useState(7)
  const [threshold, setThreshold] = React.useState(0)
  const [maxThreshold, setMaxThreshold] = React.useState(0)

  const updateInterval = (interval) => {
    if (!interval) {
      return;
    }
    React.startTransition(() => {
      setInterval(interval)
    })
  }

  const refetchData = debounce(async () => {
    if (!symbol) {
      return;
    }
    const data = await fetchData(symbol);
    React.startTransition(() => {
      setData(data)
    })
    return data
  }, 1000)

  const refetchTrades = useCallback(debounce(async (limit, from, to, scrollBack, scrollForward) => {
    if (!symbol || !interval) {
      return;
    }
    const trades = await fetchTrades(limit, symbol, interval, from, to);
    React.startTransition(() => {
      if (scrollBack || scrollForward) {
        const newDataSorted = reduceTrades(trades)
        if (newDataSorted.length === 0) {
          return
        }
        const currData = chartSeriesInstanceRef.current.data()
        let newData = newDataSorted.filter(e => {
          return !currData.some(item => item.time === e.time);
        });
        const mergedArrays = scrollBack ? [...newData, ...currData] : [...currData, ...newData]
        const mergedData = mergedArrays.sort((a, b) => a.time > b.time)
        setTrades(mergedData);
      }
      if (!scrollBack && !scrollForward) {
        setTrades(reduceTrades(trades))
      }
    })
    return reduceTrades(trades)
  }, 1000), [symbol, interval])

  const refetchOrderBook = debounce(async () => {
    if (!symbol) {
      return
    }
    const orderBook = await fetchBinanceBook(symbol);
    if (!orderBook) {
      return
    }
    const bids = reduceOrderBook(orderBook.bids, precision)
    const asks = reduceOrderBook(orderBook.asks, precision)
    if (isEmpty(bids) && isEmpty(asks)) {
      return
    }
    const maxAsk = maxBy(asks, (value) => {
      return value[1]
    })
    const maxBid = maxBy(bids, (value) => {
      return value[1]
    })
    const maxBidQuantity = Math.max(maxBid[1], maxAsk[1]).toPrecision(1)

    React.startTransition(() => {
      setMaxThreshold(maxBidQuantity)
      setOrderBook(orderBook)
      setThreshold(maxBidQuantity / 2)
    })
    return orderBook
  }, 1000)

  useEffect(() => {
    if (symbol && interval) {
      refetchData()
      refetchOrderBook()
      refetchTrades(1000)
    }
  }, [])

  useEffect(() => {
    React.startTransition(() => {
      setSymbol(symbolParam.id)
    })
  }, [symbolParam.id])

  useEffect(() => {
    console.log(search.get('interval'))
    if (search.get('interval')) {
      React.startTransition(() => {
        setInterval(search.get('interval'))
      })
    }
  }, [search])

  useEffect(() => {
    if (symbol && interval) {
      refetchData()
      refetchOrderBook()
      refetchTrades(1000)
    }
  }, [symbol, interval])

  const chartContext = {
    interval,
    updateInterval,
    data,
    refetchData,
    trades,
    refetchTrades,
    orderBook,
    refetchOrderBook,
    symbol,
    setSymbol,
    precision,
    setPrecision,
    threshold,
    setThreshold,
    maxThreshold,
    chartSeriesInstanceRef,
    chartInstanceRef
  }

  return (
    <ChartContext.Provider value={chartContext}>
      {children}
    </ChartContext.Provider>
  );
}

export function useChartContext() {
  const context = React.useContext(ChartContext);
  if (context === undefined) {
    throw new Error('useChartContext must be used within a ChartContextProvider');
  }
  return context;
}