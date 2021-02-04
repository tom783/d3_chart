import * as React from "react"
import {
  select,
  brushX,
  area,
  scaleLinear,
  extent,
  scaleUtc,
  axisBottom,
  axisLeft,
  curveMonotoneX,
  bisector,
  pointer,
} from "d3"
import styled from "@emotion/styled"
import { gatherByKeys } from "../utils/convertChartData"
import { times } from "ramda"

const initState = {
  focusViewChartNode: null,
  contextViewChartNode: null,
}

const ZoomableAreaChartTooltip = ({ data = [] }) => {
  const svgRef = React.useRef()
  const [chartNode, setChartNode] = React.useState(initState)

  const focusViewMargin = {
    top: 20,
    right: 30,
    bottom: 30,
    left: 50,
  }

  const contextViewMargin = {
    top: 20,
    right: 30,
    bottom: 30,
    left: 50,
  }

  const width = 1200
  const height = 650
  const focusViewChartHeight = 400
  const contextViewChartHeight = 150

  const makeChart = (data) => {
    const svgLine = select(svgRef.current)
    const _data = gatherByKeys(data)

    const focusViewX = scaleUtc()
      .domain(extent(_data.timestamp, (d) => d))
      .range([0, width - focusViewMargin.right - focusViewMargin.left])

    const focusViewY = scaleLinear()
      .domain(extent(_data.value, (d) => d))
      .range([
        focusViewChartHeight - focusViewMargin.bottom,
        focusViewMargin.top,
      ])

    const focusXAxis = axisBottom(focusViewX)

    const focusArea = area()
      .curve(curveMonotoneX)
      .x((d) => focusViewX(d.timestamp))
      .y0(focusViewChartHeight)
      .y1((d) => focusViewY(d.value))

    const contextViewX = scaleUtc()
      .domain(focusViewX.domain())
      .range([0, width - contextViewMargin.right - contextViewMargin.left])

    const contextViewY = scaleLinear()
      .domain(focusViewY.domain())
      .range([
        contextViewChartHeight - contextViewMargin.bottom,
        contextViewMargin.top,
      ])

    const contextArea = area()
      .curve(curveMonotoneX)
      .x((d) => contextViewX(d.timestamp))
      .y0(contextViewChartHeight - contextViewMargin.bottom)
      .y1((d) => contextViewY(d.value))

    const setTooltip = (targetChart, x, y) => {
      const callout = (g, value) => {
        if (!value) return g.style("display", "none")
        g.style("display", null)
          .stylle("pointer-events", "none")
          .style("font", "10px sans-serif")
      }

      const tooltip = targetChart.append("g")
      targetChart.on("touchmove mousemove", (e) => {
        const { timestamp, value } = bisect(pointer(e, targetChart)[0])
        tooltip
          .attr("transform", `translate(${x(timestamp)},${y(value)})`)
          .call(callout, ``)
      })
      targetChart.on("touchend mouseleave", () => tooltip.call(callout, null))
    }

    const bisect = () => {}

    // 확대된 차트
    const focusViewChart = () => {
      const yAxis = axisLeft(focusViewY)

      svgLine
        .append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width - focusViewMargin.left - focusViewMargin.right)
        .attr("height", focusViewChartHeight)

      const focus = svgLine
        .append("g")
        .attr("class", "focus")
        .attr(
          "transform",
          `translate(${focusViewMargin.left}, ${
            contextViewChartHeight +
            contextViewMargin.top +
            contextViewMargin.bottom +
            focusViewMargin.top
          })`
        )

      focus
        .append("path")
        .datum(data)
        .attr("class", "focus-area")
        .attr("clip-path", "url(#clip)")
        .style("fill", "none")
        .style("stroke", "#fcba03")
        .style("stroke-width", 1.5)
        .attr("d", focusArea)

      focus
        .append("g")
        .attr("class", "focus-x-axis")
        .attr("transform", `translate(0, ${focusViewChartHeight})`)
        .call(focusXAxis)

      focus
        .append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .select(".domain")
        .remove()

      setTooltip(focus, focusViewX, focusViewY)

      return focus.node()
    }

    // 컨트롤하는 차트
    const contextViewChart = () => {
      const contextXAxis = axisBottom(contextViewX)

      const yAxis = axisLeft(contextViewY)

      const context = svgLine
        .append("g")
        .attr("class", "context")
        .attr(
          "transform",
          `translate(${contextViewMargin.left}, ${contextViewMargin.top})`
        )

      context
        .append("path")
        .datum(data)
        .attr("class", "context-area")
        .style("fill", "none")
        .style("stroke", "#2d2fb3")
        .style("stroke-width", 1.5)
        .attr("d", contextArea)

      context
        .append("g")
        .attr("class", "context-x-axis")
        .attr(
          "transform",
          `translate(0, ${contextViewChartHeight - contextViewMargin.bottom})`
        )
        .call(contextXAxis, contextViewX, contextViewY)

      context
        .append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .select(".domain")
        .remove()

      context.append("g").attr("class", "x-brush")

      setTooltip(context)

      return context.node()
    }

    // 브러쉬 설정
    const setBrush = () => {
      const brushEvent = ({ selection }) => {
        let extent = selection.map((d) => {
          return contextViewX.invert(d)
        })
        focusViewX.domain(extent) // 브러쉬를 통한 데이터 업데이트
        svgLine.select(".focus-area").attr("d", focusArea)
        svgLine.select(".focus-x-axis").call(focusXAxis)
      }

      const brush = brushX(contextViewX)
        .extent([
          [0, 0],
          [
            width - contextViewMargin.right - contextViewMargin.left,
            contextViewChartHeight - contextViewMargin.bottom,
          ],
        ])
        .on("brush", brushEvent)

      svgLine.select("g.x-brush").call(brush)

      return brush
    }

    const contextViewChartNode = contextViewChart()
    const focusViewChartNode = focusViewChart()
    const brushNode = setBrush()

    return {
      contextViewChartNode,
      focusViewChartNode,
    }
  }

  React.useEffect(() => {
    setChartNode({ ...chartNode, ...makeChart(data) })
  }, [data])

  return <svg width={width} height={height} ref={svgRef}></svg>
}

export default ZoomableAreaChartTooltip
