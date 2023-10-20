'use client'
import styles from './chart.module.css'

import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { createChart, ColorType, LineStyle } from 'lightweight-charts';
import fetchTrades from '../lib/fetch-trades';
import fetchBinanceBook from '../lib/fetch-orderbook';
import Chat from './chat';
import { reduceOrderBook, reduceOrderBookForAI, reduceTrades, renderOrderBookData, reloadData, clearPricelines } from './chartActions';
import { intervals } from './symbolUtils';
import { Interval } from './interval';
import { debounce } from 'lodash';

export async function Chart({ trades, orderBook, symbol, defaultInterval }) {
  const rightMarginPosition = 20;
  const colors = {
    backgroundColor: 'black',
    lineColor: '#1A1A1A',
    textColor: 'white',
    areaTopColor: '#2962FF',
    upColor: {
      lineColor: '#26a69a33'
    },
    downColor: {
      lineColor: '#ef535033'
    },
    areaBottomColor: 'rgba(41, 98, 255, 0.28)',
  }
  const [currInterval, setCurrInterval] = useState(defaultInterval)
  const [threshold, setThreshold] = useState(10)
  const [precision, setPrecision] = useState(7)
  const [priceLineArray, _] = useState([])
  const dataSorted = reduceTrades(trades)
  const bids = reduceOrderBook(orderBook.bids, precision)
  const asks = reduceOrderBook(orderBook.asks, precision)

  const chartInstanceRef = useRef(null)
  const chartSeriesInstanceRef = useRef(null)
  const intervalRef = useRef(null)
  const orderBookIntervalRef = useRef(null)
  const chartContainerRef = useRef(null);

  //----------------------Callbacks----------------------//
  const startDataFetchingInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    intervalRef.current = setInterval(() => {
      startTransition(async () => {
        const currData = chartSeriesInstanceRef.current.data()
        const tradesResponse = await fetchTrades(symbol, currInterval)
        const dataSorted = tradesResponse.sort((a, b) => a[0] > b[0]).map((value) => ({ time: Number(value[0]), open: Number(value[1]), high: Number(value[2]), low: Number(value[3]), close: Number(value[4]) }))

        if (dataSorted[dataSorted.length - 1].time <= currData[currData.length - 1].time) {
          return
        }


        let dataFiltered = dataSorted.reduce((arr, curr) => {
          const time = new Date(curr.x)
          const getTimeIndex = (time) => {
            return time.getYear() + time.getMonth() + time.getDate() + time.getHours() + time.getMinutes()
          }
          let itemIndex = arr.findIndex(item => getTimeIndex(new Date(item[0])) === getTimeIndex(time));
          if (itemIndex !== -1) {
            arr[itemIndex] = { ...curr }
          } else {
            arr.push({ ...curr })
          }

          return arr
        }, [])
        let newData = dataFiltered.filter(e => {
          return !currData.some(item => item.x === e.x);
        });

        if (newData.length === 0) {
          return
        }
        const prevValue = currData[currData.length - 1]
        const value = newData[newData.length - 1]

        if (value.time === prevValue.time) {
          return
        }
        if (value.open > prevValue.close) {
          value.low = prevValue.close
        }
        if (value.open < prevValue.close) {
          value.high = prevValue.close
        }
        chartSeriesInstanceRef.current.update(value);
      });
    }, 60000);
  }

  const updateInterval = (value) => {
    startTransition(() => {
      chartInstanceRef.current.timeScale().unsubscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange)
      setCurrInterval(value)
      const range = chartInstanceRef.current.timeScale().getVisibleRange()
      let from = range.from
      const now = Date.now()
      if (value !== intervals['1m'] && value !== intervals['1s']) {
        const date = new Date(now)
        from = date.setMonth(date.getMonth() - 1)
        if (value === intervals['1M']) {
          from = date.setYear(date.getYear() - 1)
        }
      }
      chartInstanceRef.current.timeScale().setVisibleRange({ from: from, to: now })
      chartSeriesInstanceRef.current.setData([])
      chartInstanceRef.current.timeScale().scrollToPosition(rightMarginPosition, true)
      reloadData(symbol, chartSeriesInstanceRef.current, value, from, now, true)
      startDataFetchingInterval(value)
    })
  }

  const onVisibleLogicalRangeChange = useCallback(debounce((newVisibleLogicalRange) => {
    if (newVisibleLogicalRange !== null && !!chartInstanceRef.current) {
      const dataSorted = chartSeriesInstanceRef.current.data()
      let barsInfo = chartSeriesInstanceRef.current.barsInLogicalRange(newVisibleLogicalRange);
      if (barsInfo !== null && barsInfo.barsBefore < 0) {
        const firstTime = dataSorted[0].time
        const step = dataSorted[1].time - dataSorted[0].time
        const to = firstTime - step
        const from = firstTime - step * 100
        reloadData(symbol, chartSeriesInstanceRef.current, currInterval, from, to)
      }
    }
  }, 1000), [currInterval])


  //----------------------Effects----------------------//
  useEffect(() => {
    chartInstanceRef.current = createChart(chartContainerRef.current, {
      autoSize: false,
      layout: {
        background: { type: ColorType.Solid, color: colors.backgroundColor },
        textColor: colors.textColor,
      },
      grid: {
        vertLines: { color: colors.lineColor },
        horzLines: { color: colors.lineColor }
      },
      width: window.innerWidth < 700 ? window.innerWidth : window.innerWidth * 3 / 4,
      height: window.innerWidth < 700 ? window.innerHeight / 2 : window.innerHeight / 1.2,
      leftPriceScale: { autoScale: false, ticksVisible: true, visible: true },
      rightPriceScale: { autoScale: false, ticksVisible: true, visible: false },
      handleScale: true,
      handleScroll: true,
      localization: {
        timeFormatter: (time) => {
          const date = new Date(time)
          const min = ('0' + date.getMinutes()).slice(-2)
          const sec = ('0' + date.getSeconds()).slice(-2)
          const renderSec = sec === "00" ? "" : `:${sec}`
          return date.toLocaleString('en-us', { month: 'short' }) + " " + date.getDate() + " " + date.getHours() + ":" + min + renderSec
        }
      },
      timeScale: {
        secondsVisible: true,
        timeVisible: true,
        shiftVisibleRangeOnNewBar: true,
        ticksVisible: true,
        tickMarkFormatter: (time, tickMarkType, locale) => {
          // Year = 0, Month = 1, DayOfMonth = 2,Time = 3,TimeWithSeconds = 4
          const date = new Date(time)
          const min = ('0' + date.getMinutes()).slice(-2)
          const sec = ('0' + date.getSeconds()).slice(-2)
          switch (tickMarkType) {
            case 1:
              return date.getHours() + ":" + min
            case 2:
              return date.getHours() + ":" + min
            case 3:
              return date.getHours() + ":" + min
            case 4:
              return date.getHours() + ":" + min + ":" + sec
            default:
              return date.toLocaleDateString(locale)
          }
        }
      },
    });
    chartInstanceRef.current.timeScale().scrollToPosition(rightMarginPosition, true)

    chartSeriesInstanceRef.current = chartInstanceRef.current.addCandlestickSeries({ upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' });
    chartSeriesInstanceRef.current.setData(dataSorted);

    renderOrderBookData(priceLineArray, colors.upColor, bids, precision, threshold, chartInstanceRef.current, chartSeriesInstanceRef.current)
    renderOrderBookData(priceLineArray, colors.downColor, asks, precision, threshold, chartInstanceRef.current, chartSeriesInstanceRef.current)

    startDataFetchingInterval(currInterval)

    const handleResize = () => {
      chartInstanceRef.current.applyOptions({ width: window.innerWidth < 700 ? window.innerWidth : window.innerWidth * 3 / 4, height: window.innerWidth < 700 ? window.innerHeight / 2 : window.innerHeight / 1.2 });
    };
    startTransition(() => {
      window.addEventListener('resize', handleResize);
    })

    return () => {
      startTransition(() => {
        window.removeEventListener('resize', handleResize);

      })
      if (chartInstanceRef.current) {
        startTransition(() => {
          chartInstanceRef.current.remove();

        })
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (orderBookIntervalRef.current) {
        clearInterval(orderBookIntervalRef.current)
      }
      chartInstanceRef.current = null
      chartSeriesInstanceRef.current = null
      intervalRef.current = null
      orderBookIntervalRef.current = null
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      chartInstanceRef.current.timeScale().subscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange)
    })
    return () => {
      if (chartInstanceRef.current !== null) {
        startTransition(() => {
          chartInstanceRef.current.timeScale().unsubscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange)
        })
      }
    }
  }, [currInterval])

  useEffect(() => {
    if (!chartSeriesInstanceRef.current) {
      return;
    }
    clearPricelines(priceLineArray, chartSeriesInstanceRef.current)
    renderOrderBookData(priceLineArray, colors.upColor, bids, precision, threshold, chartInstanceRef.current, chartSeriesInstanceRef.current)
    renderOrderBookData(priceLineArray, colors.downColor, asks, precision, threshold, chartInstanceRef.current, chartSeriesInstanceRef.current)

    if (orderBookIntervalRef.current) {
      clearInterval(orderBookIntervalRef.current)
    }
    orderBookIntervalRef.current = setInterval(() => {
      startTransition(async () => {
        if (!chartSeriesInstanceRef.current) {
          return;
        }
        const orderBookResponse = await fetchBinanceBook(symbol)
        const bids = reduceOrderBook(orderBookResponse.bids, precision)
        const asks = reduceOrderBook(orderBookResponse.asks, precision)
        clearPricelines(priceLineArray, chartSeriesInstanceRef.current)
        renderOrderBookData(priceLineArray, colors.upColor, bids, precision, threshold, chartInstanceRef.current, chartSeriesInstanceRef.current)
        renderOrderBookData(priceLineArray, colors.downColor, asks, precision, threshold, chartInstanceRef.current, chartSeriesInstanceRef.current)
      });
    }, 60000, precision, threshold);
    return () => {
      if (orderBookIntervalRef.current) {
        clearInterval(orderBookIntervalRef.current)
      }
      orderBookIntervalRef.current = null
    }
  }, [precision, threshold])

  return (
    <>
      <div className={styles.chartActions}>
        <label>Precision: {precision}
          <input title='Precision' type={"range"} min="3" max="7" value={precision} onChange={(e) => startTransition(() => setPrecision(e.target.value))} />
        </label>
        <label>Min {symbol}:  {threshold}
          <input title='Threshold' type={"range"} min="0.5" max="20" step={.5} value={threshold} onChange={(e) => startTransition(() => setThreshold(e.target.value))} />
        </label>
        <Interval currInterval={currInterval} setCurrInterval={updateInterval} />
      </div>
      <div
        ref={chartContainerRef}
        className={styles.chart}>
      </div>
      <Chat symbol={symbol} trades={dataSorted} bids={reduceOrderBookForAI(orderBook.bids)} asks={reduceOrderBookForAI(orderBook.asks)} />
    </>
  );
};