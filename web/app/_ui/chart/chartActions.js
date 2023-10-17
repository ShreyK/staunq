import { startTransition } from "react";
import { LineStyle } from "lightweight-charts";

const reduceOrderBookForAI = (array) => {
    return array.map((value) => [Number(value[0]).toPrecision(4), Number(value[1])])
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


const renderOrderBookData = (priceLineArray, lineColor, reducedArray, precision, threshold, chart, chartSeries) => {
    reducedArray.map((value) => {
        const price = value[0]
        const quantity = value[1].toPrecision(precision)
        if (Number(value[1]) < threshold) {
            return value
        }

        if (chart && chartSeries) {
            startTransition(() => {
                const priceLine = chartSeries.createPriceLine({
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
        return value
    })
}


const reduceOrderBook = (array, precision) => {
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

const clearPricelines = (priceLineArray, chartSeries) => {
    while (priceLineArray.length > 0) {
        const value = priceLineArray.pop()
        chartSeries.removePriceLine(value)
    }
}

const reduceTrades = (trades) => {
    return trades.sort((a, b) => a[0] > b[0]).map((value) => ({ time: Number(value[0]), open: Number(value[1]), high: Number(value[2]), low: Number(value[3]), close: Number(value[4]) }))
}

export { reduceOrderBook, reduceOrderBookForAI, reduceTrades, renderOrderBookData, clearPricelines }