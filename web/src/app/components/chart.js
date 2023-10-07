'use client'
import styles from './card.module.css'

import { startTransition, useEffect, useRef, useState } from 'react';
import { createChart, ColorType, LineStyle } from 'lightweight-charts';
import fetchTrades from '../lib/fetch-trades';
import fetchBinanceBook from '../lib/fetch-orderbook';

export async function Chart({ trades, orderBook }) {
	const colors = {
		backgroundColor: 'black',
		lineColor: '#1A1A1A',
		textColor: 'white',
		areaTopColor: '#2962FF',
		areaBottomColor: 'rgba(41, 98, 255, 0.28)',
	}

	const rightMarginPosition = 10;
	const chartContainerRef = useRef();
	const [threshold, setThreshold] = useState(5)
	const [precision, setPrecision] = useState(5)
	const [zoom, setZoom] = useState(7)
	const dataSorted = trades.sort((a, b) => a[0] > b[0]).map((value) => ({ time: Number(value[0]), open: Number(value[1]), high: Number(value[2]), low: Number(value[3]), close: Number(value[4]) }))
	let currTime = null
	const chartInstanceRef = useRef(null)
	const chartSeriesInstanceRef = useRef(null)
	const [priceLineArray, setPriceLineArray] = useState([])

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
			const quantity = value[1].toPrecision(precision)
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
				width: 700,
				height: 700,
				rightPriceScale: { autoScale: false },
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

			currTime = dataSorted[dataSorted.length - 1].time

			renderOrderBookData({ lineColor: "green" }, bids, dataSorted)
			renderOrderBookData({ lineColor: "red" }, asks, dataSorted)

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

		renderOrderBookData({ lineColor: "green" }, bids, dataSorted)
		renderOrderBookData({ lineColor: "red" }, asks, dataSorted)

		const handle = setInterval(() => {
			startTransition(async () => {
				// chartInstanceRef.current.timeScale().scrollToPosition(rightMarginPosition, true)
				const tradesResponse = await fetchTrades('')
				const orderBookResponse = await fetchBinanceBook('')
				const dataSorted = tradesResponse.sort((a, b) => a[0] > b[0]).map((value) => ({ time: Number(value[0]), open: Number(value[1]), high: Number(value[2]), low: Number(value[3]), close: Number(value[4]) }))


				if (dataSorted[dataSorted.length - 1].time === currTime) {
					currTime += 1
					dataSorted[dataSorted.length - 1].time = currTime
				} else {
					
				chartInstanceRef.current.timeScale().scrollToPosition(rightMarginPosition, true)
				}
				const bids = reduceOrderBook(orderBookResponse.bids)
				const asks = reduceOrderBook(orderBookResponse.asks)
				clearPricelines()
				chartSeriesInstanceRef.current.update(dataSorted[dataSorted.length - 1]);
				renderOrderBookData({ lineColor: "green" }, bids, dataSorted)
				renderOrderBookData({ lineColor: "red" }, asks, dataSorted)
			});
		}, 5000, precision, zoom, threshold);
		return () => {
			clearInterval(handle)
		}
	}, [zoom, precision, threshold])

	return (
		<div
			ref={chartContainerRef}
			className={styles.center}>
			<div style={{ display: 'flex', flexFlow: 'column' }}>
				<div>
					<p>Precision: {precision}</p>
					<input title='Precision' type={"range"} min="3" max="7" value={precision} onChange={(e) => startTransition(() => setPrecision(e.target.value))} />
				</div>
				<div>
					<p>Threshold:  {threshold}</p>
					<input title='Threshold' type={"range"} min="0.5" max="5" step={.5} value={threshold} onChange={(e) => startTransition(() => setThreshold(e.target.value))} />
				</div>
			</div>
		</div>
	);
};