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
  arc,
  utcHour,
  bisector,
  pointer,
} from "d3"
import styled from "@emotion/styled"
import moment from "moment"
import { gatherByKeys } from "../utils/convertChartData"

const initState = {
  focusViewChartNode: null,
  contextViewChartNode: null,
}

const ZoomableAreaChart = ({ data = [] }) => {
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

    const focusXAxis = axisBottom(focusViewX).tickSizeOuter(0)

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

    // 확대된 차트
    const focusViewChart = () => {
      const yAxis = axisLeft(focusViewY).tickSizeOuter(0)

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
        .style("stroke", "#abd5ff")
        .style("stroke-width", 1.5)
        .attr("d", focusArea)

      focus
        .append("g")
        .attr("class", "focus-x-axis")
        .style("color", "#fff")
        .attr("transform", `translate(0, ${focusViewChartHeight})`)
        .call(focusXAxis)

      focus
        .append("g")
        .attr("class", "y-axis")
        .style("color", "#fff")
        .call(yAxis)
        .call((g) => g.select(".domain").remove())

      return focus
    }

    // 컨트롤하는 차트
    const contextViewChart = () => {
      const contextXAxis = axisBottom(contextViewX).tickSizeOuter(0)

      const yAxis = axisLeft(contextViewY).tickSizeOuter(0)

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
        .style("stroke", "#abd5ff")
        .style("stroke-width", 1.5)
        .attr("d", contextArea)

      context
        .append("g")
        .attr("class", "context-x-axis")
        .style("color", "#fff")
        .attr(
          "transform",
          `translate(0, ${contextViewChartHeight - contextViewMargin.bottom})`
        )
        .call(contextXAxis)

      context
        .append("g")
        .attr("class", "y-axis")
        .style("color", "#fff")
        .call(yAxis)
        .call((g) => g.select(".domain").remove())

      context.append("g").attr("class", "x-brush")

      return context
    }

    // 브러쉬 설정
    const setBrush = () => {
      const brushEvent = ({ selection }) => {
        let extent = selection.map((d) => {
          return contextViewX.invert(d) // invert는 축의 좌표위치 기준 매핑된 실제 데이터값을 반환
        })
        focusViewX.domain(extent) // 브러쉬를 통한 데이터 업데이트
        svgLine.select(".focus-area").attr("d", focusArea)
        svgLine.select(".focus-x-axis").call(focusXAxis)
      }

      const brushended = ({ selection }) => {
        // console.log(
        //   "end",
        //   contextViewX(utcHour.offset(contextViewX.domain()[1], -1)) // 인자로 들어간 값을 기준 x축 좌표값
        // )
        // console.log("end", contextViewX.domain()[1]) // x축 실제값의 최대값
        // console.log("end", utcHour.offset(contextViewX.domain()[1], -1)) // x축 실제값의 최대값 기준 1시간 전 값
        if (!selection) {
          svgLine.select("g.x-brush").call(brush.move, defaultSelection)
        }
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
        .on("end", brushended)

      const defaultSelection = [
        contextViewX(utcHour.offset(contextViewX.domain()[1], -1)),
        contextViewX.range()[1],
      ]

      svgLine.select("g.x-brush").call(brush).call(brush.move, defaultSelection) //brush.move는 브러쉬를 이동시킴

      return brush
    }

    const setTooltip = (targetChart, x, y, height, margin) => {
      const tooltip = targetChart.append("g")
      const pivot = targetChart.append("rect")

      targetChart.on("touchmove mousemove", (e) => {
        const { timestamp, value } = bisect(pointer(e, targetChart.node())[0])
        tooltip
          .attr("transform", `translate(${x(timestamp)},${y(value)})`)
          .call(callout, `${value} ${formatDate(moment(timestamp))}`)
        pivot
          .attr("transform", `translate(${x(timestamp)}, 0)`)
          .call(pivotOut, value)
      })

      targetChart.on("touchend mouseleave", () => {
        tooltip.call(callout, null)
      })

      const formatDate = (date) => {
        return date.toLocaleString("en", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        })
      }

      const bisect = (mx) => {
        const bisect = bisector((d) => d.timestamp).left // 비교 데이터 리스트와 대상 데이터를 맵핑시켜 대응되는 값의 인덱스를 반환하는 함수를 반환
        const date = x.invert(mx)
        const index = bisect(data, date, 1)
        const a = data[index - 1]
        const b = data[index]
        return b && date - a.date > b.date - date ? b : a
      }

      const pivotOut = (g, value) => {
        if (!value) return g.style("display", "none")
        g.style("display", null)
          .style("fill", "white")
          .style("width", 1)
          .style("height", height - margin.bottom)
      }

      const callout = (g, value) => {
        if (!value) return g.style("display", "none")
        g.style("display", null)
          .style("pointer-events", "none")
          .style("font", "10px sans-serif")

        const path = g
          .selectAll("path")
          .data([null])
          .join("path")
          .attr("fill", "white")
          .attr("stroke", "black")

        const text = g
          .selectAll("text")
          .data([null])
          .join("text")
          .call((text) =>
            text
              .selectAll("tspan")
              .data((value + "").split(/\n/))
              .join("tspan")
              .attr("x", 0)
              .attr("y", (d, i) => `${i * 1.1}em`)
              .style("font-weight", (_, i) => (i ? null : "bold"))
              .text((d) => d)
          )

        const { x, y, width: w, height: h } = text.node().getBBox()

        text.attr("transform", `translate(${-w / 2},${15 - y})`)
        path.attr(
          "d",
          `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`
        )
      }
    }

    const contextViewChartNode = contextViewChart()
    const focusViewChartNode = focusViewChart()
    const brushNode = setBrush()
    setTooltip(
      contextViewChartNode,
      contextViewX,
      contextViewY,
      contextViewChartHeight,
      contextViewMargin
    )
    setTooltip(
      focusViewChartNode,
      focusViewX,
      focusViewY,
      focusViewChartHeight,
      focusViewMargin
    )

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

export default ZoomableAreaChart
