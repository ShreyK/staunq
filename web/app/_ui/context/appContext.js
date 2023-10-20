'use client';

import { intervals } from '@/app/_utils/symbolUtils';
import fetchData from '@/app/lib/fetch-data';
import fetchBinanceBook from '@/app/lib/fetch-orderbook';
import fetchTrades from '@/app/lib/fetch-trades';
import React, { useEffect } from 'react';

const AppContext = React.createContext(undefined);

export function AppContextProvider({ params, children }) {
  const parsedSymbol = params && params.toString().includes("/view/") ? params.split("/").pop() : "BTCUSDT"
  const [symbol, setSymbol] = React.useState(parsedSymbol);
  const [interval, setInterval] = React.useState(intervals["5m"]);
  const [data, setData] = React.useState(null)
  const [trades, setTrades] = React.useState(null)
  const [orderBook, setOrderBook] = React.useState(null)

  const updateInterval = (interval) => {
    React.startTransition(() => {
      setInterval(interval)
    })
  }

  const refetchData = async () => {
    const data = await fetchData(symbol);
    React.startTransition(() => {
      setData(data)
    })
    return data
  }

  const refetchTrades = async (symbol, interval, from, to) => {
    const trades = await fetchTrades(symbol, interval, from, to);
    React.startTransition(() => {
      setTrades(trades)
    })
    return trades
  }

  const refetchOrderBook = async () => {
    const orderBook = await fetchBinanceBook(symbol);
    React.startTransition(() => {
      setOrderBook(orderBook)
    })
    return orderBook
  }

  useEffect(() => {
    refetchData()
    refetchOrderBook()
    refetchTrades(symbol, interval)
  }, [])

  const appContext = {
    interval,
    updateInterval,
    data,
    refetchData,
    trades,
    refetchTrades,
    orderBook,
    refetchOrderBook,
    symbol,
    setSymbol
  }
  return (
    <AppContext.Provider value={appContext}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within a AppContextProvider');
  }
  return context;
}