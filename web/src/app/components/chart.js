'use client'

import { useEffect, useRef } from 'react';
import { createChart, ColorType, LastPriceAnimationMode } from 'lightweight-charts';
import { Refresh } from './refresh';
import { TrendLine } from './trendline';

export async function Chart({trades, orderBook}) {
	const colors = {
		backgroundColor:'black',
		lineColor:'#1A1A1A',
		textColor:'white',
		areaTopColor:'#2962FF',
		areaBottomColor:'rgba(41, 98, 255, 0.28)',
	}

	const chartContainerRef = useRef();

	useEffect(
		() => {
			const handleResize = () => {
				chart.applyOptions({ width: chartContainerRef.current.clientWidth });
			};

			const chart = createChart(chartContainerRef.current, {
				layout: {
					background: { type: ColorType.Solid, color: colors.backgroundColor },
					textColor: colors.textColor,
				},
				grid: {
					vertLines: { color: colors.lineColor },
					horzLines: { color: colors.lineColor }
				},
				width: chartContainerRef.current.clientWidth / 2,
				height: 1000,
				rightPriceScale: {autoScale: false},
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

			const newSeries = chart.addCandlestickSeries({ upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' });
			// const newSeries = chart.addLineSeries({ lineColor, topColor: areaTopColor, bottomColor: areaBottomColor, lastPriceAnimation: LastPriceAnimationMode.OnDataUpdate });
			// const dataSorted = data.sort((a,b)=> a.T > b.T).filter((value, index, array) => array[index+1] && value.T !== array[index+1].T).map((value) => ({time:value.T, value:Number(value.p)}))

			// const areaSeries = chart.addAreaSeries({
			// 	lineColor: '#2962FF', topColor: '#2962FF',
			// 	bottomColor: 'rgba(41, 98, 255, 0.28)',
			// });
			const dataSorted = trades.sort((a, b) => a[0] > b[0]).map((value) => ({ time: Number(value[0]), open: Number(value[1]), high: Number(value[2]), low: Number(value[3]), close: Number(value[4]) }))


			// console.log(props.orderBook)
			// areaSeries.setData(props.orderBook.map((value) => {value.}));
			newSeries.setData(dataSorted);
			chart.timeScale().fitContent();

			const precision = 7
			const threshold = 2
			const bids = orderBook.bids.map((value) => [Number(value[0]).toPrecision(precision), Number(value[1])])
				.reduce((arr, curr) => {
					let itemIndex = arr.findIndex(item => item[0] === curr[0]);
					if (itemIndex !== -1) {
						arr[itemIndex] = [curr[0], arr[itemIndex][1] + curr[1]]
					} else {
						arr.push([curr[0], curr[1]])
					}
					return arr
				}, [])
				
			const asks = orderBook.asks.map((value) => [Number(value[0]).toPrecision(precision), Number(value[1])])
			.reduce((arr, curr) => {
				let itemIndex = arr.findIndex(item => item[0] === curr[0]);
				if (itemIndex !== -1) {
					arr[itemIndex] = [curr[0], arr[itemIndex][1] + curr[1]]
				} else {
					arr.push([curr[0], curr[1]])
				}
				return arr
			}, [])

			bids.map((value) => {
				if(value[1].toPrecision(precision) < threshold) { 
					return null
				}
				const point1 = {
					time: dataSorted[dataSorted.length-1].time,
					price: value[0],
				};
				const point2 = {
					time: dataSorted[dataSorted.length-10].time,
					price: value[0],
				};
				const trend = new TrendLine(chart, newSeries, point1, point2, value[1].toPrecision(precision), {lineColor: "green"});
				newSeries.attachPrimitive(trend);
				return null
			})


			asks.map((value) => {
				if(value[1].toPrecision(precision) < threshold) { 
					return null
				}
				const point1 = {
					time: dataSorted[dataSorted.length-1].time,
					price: value[0],
				};
				const point2 = {
					time: dataSorted[dataSorted.length-10].time,
					price: value[0],
				};
				const trend = new TrendLine(chart, newSeries, point1, point2, value[1].toPrecision(precision),{lineColor: "red"});
				newSeries.attachPrimitive(trend);
				return null
			})

			chart.timeScale().scrollToRealTime();

			window.addEventListener('resize', handleResize);

			return () => {
				window.removeEventListener('resize', handleResize);
				chart.remove();
			};
		},
		[trades, orderBook]
	);

	return (
		<div
			ref={chartContainerRef}
			style={{ marginTop: 20 }}
		>
			<Refresh />
		</div>
	);
};