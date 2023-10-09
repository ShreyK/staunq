
const reduceOrderBookForAI = (array) => {
    return array.map((value) => [Number(value[0]).toPrecision(5), Number(value[1])])
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
        }, []).filter((value) => value[1]* value[0]  > 150000)
}

const reduceTrades = (trades) => {
    trades.sort((a, b) => a[0] > b[0]).map((value) => ({ time: Number(value[0]), open: Number(value[1]), high: Number(value[2]), low: Number(value[3]), close: Number(value[4]) }))
}

export {reduceOrderBookForAI, reduceTrades}