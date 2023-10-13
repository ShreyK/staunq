'use client'
import styles from './chart.module.css'

import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { createChart, ColorType, LineStyle } from 'lightweight-charts';
import fetchTrades from '../lib/fetch-trades';
import fetchBinanceBook from '../lib/fetch-orderbook';
import Chat from './chat';
import { reduceOrderBookForAI } from './chartActions';
import { intervals } from './symbolUtils';
import { Interval } from './interval';
import { debounce } from 'lodash';


export async function Chart({ trades, orderBook, symbol, defaultInterval }) {
	const colors = {
		backgroundColor: 'black',
		lineColor: '#1A1A1A',
		textColor: 'white',
		areaTopColor: '#2962FF',
		areaBottomColor: 'rgba(41, 98, 255, 0.28)',
	}

	const rightMarginPosition = 20;
	const chartContainerRef = useRef();
	const [threshold, setThreshold] = useState(10)
	const [precision, setPrecision] = useState(7)
	const dataSorted = trades.sort((a, b) => a[0] > b[0]).map((value) => ({ time: Number(value[0]), open: Number(value[1]), high: Number(value[2]), low: Number(value[3]), close: Number(value[4]) }))
	const chartInstanceRef = useRef(null)
	const chartSeriesInstanceRef = useRef(null)
	const intervalRef = useRef(null)
	const orderBookIntervalRef = useRef(null)
	const [priceLineArray, _] = useState([])
	const [currInterval, setCurrInterval] = useState(defaultInterval)


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
				})
			}
			return null
		})
	}

	const bids = reduceOrderBook(orderBook.bids)
	const asks = reduceOrderBook(orderBook.asks)

	const handleResize = () => {
		chartInstanceRef.current?.applyOptions({ width: chartContainerRef.current.clientWidth });
	};

	const clearPricelines = () => {
		while (priceLineArray.length > 0) {
			const value = priceLineArray.pop()
			chartSeriesInstanceRef.current.removePriceLine(value)
		}
	}
	useEffect(
		() => {
			chartInstanceRef.current = createChart(chartContainerRef.current, {
				layout: {
					background: { type: ColorType.Solid, color: colors.backgroundColor },
					textColor: colors.textColor,
				},
				grid: {
					vertLines: { color: colors.lineColor },
					horzLines: { color: colors.lineColor }
				},
				width: window.innerWidth < 768 ? window.innerWidth : window.innerWidth * 2 / 3,
				height: window.innerWidth < 768 ? window.innerHeight / 2 : window.innerHeight / 1.4,
				leftPriceScale: { autoScale: false, ticksVisible: true, visible: true },
				rightPriceScale: { autoScale: false, ticksVisible: true, visible: false },
				handleScale: true,
				handleScroll: true,
				localization: {
					timeFormatter: (time) => {
						const date = new Date(time)
						return date.getDate() + " " + date.getHours() + ":" + date.getMinutes()
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
						switch (tickMarkType) {
							case 1:
								return date.getHours() + ":" + date.getMinutes()
							case 2:
								return date.getHours() + ":" + date.getMinutes()
							case 3:
								return date.getHours() + ":" + date.getMinutes()
							case 4:
								return date.getHours() + ":" + date.getMinutes()
							default:
								return date.toLocaleDateString(locale)
						}
					}
				},
			});
			chartInstanceRef.current.timeScale().scrollToPosition(rightMarginPosition, true)

			chartSeriesInstanceRef.current = chartInstanceRef.current.addCandlestickSeries({ upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' });
			chartSeriesInstanceRef.current.setData(dataSorted);

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

	const reloadData = (currInterval, from, to, refresh) => {
		startTransition(async () => {
			const tradesResponse = await fetchTrades(symbol, currInterval, from, to)
			const newDataSorted = tradesResponse.map((value) => ({ time: Number(value[0]), open: Number(value[1]), high: Number(value[2]), low: Number(value[3]), close: Number(value[4]) })).sort((a, b) => a.time > b.time)
			console.log(from, to)
			if (newDataSorted.length === 0) {
				return
			}
			if (refresh) {
				chartSeriesInstanceRef.current.setData(newDataSorted);
				return
			}

			const currData = chartSeriesInstanceRef.current.data()
			let newData = newDataSorted.filter(e => {
				return !currData.some(item => item.time === e.time);
			});
			const mergedData = [...newData, ...currData].sort((a, b) => a.time > b.time)

			chartSeriesInstanceRef.current.setData(mergedData);
		})
	}

	useEffect(() => {
		if (!chartSeriesInstanceRef.current) {
			return;
		}
		const dataSorted = chartSeriesInstanceRef.current.data()
		clearPricelines()
		renderOrderBookData({ lineColor: "#26a69a33" }, bids, dataSorted)
		renderOrderBookData({ lineColor: "#ef535033" }, asks, dataSorted)

		if (orderBookIntervalRef.current) {
			clearInterval(orderBookIntervalRef.current)
		}
		orderBookIntervalRef.current = setInterval(() => {
			startTransition(async () => {
				if (!chartSeriesInstanceRef.current) {
					return;
				}
				const orderBookResponse = await fetchBinanceBook(symbol)
				const bids = reduceOrderBook(orderBookResponse.bids)
				const asks = reduceOrderBook(orderBookResponse.asks)
				clearPricelines()
				renderOrderBookData({ lineColor: "#26a69a33" }, bids, dataSorted)
				renderOrderBookData({ lineColor: "#ef535033" }, asks, dataSorted)
			});
		}, 60000, precision, threshold);
		return () => {
			if (orderBookIntervalRef.current) {
				clearInterval(orderBookIntervalRef.current)
			}
		}
	}, [precision, threshold])

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
				chartInstanceRef.current.timeScale().scrollToPosition(rightMarginPosition, true)
				chartSeriesInstanceRef.current.update(value);
			});
		}, 60000);
	}

	const onVisibleLogicalRangeChange = useCallback(debounce((newVisibleLogicalRange) => {
		if (newVisibleLogicalRange !== null && !!chartInstanceRef.current) {
			const dataSorted = chartSeriesInstanceRef.current.data()
			let barsInfo = chartSeriesInstanceRef.current.barsInLogicalRange(newVisibleLogicalRange);
			console.log(newVisibleLogicalRange)
			if (barsInfo !== null && barsInfo.barsBefore < 0) {
				const firstTime = dataSorted[0].time
				const step = dataSorted[1].time - dataSorted[0].time
				const to = firstTime - step
				const from = firstTime - step * 50
				reloadData(currInterval, from, to)
			}
		}
	}, 1000), [currInterval])

	useEffect(() => {
		if (!chartInstanceRef.current) {
			return;
		}
		startDataFetchingInterval(currInterval)
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
			if (orderBookIntervalRef.current) {
				clearInterval(orderBookIntervalRef.current)
			}
		}
	}, [])

	useEffect(() => {
		chartInstanceRef.current.timeScale().subscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange)

		return () => {
			if (chartInstanceRef.current !== null) {
				chartInstanceRef.current.timeScale().unsubscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange)
			}
		}
	}, [currInterval])


	const updateInterval = (value) => {
		chartInstanceRef.current.timeScale().unsubscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange)
		startTransition(() => {
			setCurrInterval(value)
			const range = chartInstanceRef.current.timeScale().getVisibleRange()
			let from = range.from
			if (value === intervals['1d'] || value === intervals['3d'] || value === intervals['12h'] || value === intervals['1w'] || value === intervals['1M']) {
				const date = new Date(range.to)
				from = date.setMonth(date.getMonth() - 1)
				if (value === intervals['1M']) {
					from = date.setYear(date.getYear() - 1)
				}
			}
			chartInstanceRef.current.timeScale().setVisibleRange({ from: from, to: range.to })
			reloadData(value, from, range.to, true)
			startDataFetchingInterval(value)
			chartInstanceRef.current.timeScale().subscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange)
		})
	}

	return (
		<>
			<div className={styles.chartActions} style={{ display: 'flex', flexFlow: 'row', gap: 10, zIndex: 100 }}>
				<div>
					<p>Precision: {precision}</p>
					<input title='Precision' type={"range"} min="3" max="7" value={precision} onChange={(e) => startTransition(() => setPrecision(e.target.value))} />
				</div>
				<div>
					<p>Min {symbol}:  {threshold}</p>
					<input title='Threshold' type={"range"} min="0.5" max="20" step={.5} value={threshold} onChange={(e) => startTransition(() => setThreshold(e.target.value))} />
				</div>
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