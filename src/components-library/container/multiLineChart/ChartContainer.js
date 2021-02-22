import * as React from "react"
import styled from "@emotion/styled"
import zoomableSyncAreaChart from "../../utils/makeChart/zoomableSyncAreaChart"
import bindingEventsMultiLineChart from "../../utils/bindingEventsMultiLineChart"
import updateMultiLineChart from "../../utils/updateChart/updateMultiLineChart"

const ViewPort = styled.div`
  background-color: #101112;
  width: ${(props) => `${props.width}px`};
  margin: 0 auto;
  transform: translateY(calc(50vh - 200px));
`

const ChartContainer = ({ data, width, height, margin, lineColor, color }) => {
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
    } = await zoomableSyncAreaChart({
      container: contextRef.current,
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
    } = await zoomableSyncAreaChart({
      container: focusRef.current,
      data,
      type: "focus",
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
    } = await updateMultiLineChart({
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
    } = await updateMultiLineChart({
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
      updateChart()
    }
  }, [data, width, height, margin, color, lineColor])

  return (
    <ViewPort width={width}>
      <svg width={width} height={height} ref={contextRef}></svg>
      <svg width={width} height={height} ref={focusRef}></svg>
    </ViewPort>
  )
}

export default ChartContainer
