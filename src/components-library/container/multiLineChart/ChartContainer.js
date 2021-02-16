import * as React from "react"
import ZoomableSyncAreaChart from "../../components/ZoomableSyncAreaChart"
import bindingEventsMultiLineChart from "../../utils/bindingEventsMultiLineChart"

const ChartContainer = ({ data, width, height, margin }) => {
  const contextRef = React.useRef()
  const focusRef = React.useRef()

  const makeChart = async () => {
    const {
      chart: context,
      x: contextX,
      y: contextY,
      xAxis: contextXAxis,
      yAxis: contextYAxis,
      brush: contextBrush,
      dataArea: contextDataArea,
    } = await ZoomableSyncAreaChart({
      container: contextRef.current,
      data,
      height,
      margin,
    })

    const {
      chart: focus,
      x: focusX,
      y: focusY,
      xAxis: focusXAxis,
      yAxis: focusYAxis,
      brush: focusBrush,
      dataArea: focusDataArea,
    } = await ZoomableSyncAreaChart({
      container: focusRef.current,
      data,
      type: "focus",
      height,
      margin,
    })

    bindingEventsMultiLineChart({
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
      height,
      data,
      margin,
    })
  }

  React.useEffect(() => {
    makeChart()
  }, [data, width, height, margin])

  return (
    <>
      <svg width={width} height={height} ref={contextRef}></svg>
      <svg width={width} height={height} ref={focusRef}></svg>
    </>
  )
}

export default ChartContainer
