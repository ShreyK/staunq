'use client'
import styles from './chart.module.css'
import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useChartContext } from '@/app/_ui/context/chartContext';
import { debounce, isEmpty } from 'lodash';
import { reduceTrades, colors, candlestickOptions, reduceOrderBook, renderOrderBookData, clearPricelines } from './chartUtils';
import { usePathname } from 'next/navigation';

export async function BaseChart() {
  const rightMarginPosition = 20;
  const path = usePathname()
  const { chartInstanceRef, chartSeriesInstanceRef, precision, orderBook, trades, threshold, interval, symbol, refetchTrades, refetchOrderBook } = useChartContext()

  if (!trades || !orderBook || !symbol) {
    return <></>
  }
  const chartContainerRef = useRef(null);
  const intervalTime = 10000
  const [priceLineArray, _] = useState([])
  const intervalRef = useRef(null)
  const orderBookIntervalRef = useRef(null)
  const syncTimeout = useRef(null);

  const startDataFetchingInterval = useCallback(debounce(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    if (syncTimeout.current) {
      clearTimeout(syncTimeout.current)
    }
    const currTime = Date.now()
    const nextTime = currTime + (intervalTime - currTime % intervalTime)
    syncTimeout.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        startTransition(async () => {
          const currData = chartSeriesInstanceRef.current.data()
          const step = currData[1].time - currData[0].time
          const lastTime = currData[currData.length - 1].time
          await refetchTrades(2, lastTime, lastTime + 100 * step, false, true)
        });
      }, intervalTime);
    }, nextTime - currTime)
  }, 1000), [interval, symbol, chartSeriesInstanceRef.current])

  const startOrderBookFetchingInterval = useCallback(debounce(() => {
    if (orderBookIntervalRef.current) {
      clearInterval(orderBookIntervalRef.current)
    }
    orderBookIntervalRef.current = setInterval(() => {
      startTransition(async () => {
        if (!chartSeriesInstanceRef.current) {
          return;
        }
        chartSeriesInstanceRef.current.applyOptions({
          localization: {
            priceFormatter: (price) => {
              return price.toPrecision(precision)
            }
          }
        })
        await refetchOrderBook()
      });
    }, intervalTime, precision, threshold);
  }, 1000), [precision, threshold])

  const onVisibleLogicalRangeChange = useCallback(debounce(async (newVisibleLogicalRange) => {
    if (newVisibleLogicalRange !== null && !!chartInstanceRef.current) {
      const dataSorted = chartSeriesInstanceRef.current.data()
      let barsInfo = chartSeriesInstanceRef.current.barsInLogicalRange(newVisibleLogicalRange);
      if (barsInfo !== null && barsInfo.barsBefore < 0) {
        const firstTime = dataSorted[0].time
        const step = dataSorted[1].time - dataSorted[0].time
        const to = firstTime - step
        const from = firstTime - step * 1000
        await refetchTrades(1000, from, to, true, false)
      }
    }
  }, 1000), [interval, symbol])

  //----------------------Effects----------------------//
  useEffect(() => {
    const chartWidth = window.innerWidth < 700 ? window.innerWidth : window.innerWidth * 3 / 4
    const chartHeight = window.innerWidth < 700 ? window.innerHeight / 2 : window.innerHeight / 1.2
    const handleResize = () => {
      startTransition(() => {
        chartInstanceRef.current.applyOptions({ width: window.innerWidth < 700 ? window.innerWidth : window.innerWidth * 3 / 4, height: window.innerWidth < 700 ? window.innerHeight / 2 : window.innerHeight / 1.2 });
      })
    };
    startTransition(() => {
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
        width: chartWidth,
        height: chartHeight,
        leftPriceScale: { autoScale: false, ticksVisible: true, visible: true },
        rightPriceScale: { autoScale: false, ticksVisible: true, visible: false },
        handleScale: true,
        handleScroll: true,
        localization: {
          priceFormatter: (price) => {
            return price.toPrecision(precision)
          },
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
      chartSeriesInstanceRef.current = chartInstanceRef.current.addCandlestickSeries(candlestickOptions);
      chartInstanceRef.current.timeScale().subscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange)
      chartInstanceRef.current.timeScale().scrollToRealTime()
      chartInstanceRef.current.timeScale().scrollToPosition(rightMarginPosition, true)
      window.addEventListener('resize', handleResize);
    })
    return () => {
      startTransition(() => {
        window.removeEventListener('resize', handleResize);
      })
      if (chartInstanceRef.current) {
        startTransition(() => {
          chartInstanceRef.current.timeScale().unsubscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange)
          chartInstanceRef.current.remove();
        })
      }
      chartInstanceRef.current = null
      chartSeriesInstanceRef.current = null

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (syncTimeout.current) {
        clearTimeout(syncTimeout.current)
      }
      if (orderBookIntervalRef.current) {
        clearInterval(orderBookIntervalRef.current)
      }
      intervalRef.current = null
      orderBookIntervalRef.current = null
      syncTimeout.current = null
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      if (trades && chartInstanceRef.current && chartSeriesInstanceRef.current) {
        chartSeriesInstanceRef.current.setData(trades);
        chartInstanceRef.current.timeScale().scrollToRealTime()
        chartInstanceRef.current.timeScale().scrollToPosition(rightMarginPosition, true)
        // chartInstanceRef.current.timeScale().scrollToPosition(rightMarginPosition, true)
      }
    })
    startDataFetchingInterval(interval)
  }, [symbol, trades, orderBook, interval])

  useEffect(() => {
    startTransition(() => {
      clearPricelines(priceLineArray, chartSeriesInstanceRef.current)
      const bids = reduceOrderBook(orderBook.bids, precision)
      const asks = reduceOrderBook(orderBook.asks, precision)
      renderOrderBookData(priceLineArray, colors.upColor, bids, precision, threshold, chartInstanceRef.current, chartSeriesInstanceRef.current)
      renderOrderBookData(priceLineArray, colors.downColor, asks, precision, threshold, chartInstanceRef.current, chartSeriesInstanceRef.current)
    })
    startOrderBookFetchingInterval()
  }, [orderBook, precision, threshold])

  return (<div
    ref={chartContainerRef}
    className={styles.chart + " " + (path.includes("/view") ? "" : styles.invisibleChart)}>
  </div>)
};