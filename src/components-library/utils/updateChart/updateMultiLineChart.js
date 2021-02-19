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
} from "d3"

import { gatherByKeys } from "../convertChartData"

const updateMultiLineChart = ({
  updateTarget,
  type,
  data,
  width,
  height,
  margin,
  lineColor = "#abd5ff",
  color = "#fff",
}) => {
  const chartHeight = height - margin.top - margin.bottom
  const svgContainer = select(updateTarget)
  const _data = gatherByKeys(data)

  const x = scaleUtc()
    .domain(extent(_data.timestamp, (d) => d))
    .range([0, width - margin.right - margin.left])
  const y = scaleLinear()
    .domain(extent(_data.value, (d) => d))
    .range([chartHeight - margin.bottom, margin.top])

  const xAxis = axisBottom(x).tickSizeOuter(0)
  const yAxis = axisLeft(y).tickSizeOuter(0)

  const dataArea = area()
    .curve(curveMonotoneX)
    .x((d) => x(d.timestamp))
    .y0(chartHeight - margin.bottom)
    .y1((d) => y(d.value))

  const brush = brushX(x).extent([
    [0, 0],
    [width - margin.right - margin.left, chartHeight - margin.bottom],
  ])

  if (type === "focus") {
    svgContainer
      .select("defs clipPath rect")
      .style("width", width - margin.left - margin.right)
      .style("height", chartHeight - margin.bottom)
  }

  const chart = svgContainer
    .select(`g.${`${type === "focus" ? "focus" : "context"}`}`)
    .attr("transform", `translate(${margin.left}, ${margin.top})`)

  const chartPath = chart.datum(data)

  chartPath
    .select(`path.${`${type === "focus" ? "focus-area" : "context-area"}`}`)
    .attr("stroke", lineColor)
    .attr("stroke-width", 1.5)
    .attr("d", dataArea)

  chart
    .select(`g.${type === "focus" ? "focus-x-axis" : "context-x-axis"}`)
    .style("color", color)
    .attr("transform", `translate(0, ${chartHeight - margin.bottom})`)
    .call(xAxis)

  chart
    .select("g.y-axis")
    .style("color", color)
    .call(yAxis)
    .call((g) => g.select(".domain").remove()) // y축 라인 제거

  return {
    chart,
    x,
    y,
    xAxis,
    yAxis,
    brush,
    dataArea,
    margin,
  }
}

export default updateMultiLineChart
