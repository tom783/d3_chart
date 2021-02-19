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

const baseMargin = {
  left: 50,
  right: 39,
  top: 20,
  bottom: 30,
}

const lineColor = "#abd5ff"
const color = "#fff"

const variableMultiLineChart = ({
  container,
  data = [],
  thresholdData = [],
  type = "context",
  width = 1200,
  height = 150,
  margin = baseMargin,
  variable = false,
}) => {
  const chartHeight = height - margin.top - margin.bottom
  const svgContainer = select(container)
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

  const dataRange = area()
    .x((d) => x(d.timestamp))
    .y0((d) => y(d.max))
    .y1((d) => y(d.min))

  const brush = brushX(x).extent([
    [0, 0],
    [width - margin.right - margin.left, chartHeight - margin.bottom],
  ])

  const varliableColor = scaleOrdinal(
    checkCondition.conditions === undefined
      ? checkCondition.map((d) => d.condition)
      : checkCondition.conditions,
    checkCondition.colors === undefined
      ? ["red", "deepskyblue"]
      : checkCondition.colors
  ).unknown("black")

  if (type === "focus") {
    svgContainer
      .append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .style("width", width - margin.left - margin.right)
      .style("height", chartHeight - margin.bottom)
  }

  if (type === "focus") {
    svgContainer
      .append("g")
      .attr("class", "range")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .datum(thresholdData)
      .append("path")
      .attr("class", "range-path")
      .attr("fill", "rgba(223, 223, 223, 0.3)")
      .attr("d", dataRange)
  }

  const chart = svgContainer
    .append("g")
    .attr("class", `${type === "focus" ? "focus" : "context"}`)
    .attr("transform", `translate(${margin.left}, ${margin.top})`)

  //variable color
  const colorId = DomUid("color")
  variable &&
    chart
      .append("linearGradient")
      .attr("id", colorId.id)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("x2", width)
      .selectAll("stop")
      .data(checkCondition)
      .join("stop")
      .attr("offset", (d) => x(d.timestamp) / width)
      .attr("stop-color", (d) => varliableColor(d.condition))

  //

  const chartPath = chart
    .datum(data)
    .append("path")
    .attr("class", `${type === "focus" ? "focus-area" : "context-area"}`)

  if (type === "focus") {
    chartPath.attr("clip-path", "url(#clip)")
  }

  chartPath
    .attr("fill", "none")
    .attr("stroke", `${variable ? colorId : lineColor}`)
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", dataArea)

  chart
    .append("g")
    .attr("class", `${type === "focus" ? "focus-x-axis" : "context-x-axis"}`)
    .style("color", color)
    .attr("transform", `translate(0, ${chartHeight - margin.bottom})`)
    .call(xAxis)

  chart
    .append("g")
    .attr("class", "y-axis")
    .style("color", color)
    .call(yAxis)
    .call((g) => g.select(".domain").remove()) // y축 라인 제거

  if (type === "context") {
    chart.append("g").attr("class", "context-brush")
  }
  chart
    .append("g")
    .attr("class", `${type === "focus" ? "focus-tooltip" : "context-tooltip"}`)
  chart.append("rect").attr("class", "pivot")

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

export default variableMultiLineChart
