'use client'
import _ from 'lodash'
import styles from './card.module.css'
import { startTransition } from 'react'
import { useState } from 'react'
import { Suspense, cache } from "react"
import Select, { defaultTheme } from 'react-select'
import { VictoryChart, VictoryZoomContainer, VictoryTheme, VictoryAxis, VictoryCandlestick, VictoryLine } from 'victory'
import { useEffect } from 'react'
import fetchTrades from '../lib/fetch-trades'
import fetchBinanceBook from '../lib/fetch-orderbook'
import { useCallback } from 'react'

export async function SvgChart({ trades, orderBook, symbol }) {
    const dataSorted = trades.sort((a, b) => a[0] > b[0]).map((value) => ({ x: new Date(Number(value[0])), open: Number(value[1]), high: Number(value[2]), low: Number(value[3]), close: Number(value[4]) }))
    // new Date().setHours(_.last(dataSorted).x.getHours() + 1)
    const currentDomain = { x: [dataSorted[0].x, dataSorted[dataSorted.length - 1].x], y: [_.minBy(dataSorted, d => d.low).low, _.maxBy(dataSorted, d => d.high).high] }
    const [zoomedXDomain, setZoomedXDomain] = useState(currentDomain);
    const [data, setData] = useState(dataSorted)

    const onDomainChange = (domain) => {
        startTransition(() => {
            setZoomedXDomain(domain.x)
        })
    }


    useEffect(() => {
        // window.addEventListener("resize", onResize)
        const handle = setInterval(async () => {
            const tradesResponse = await fetchTrades(symbol, "1s")
            // const orderBookResponse = await fetchBinanceBook(symbol)
            const dataSorted = tradesResponse.sort((a, b) => a[0] > b[0]).map((value) => ({ x: new Date(Number(value[0])), open: Number(value[1]), high: Number(value[2]), low: Number(value[3]), close: Number(value[4]) }))
            if (dataSorted[dataSorted.length - 1].x <= data[data.length - 1].x) {
                return
            }
            let dataFiltered = dataSorted.reduce((arr, curr) => {
                const time = new Date(curr.x)
                const getTimeIndex = (time) => { return time.getDate() + time.getHours() + time.getMinutes() }
                let itemIndex = arr.findIndex(item => getTimeIndex(new Date(item[0])) === getTimeIndex(time));
                if (itemIndex !== -1) {
                    arr[itemIndex] = { ...curr }
                    // if(curr.low < currData.low) {
                    //     arr[itemIndex].low = curr.low
                    // }
                    // if(curr.high > currData.high) {
                    //     arr[itemIndex].high = curr.high
                    // }
                    // if(curr.close !== currData.close) {
                    //     arr[itemIndex].close = curr.close
                    // }
                } else {
                    arr.push({ ...curr })
                }

                return arr
            }, [])
            const currData = data
            let newData = dataFiltered.filter(e => {
                return !currData.some(item => item.x === e.x);
            });
            const prevValue = currData[currData.length - 1]

            if (newData.length === 0) {
                return
            }
            const value = newData[newData.length - 1]

            if (value.x === prevValue.x) {
                return
            }
            if (value.open > prevValue.close) {
                value.low = prevValue.close
            }
            if (value.open < prevValue.close) {
                value.high = prevValue.close
            }
            startTransition(() => {
                const domain = zoomedXDomain
                domain.x[1] = value.x
                setZoomedXDomain(domain)
                setData([...currData, ...newData])
            })
        }, 5000, data);

        return () => {
            clearInterval(handle)
            // window.removeEventListener("resize", onResize)
        }
    }, [data])

    return (
        <Suspense fallback={<div className={styles.cardBackground}>Loading...</div>}>
            <div>
                <div>Price: {data[data.length - 1].close}</div>
                <VictoryChart theme={VictoryTheme.material} width={1280} height={720}
                    scale={{ x: "time" }} containerComponent={<VictoryZoomContainer onZoomDomainChange={onDomainChange} zoomDomain={"x"} />}>
                    <VictoryAxis
                        style={{ grid: { display: 'none' } }}
                    // tickFormat={(t) => `${t.getHours()}:${t.getMinutes() === 0 || t.getMinutes().length === 1 ? t.getMinutes() + "0" : t.getMinutes()}`}
                    // tickCount={14}
                    />
                    <VictoryAxis style={{ grid: { display: 'none' } }} dependentAxis />
                    <VictoryCandlestick
                        candleColors={{ positive: "#5f5c5b", negative: "#c43a31" }}
                        data={data}
                    // candleRatio={0.7}
                    // animate={{
                    //     duration: 1000,
                    //     onLoad: { duration: 1000 }
                    //   }}
                    />
                    <VictoryLine
                        style={{
                            data: { stroke: "#c43a31" },
                            parent: { border: "1px solid #ccc" }
                        }}
                        data={[{ x: data[0].x, y: data[data.length - 1].close }, { x: data[data.length - 1].x, y: data[data.length - 1].close }]}
                    />
                </VictoryChart>

            </div>
        </Suspense >
    )
}
