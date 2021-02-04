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
} from "d3"
import styled from "@emotion/styled"
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

      context.append("g").attr("class", "x-brush")

      return context.node()
    }

    // 브러쉬 설정
    const setBrush = () => {
      const handleShape = arc()
        .innerRadius(0)
        .outerRadius(
          (contextViewChartHeight -
            contextViewMargin.top -
            contextViewMargin.bottom) /
            2
        )
        .startAngle(0)
        .endAngle((d, i) => (i ? Math.PI : -Math.PI))

      const brushHandle = (g, selection) =>
        g
          .selectAll(".handle-custom")
          .data([{ type: "w" }, { type: "e" }])
          .join((enter) =>
            enter
              .append("path")
              .attr("class", "handle-custom")
              .attr("fill", "#666")
              .attr("fill-opacity", 0.8)
              .attr("stroke", "#000")
              .attr("stroke-width", 1.5)
              .attr("cursor", "ew-resize")
              .attr("d", handleShape)
          )
          .attr("display", selection === null ? "none" : null)
          .attr(
            "transform",
            selection === null
              ? null
              : (d, i) =>
                  `translate(${selection[i]},${
                    (contextViewChartHeight +
                      contextViewMargin.top -
                      contextViewMargin.bottom) /
                    2
                  })`
          )

      const brushEvent = ({ selection }) => {
        let extent = selection.map((d) => {
          return contextViewX.invert(d) // invert는 축의 좌표위치 기준 매핑된 실제 데이터값을 반환
        })
        focusViewX.domain(extent) // 브러쉬를 통한 데이터 업데이트
        svgLine.select(".focus-area").attr("d", focusArea)
        svgLine.select(".focus-x-axis").call(focusXAxis)
      }

      const brushended = ({ selection }) => {
        console.log(
          "end",
          contextViewX(utcHour.offset(contextViewX.domain()[1], -1)) // 인자로 들어간 값을 기준 x축 좌표값
        )
        console.log("end", contextViewX.domain()[1]) // x축 실제값의 최대값
        console.log("end", utcHour.offset(contextViewX.domain()[1], -1)) // x축 실제값의 최대값 기준 1시간 전 값
        if (!selection) {
          svgLine.select("g.x-brush").call(brush.move, defaultSelection)
        } else {
          svgLine.select("g.x-brush").call(brushHandle, selection)
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

export default ZoomableAreaChart
