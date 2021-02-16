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
  utcHour,
  bisector,
  pointer,
} from "d3"
import moment from "moment"
import styled from "@emotion/styled"
import { gatherByKeys } from "../../utils/convertChartData"
const initState = {
  focusViewChartNode: null,
  contextViewChartNode: null,
}

const ZoomableSyncAreaChartTooltip = ({
  data = [],
  width = 1200,
  useBrushHandle = true,
  lineColor = "#abd5ff",
  color = "#fff",
  focusArea = {
    height: 400,
    marginTop: 20,
    marginRight: 30,
    marginBottom: 30,
    marginLeft: 50,
  },
  contextArea = {
    height: 150,
    marginTop: 20,
    marginRight: 30,
    marginBottom: 30,
    marginLeft: 50,
  },
}) => {
  const svgRef = React.useRef()
  const totalHeight =
    focusArea.height +
    focusArea.marginTop +
    focusArea.marginBottom +
    contextArea.height +
    contextArea.marginTop +
    contextArea.marginBottom

  const makeChart = (data) => {
    const svgInstance = select(svgRef.current)
    const _data = gatherByKeys(data)

    const chartSet = () => {
      const focusX = scaleUtc()
        .domain(extent(_data.timestamp, (d) => d))
        .range([0, width - focusArea.marginRight - focusArea.marginLeft])

      const focusY = scaleLinear()
        .domain(extent(_data.value, (d) => d))
        .range([focusArea.height - focusArea.marginBottom, focusArea.marginTop])

      const focusXAxis = axisBottom(focusX).tickSizeOuter(0)
      const focusYAxis = axisLeft(focusY).tickSizeOuter(0)

      const focusDataArea = area()
        .curve(curveMonotoneX)
        .x((d) => focusX(d.timestamp))
        .y0(focusArea.height - focusArea.marginBottom)
        .y1((d) => focusY(d.value))

      const focusBrush = brushX(focusX).extent([
        [0, 0],
        [
          width - focusArea.marginRight - focusArea.marginLeft,
          focusArea.height - focusArea.marginBottom,
        ],
      ])

      const contextX = scaleUtc()
        .domain(focusX.domain())
        .range([0, width - contextArea.marginRight - contextArea.marginLeft])

      const contextY = scaleLinear()
        .domain(focusY.domain())
        .range([
          contextArea.height - contextArea.marginBottom,
          contextArea.marginTop,
        ])

      const contextXAxis = axisBottom(contextX).tickSizeOuter(0)
      const contextYAxis = axisLeft(contextY).tickSizeOuter(0)

      const contextDataArea = area()
        .curve(curveMonotoneX)
        .x((d) => contextX(d.timestamp))
        .y0(contextArea.height - contextArea.marginBottom)
        .y1((d) => contextY(d.value))

      const brush = brushX(contextX).extent([
        [0, 0],
        [
          width - contextArea.marginRight - contextArea.marginLeft,
          contextArea.height - contextArea.marginBottom,
        ],
      ])

      return {
        focusX,
        focusY,
        focusXAxis,
        focusYAxis,
        focusDataArea,
        focusBrush,
        contextX,
        contextY,
        contextXAxis,
        contextYAxis,
        contextDataArea,
        brush,
      }
    }

    const {
      focusX,
      focusY,
      focusXAxis,
      focusYAxis,
      focusDataArea,
      focusBrush,
      contextX,
      contextY,
      contextXAxis,
      contextYAxis,
      contextDataArea,
      brush,
    } = chartSet()

    const createChart = () => {
      svgInstance
        .append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .style("width", width - focusArea.marginLeft - focusArea.marginRight)
        .style("height", focusArea.height - focusArea.marginBottom)

      const focusChart = svgInstance
        .append("g")
        .attr("class", "focus")
        .attr(
          "transform",
          `translate(${focusArea.marginLeft}, ${
            contextArea.marginTop +
            contextArea.height +
            contextArea.marginBottom +
            focusArea.marginTop
          })`
        )

      focusChart
        .append("path")
        .datum(data)
        .attr("class", "focus-area")
        .attr("clip-path", "url(#clip)")
        .attr("fill", "none")
        .attr("stroke", lineColor)
        .attr("stroke-width", 1.5)
        .attr("d", focusDataArea)

      focusChart
        .append("g")
        .attr("class", "focus-x-axis")
        .style("color", color)
        .attr(
          "transform",
          `translate(0, ${focusArea.height - focusArea.marginBottom})`
        )
        .call(focusXAxis)

      focusChart
        .append("g")
        .attr("class", "y-axis")
        .style("color", color)
        .call(focusYAxis)
        .call((g) => g.select(".domain").remove()) // y축 라인 제거

      focusChart.append("g").attr("class", "focusX-brush")
      focusChart.append("g").attr("class", "focus-tooltip")
      focusChart.append("rect").attr("class", "pivot")

      const contextChart = svgInstance
        .append("g")
        .attr("class", "context")
        .attr(
          "transform",
          `translate(${contextArea.marginLeft}, ${contextArea.marginTop})`
        )

      contextChart
        .append("path")
        .datum(data)
        .attr("class", "context-area")
        .attr("fill", "none")
        .attr("stroke", lineColor)
        .attr("stroke-width", 1.5)
        .attr("d", contextDataArea)

      contextChart
        .append("g")
        .attr("class", "context-x-axis")
        .style("color", color)
        .attr(
          "transform",
          `translate(0, ${contextArea.height - contextArea.marginBottom})`
        )
        .call(contextXAxis)

      contextChart
        .append("g")
        .attr("class", "y-axis")
        .style("color", "#fff")
        .call(contextYAxis)
        .call((g) => g.select(".domain").remove())

      contextChart.append("g").attr("class", "x-brush")
      contextChart.append("g").attr("class", "context-tooltip")
      contextChart.append("rect").attr("class", "pivot")

      return {
        focusChart,
        contextChart,
      }
    }

    const { contextChart, focusChart } = createChart()

    const setTooltip = (
      targetChart,
      x,
      y,
      tooltip,
      height,
      area,
      syncChart,
      syncX,
      syncY,
      syncTooltip,
      syncHeight
    ) => {
      targetChart.on("touchmove mousemove", (e) => {
        const { timestamp, value } = bisect(pointer(e, targetChart.node())[0])
        tooltip
          .attr("transform", `translate(${x(timestamp)},${y(value)})`)
          .call(callout, `${value} ${formatDate(moment(timestamp))}`)
        targetChart
          .select("rect.pivot")
          .attr("transform", `translate(${x(timestamp)}, 0)`)
          .call(pivotOut, value, height, area)

        syncTooltip
          .attr("transform", `translate(${syncX(timestamp)},${syncY(value)})`)
          .call(callout, `${value} ${formatDate(moment(timestamp))}`)
        syncChart
          .select("rect.pivot")
          .attr("transform", `translate(${syncX(timestamp)}, 0)`)
          .call(pivotOut, value, syncHeight, area)
      })

      targetChart.on("touchend mouseleave", () => {
        tooltip.call(callout, null)
        syncTooltip.call(callout, null)
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

      const pivotOut = (g, value, height, area) => {
        if (!value) return g.style("display", "none")
        g.style("display", null)
          .style("fill", "white")
          .style("width", 1)
          .style("height", height - area.marginBottom)
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

    const setEvent = () => {
      // brush event
      const brushEvent = ({ selection }) => {
        let extent = selection.map((d) => {
          return contextX.invert(d)
        })
        focusX.domain(extent)
        svgInstance.select(".focus-area").attr("d", focusDataArea)
        svgInstance.select(".focus-x-axis").call(focusXAxis)
      }

      const defaultSelection = [
        contextX(utcHour.offset(contextX.domain()[1], -1)),
        contextX.range()[1],
      ]

      const brushended = ({ selection }) => {
        if (!selection) {
          svgInstance.select("g.x-brush").call(brush.move, defaultSelection)
        }
      }
      brush.on("brush", brushEvent).on("end", brushended)
      svgInstance
        .select("g.x-brush")
        .call(brush)
        .call(brush.move, defaultSelection)
      !useBrushHandle &&
        svgInstance.selectAll("g.x-brush .handle").attr("display", "none") //brush handler 크기 조절 off
      !useBrushHandle &&
        svgInstance.select("g.x-brush .overlay").attr("pointer-events", "none") //brush handler 드래그 사이즈 조절 off

      svgInstance.select("g.focusX-brush").call(focusBrush)

      //tooltip event
      const focusTooltip = svgInstance.select(".focus-tooltip")
      const contextTooltip = svgInstance.select(".context-tooltip")
      svgInstance
        .select("g.focusX-brush .overlay")
        .attr("pointer-events", "none")

      setTooltip(
        contextChart,
        contextX,
        contextY,
        contextTooltip,
        contextArea.height,
        contextArea,
        focusChart,
        focusX,
        focusY,
        focusTooltip,
        focusArea.height
      )
      setTooltip(
        focusChart,
        focusX,
        focusY,
        focusTooltip,
        focusArea.height,
        focusArea,
        contextChart,
        contextX,
        contextY,
        contextTooltip,
        contextArea.height
      )
    }

    setEvent()
  }

  React.useEffect(() => {
    makeChart(data)
  }, [data, useBrushHandle, lineColor, color])

  return <svg width={width} height={totalHeight} ref={svgRef}></svg>
}

export default ZoomableSyncAreaChartTooltip
