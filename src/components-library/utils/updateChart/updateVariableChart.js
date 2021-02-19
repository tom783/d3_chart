import {
  select,
  brushX,
  area,
  line,
  scaleLinear,
  extent,
  scaleUtc,
  axisBottom,
  axisLeft,
  curveMonotoneX,
  scaleOrdinal,
  utcHour,
  bisector,
  pointer,
  schemeCategory10,
} from "d3"

import { gatherByKeys, conditionCheck } from "../convertChartData"
import DomUid from "../domUid"

const lineColor = "#abd5ff"
const color = "#fff"

const updateVariableChart = ({
  updateTarget,
  data = [],
  thresholdData = [],
  type = "context",
  width = 1200,
  height = 150,
  margin,
  variable = false,
}) => {
  const chartHeight = height - margin.top - margin.bottom
  const svgContainer = select(updateTarget)
  const _data = gatherByKeys(data)
  const checkCondition = conditionCheck({ threshold: thresholdData, data })

  const x = scaleUtc()
    .domain(extent(_data.timestamp, (d) => d))
    .range([0, width - margin.right - margin.left])
  const y = scaleLinear()
    .domain(extent(_data.value, (d) => d))
    .range([chartHeight - margin.bottom, margin.top])

  const xAxis = axisBottom(x).tickSizeOuter(0)
  const yAxis = axisLeft(y).tickSizeOuter(0)

  const dataArea = line()
    .curve(curveMonotoneX)
    .x((d) => x(d.timestamp))
    .y((d) => y(d.value))

  const brush = brushX(x).extent([
    [0, 0],
    [width - margin.right - margin.left, chartHeight - margin.bottom],
  ])

  const varliableColor = scaleOrdinal(
    data.conditions === undefined
      ? data.map((d) => d.condition)
      : data.conditions,
    data.colors === undefined ? ["red", "deepskyblue"] : data.colors
  ).unknown("black")

  if (type === "focus") {
    svgContainer
      .select("defs clipPath rect")
      .style("width", width - margin.left - margin.right)
      .style("height", chartHeight - margin.bottom)
  }

  const chart = svgContainer
    .select("g")
    .attr("class", `${type === "focus" ? "focus" : "context"}`)
    .attr("transform", `translate(${margin.left}, ${margin.top})`)

  //variable color
  const colorId = DomUid("color")
  variable &&
    chart
      .select("linearGradient")
      .attr("id", colorId.id)
      .attr("x1", 0)
      .attr("x2", width)
      .selectAll("stop")
      .data(data)
      .join("stop")
      .attr("offset", (d) => x(d.timestamp) / width)
      .attr("stop-color", (d) => varliableColor(d.condition))

  //

  const chartPath = chart.datum(data)

  chartPath
    .select(`path.${type === "focus" ? "focus-area" : "context-area"}`)
    .attr("stroke", `${variable ? colorId : lineColor}`)
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
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

export default updateVariableChart
