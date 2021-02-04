import * as React from "react"
import {
  select,
  brushX,
  line,
  scaleLinear,
  extent,
  scaleUtc,
  axisBottom,
  axisLeft,
} from "d3"
import { gatherByKeys } from "../utils/convertChartData"

function ZoomableLineChart({ data = [] }) {
  const svgRef = React.useRef()
  const [chartNode, setChartNode] = React.useState(null)

  const margin = {
    top: 20,
    right: 30,
    bottom: 30,
    left: 50,
  }
  const width = 1200
  const height = 400

  const makeChart = () => {
    const svgLine = select(svgRef.current)
    const _data = gatherByKeys(data)

    const x = scaleUtc()
      .domain(extent(_data.timestamp, (d) => d))
      .range([margin.left, width - margin.right])

    const y = scaleLinear()
      .domain(extent(_data.value, (d) => d))
      .range([height - margin.bottom, margin.top])

    const xAxis = (g) =>
      g
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(axisBottom(x))

    const yAxis = (g) =>
      g.attr("transform", `translate(${margin.left}, 0)`).call(axisLeft(y))

    const brushEvent = (e) => {
      const selectedExtend = e.selection
      console.log("event", selectedExtend)
    }
    const setBrushEvent = brushX()
      .extent([
        [margin.left, 0],
        [width - margin.right, height - margin.bottom],
      ])
      .on("brush", brushEvent)

    const testBrush = (g) => g.attr("class", "brush").call(setBrushEvent)

    const _line = line()
      .defined((_data) => !isNaN(_data.value))
      .x((d) => x(d.timestamp))
      .y((d) => y(d.value))

    svgLine.append("g").call(xAxis)
    svgLine.append("g").call(yAxis)

    svgLine.append("g").call(testBrush)

    svgLine
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", _line)

    return svgLine.node()
  }

  React.useEffect(() => {
    setChartNode(makeChart())
  }, [data])

  return <svg width={width} height={height} ref={svgRef}></svg>
}

export default ZoomableLineChart
