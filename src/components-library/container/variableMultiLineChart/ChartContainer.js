import * as React from "react"
import variableMultiLineChart from "../../utils/makeChart/variableMultiLineChart"
import bindingEventsMultiLineChart from "../../utils/bindingEventsMultiLineChart"
import updateVariableChart from "../../utils/updateChart/updateVariableChart"

const ChartContainer = ({
  data,
  thresholdData,
  width,
  height,
  margin,
  lineColor,
  color,
}) => {
  const contextRef = React.useRef()
  const focusRef = React.useRef()
  const [init, setInit] = React.useState(true)

  const makeChart = async () => {
    const {
      chart: context,
      x: contextX,
      y: contextY,
      xAxis: contextXAxis,
      yAxis: contextYAxis,
      brush: contextBrush,
      dataArea: contextDataArea,
    } = await variableMultiLineChart({
      container: contextRef.current,
      data,
      thresholdData,
      width,
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
    } = await variableMultiLineChart({
      container: focusRef.current,
      data,
      thresholdData,
      type: "focus",
      width,
      height,
      margin,
      variable: true,
    })

    await bindingEventsMultiLineChart({
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

    setInit(false)
  }

  const updateChart = async () => {
    const {
      chart: context,
      x: contextX,
      y: contextY,
      xAxis: contextXAxis,
      yAxis: contextYAxis,
      brush: contextBrush,
      dataArea: contextDataArea,
    } = await updateVariableChart({
      updateTarget: contextRef.current,
      type: "context",
      data,
      width,
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
    } = await updateVariableChart({
      updateTarget: focusRef.current,
      type: "focus",
      data,
      width,
      height,
      margin,
    })

    await bindingEventsMultiLineChart({
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
    if (init) {
      makeChart()
    } else {
      console.log("update")
      updateChart()
    }
  }, [data, width, height, margin, color, lineColor])

  return (
    <>
      <svg width={width} height={height} ref={contextRef}></svg>
      <svg width={width} height={height} ref={focusRef}></svg>
    </>
  )
}

export default ChartContainer
