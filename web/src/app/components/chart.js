'use client'
import styles from './chart.module.css'

import { startTransition, useEffect, useRef, useState } from 'react';
import { createChart, ColorType, LineStyle } from 'lightweight-charts';
import fetchTrades from '../lib/fetch-trades';
import fetchBinanceBook from '../lib/fetch-orderbook';
import Chat from './chat';
import { reduceOrderBookForAI } from './chartActions';

export async function Chart({ trades, orderBook, symbol }) {
	const colors = {
		backgroundColor: 'black',
		lineColor: '#1A1A1A',
		textColor: 'white',
		areaTopColor: '#2962FF',
		areaBottomColor: 'rgba(41, 98, 255, 0.28)',
	}

	const rightMarginPosition = 20;
	const chartContainerRef = useRef();
	const [threshold, setThreshold] = useState(5)
	const [precision, setPrecision] = useState(5)
	const dataSorted = trades.sort((a, b) => a[0] > b[0]).map((value) => ({ time: Number(value[0]), open: Number(value[1]), high: Number(value[2]), low: Number(value[3]), close: Number(value[4]) }))
	const chartInstanceRef = useRef(null)
	const chartSeriesInstanceRef = useRef(null)
	const intervalRef = useRef(null)
	const [priceLineArray, _] = useState([])

	const handleResize = () => {
		chartInstanceRef.current?.applyOptions({ width: chartContainerRef.current.clientWidth });
	};

	const reduceOrderBook = (array) => {
		return array.map((value) => [Number(value[0]).toPrecision(precision), Number(value[1])])
			.reduce((arr, curr) => {
				const price = curr[0]
				const quantity = curr[1]
				let itemIndex = arr.findIndex(item => item[0] === price);
				if (itemIndex !== -1) {
					arr[itemIndex] = [price, arr[itemIndex][1] + quantity]
				} else {
					arr.push([price, quantity])
				}
				return arr
			}, [])
	}
	const renderOrderBookData = (lineColor, reducedArray, dataSorted) => {
		reducedArray.map((value) => {
			const price = value[0]
			const quantity = value[1].toPrecision(4)
			if (Number(value[1]) < threshold) {
				return null
			}

			if (chartInstanceRef.current && chartSeriesInstanceRef.current) {
				startTransition(() => {
					const priceLine = chartSeriesInstanceRef.current?.createPriceLine({
						price: Number(price),
						color: lineColor.lineColor,
						lineWidth: 2,
						lineStyle: LineStyle.Dotted,
						axisLabelVisible: true,
						title: quantity,
						axisLabelColor: lineColor.lineColor
					})
					priceLineArray.push(priceLine)
					// chartSeriesInstanceRef.current?.attachPrimitive(new TrendLine(chartInstanceRef.current, chartSeriesInstanceRef.current, point, quantity, lineColor));
				})
			}
			return null
		})
	}

	const clearPricelines = () => {
		while (priceLineArray.length > 0) {
			const value = priceLineArray.pop()
			chartSeriesInstanceRef.current.removePriceLine(value)
		}
	}
	useEffect(
		() => {
			const bids = reduceOrderBook(orderBook.bids)
			const asks = reduceOrderBook(orderBook.asks)
			chartInstanceRef.current = createChart(chartContainerRef.current, {
				layout: {
					background: { type: ColorType.Solid, color: colors.backgroundColor },
					textColor: colors.textColor,
				},
				grid: {
					vertLines: { color: colors.lineColor },
					horzLines: { color: colors.lineColor }
				},
				width: window.innerWidth < 768 ? window.innerWidth : window.innerWidth*2/3,
				height: window.innerWidth < 768 ? window.innerHeight / 2 : window.innerHeight / 1.4,
				rightPriceScale: { autoScale: false, ticksVisible: true },
				handleScale: true,
				handleScroll: true,
				timeScale: {
					secondsVisible: true,
					timeVisible: true,
					shiftVisibleRangeOnNewBar: true,
					ticksVisible: true,
					tickMarkFormatter: (time, tickMarkType, locale) => {
						return new Date(time).toLocaleTimeString(locale)
					}
				},
			});
			chartInstanceRef.current.timeScale().scrollToPosition(rightMarginPosition, true)

			const newSeries = chartInstanceRef.current.addCandlestickSeries({ upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' });
			newSeries.setData(dataSorted);
			chartSeriesInstanceRef.current = newSeries

			renderOrderBookData({ lineColor: "#26a69a33" }, bids, dataSorted)
			renderOrderBookData({ lineColor: "#ef535033" }, asks, dataSorted)

			window.addEventListener('resize', handleResize);

			return () => {
				window.removeEventListener('resize', handleResize);
				chartInstanceRef.current?.remove();
				chartInstanceRef.current = null
				chartSeriesInstanceRef.current = null
			};
		},
		[]
	);

	useEffect(() => {
		const bids = reduceOrderBook(orderBook.bids)
		const asks = reduceOrderBook(orderBook.asks)
		startTransition(() => {
			clearPricelines()
		})

		renderOrderBookData({ lineColor: "#26a69a33" }, bids, dataSorted)
		renderOrderBookData({ lineColor: "#ef535033" }, asks, dataSorted)

		if (intervalRef.current) {
			clearInterval(intervalRef.current)
		}
		intervalRef.current = setInterval(() => {
			startTransition(async () => {
				const tradesResponse = await fetchTrades(symbol)
				const orderBookResponse = await fetchBinanceBook(symbol)
				const dataSorted = tradesResponse.sort((a, b) => a[0] > b[0]).map((value) => ({ time: Number(value[0]), open: Number(value[1]), high: Number(value[2]), low: Number(value[3]), close: Number(value[4]) }))

				const currData = chartSeriesInstanceRef.current.data()
				const prevValue = currData[currData.length - 1]

				const value = dataSorted[dataSorted.length - 1]

				if (value.time === prevValue.time) {
					return
				}
				if (value.open > prevValue.close) {
					value.low = prevValue.close
				}
				if (value.open < prevValue.close) {
					value.high = prevValue.close
				}
				chartInstanceRef.current.timeScale().scrollToPosition(rightMarginPosition, true)
				chartInstanceRef.current.applyOptions({ timeScale: { barSpacing: 6 } })
				const bids = reduceOrderBook(orderBookResponse.bids)
				const asks = reduceOrderBook(orderBookResponse.asks)
				clearPricelines()
				chartSeriesInstanceRef.current.update(value);
				renderOrderBookData({ lineColor: "#26a69a33" }, bids, dataSorted)
				renderOrderBookData({ lineColor: "#ef535033" }, asks, dataSorted)
			});
		}, 15000, precision, threshold);
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
		}
	}, [precision, threshold])

	return (
		<>
			<div className={styles.chartActions} style={{ display: 'flex', flexFlow: 'row', gap: 10 }}>
				<div>
					<p>Precision: {precision}</p>
					<input title='Precision' type={"range"} min="3" max="7" value={precision} onChange={(e) => startTransition(() => setPrecision(e.target.value))} />
				</div>
				<div>
					<p>Min {symbol}:  {threshold}</p>
					<input title='Threshold' type={"range"} min="0.5" max="20" step={.5} value={threshold} onChange={(e) => startTransition(() => setThreshold(e.target.value))} />
				</div>
			</div>
			<div
				ref={chartContainerRef}
				className={styles.chart}>
			</div>
			<Chat symbol={symbol} trades={dataSorted} bids={reduceOrderBookForAI(orderBook.bids)} asks={reduceOrderBookForAI(orderBook.asks)} />
		</>
	);
};