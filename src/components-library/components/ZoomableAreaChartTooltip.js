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
import styled from "@emotion/styled"
import { gatherByKeys } from "../utils/convertChartData"
const initState = {
  focusViewChartNode: null,
  contextViewChartNode: null,
}

const ZoomableAreaChartTooltip = ({
  data = [],
  width = 1200,
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
    }

    const setEvent = () => {
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
    }

    createChart()
    setEvent()
  }

  React.useEffect(() => {
    makeChart(data)
  }, [data])

  return <svg width={width} height={totalHeight} ref={svgRef}></svg>
}

export default ZoomableAreaChartTooltip
