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

const bindingEventsMultiLineChart = ({
  focus,
  focusX,
  focusY,
  focusXAxis,
  focusYAxis,
  focusDataArea,
  contextBrush,
  context,
  contextX,
  contextY,
  contextXAxis,
  contextYAxis,
  contextDataArea,
  defaultBrushSelectionHour = -1,
  useBrushHandle = true,
  height,
  data,
  margin,
}) => {
  const brushEvent = ({ selection }) => {
    let extent = selection.map((d) => {
      return contextX.invert(d)
    })
    focusX.domain(extent)
    focus.select(".focus-area").attr("d", focusDataArea)
    focus.select(".focus-x-axis").call(focusXAxis)
  }

  const defaultSelection = [
    contextX(utcHour.offset(contextX.domain()[1], defaultBrushSelectionHour)),
    contextX.range()[1],
  ]

  const brushended = ({ selection }) => {
    if (!selection) {
      context.select("g.x-brush").call(contextBrush.move, defaultSelection)
    }
  }

  contextBrush.on("brush", brushEvent).on("end", brushended)
  context
    .select("g.context-brush")
    .call(contextBrush)
    .call(contextBrush.move, defaultSelection)

  !useBrushHandle &&
    context.selectAll("g.x-brush .handle").attr("display", "none")
  !useBrushHandle &&
    context.select("g.x-brush .overlay").attr("pointer-events", "none")

  const setTooltip = ({
    targetChart,
    x,
    y,
    tooltip,
    height,
    margin,
    syncChart,
    syncX,
    syncY,
    syncTooltip,
  }) => {
    targetChart.on("touchmove mousemove", (e) => {
      const { timestamp, value } = bisect(pointer(e, targetChart.node())[0])

      tooltip
        .attr("transform", `translate(${x(timestamp)},${y(value)})`)
        .call(callout, `${value} ${formatDate(moment(timestamp))}`)
      targetChart
        .select("rect.pivot")
        .attr("transform", `translate(${x(timestamp)}, 0)`)
        .call(pivotOut, value, height, margin)

      syncTooltip
        .attr("transform", `translate(${syncX(timestamp)},${syncY(value)})`)
        .call(callout, `${value} ${formatDate(moment(timestamp))}`)
      syncChart
        .select("rect.pivot")
        .attr("transform", `translate(${syncX(timestamp)}, 0)`)
        .call(pivotOut, value, height, margin)
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

    const pivotOut = (g, value, height, margin) => {
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

  const focusTooltip = focus.select("g.focus-tooltip")
  const contextTooltip = context.select("g.context-tooltip")
  setTooltip({
    targetChart: context,
    x: contextX,
    y: contextY,
    tooltip: contextTooltip,
    height,
    margin,
    syncChart: focus,
    syncX: focusX,
    syncY: focusY,
    syncTooltip: focusTooltip,
  })

  setTooltip({
    targetChart: focus,
    x: focusX,
    y: focusY,
    tooltip: focusTooltip,
    height,
    margin,
    syncChart: context,
    syncX: contextX,
    syncY: contextY,
    syncTooltip: contextTooltip,
  })
}

export default bindingEventsMultiLineChart
