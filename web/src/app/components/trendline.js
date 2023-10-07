'use client'
class TrendLinePaneRenderer {
    constructor(p1, text1, text2, options) {
        this._p1 = p1
        this._text1 = text1
        this._text2 = text2
        this._options = options
    }

    draw(target) {
        target.useBitmapCoordinateSpace(scope => {
            if (
                this._p1.x === null ||
                this._p1.y === null 
            )
                return
            const ctx = scope.context
            const x1Scaled = Math.round(this._p1.x * scope.horizontalPixelRatio)
            const y1Scaled = Math.round(this._p1.y * scope.verticalPixelRatio)
            const x2Scaled = Math.round((this._p1.x+10) * scope.horizontalPixelRatio)
            const y2Scaled = Math.round(this._p1.y * scope.verticalPixelRatio)
            ctx.lineWidth = this._options.width
            ctx.strokeStyle = this._options.lineColor
            ctx.beginPath()
            ctx.moveTo(x1Scaled, y1Scaled)
            ctx.lineTo(x2Scaled, y2Scaled)
            ctx.stroke()
            // this._drawTextLabel(scope, this._text1, x1Scaled, y1Scaled, true)
            this._drawTextLabel(scope, this._text2, x2Scaled, y2Scaled, false)
        })
    }

    _drawTextLabel(scope, text, x, y, left) {
        scope.context.font = "14px Arial"
        scope.context.beginPath()
        const offset = 5 * scope.horizontalPixelRatio
        const textWidth = scope.context.measureText(text)
        const leftAdjustment = left ? textWidth.width + offset * 4 : 0
        scope.context.fillStyle = this._options.labelBackgroundColor
        scope.context.roundRect(
            x + offset + 50,
            y - 24,
            textWidth.width + offset * 2,
            24 + offset,
            5
        )
        scope.context.fill()
        scope.context.beginPath()
        scope.context.fillStyle = this._options.labelTextColor
        scope.context.fillText(text, x + offset * 2 + 50 , y)
    }
}

class TrendLinePaneView {
    _p1 = { x: null, y: null }
    _text = { label: null }

    constructor(source) {
        this._source = source
    }

    update() {
        const y1 = this._source._series?.priceToCoordinate(this._source._p1.price)
        const x1 = this._source._coord
        this._p1 = { x: x1, y: y1 }
        this._text = { label: this._source._text }
    }

    renderer() {
        return new TrendLinePaneRenderer(
            this._p1,
            "" + this._text.label,
            "" + this._text.label,
            this._source._options
        )
    }
}

const defaultOptions = {
    lineColor: "white",
    width: 1,
    showLabels: true,
    labelBackgroundColor: "rgba(255, 255, 255, 0.85)",
    labelTextColor: "rgb(0, 0, 0)"
}

export class TrendLine {
    constructor(chart, series, p1, text, options) {
        this._chart = chart
        this._series = series
        this._p1 = p1
        this._text = text
        this._coord = chart.timeScale().timeToCoordinate(p1.time)
        this._minPrice = this._p1.price
        this._maxPrice = this._p1.price
        this._options = {
            ...defaultOptions,
            ...options
        }
        this._paneViews = [new TrendLinePaneView(this)]
    }

    autoscaleInfo(startTimePoint, endTimePoint) {
        const p1Index = this._pointIndex(this._p1)
        if (p1Index === null) return null
        if (endTimePoint < p1Index || startTimePoint > p1Index) return null
        return {
            priceRange: {
                minValue: this._minPrice,
                maxValue: this._maxPrice
            }
        }
    }

    updateAllViews() {
        this._paneViews.forEach(pw => pw.update())
    }

    paneViews() {
        return this._paneViews
    }

    _pointIndex(p) {
        if (this._coord === null) return null
        const index = this._chart.timeScale().coordinateToLogical(this._coord)
        return index
    }
}
