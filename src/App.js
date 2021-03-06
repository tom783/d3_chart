import * as React from "react"
import styled from "@emotion/styled"
import {
  Brush,
  ZoomableLineChart,
  ZoomableAreaChart,
  ZoomableSyncAreaChartTooltip,
  ZoomableSyncAreaChart,
} from "./components-library/components"
import {
  makeData,
  thresholdData,
} from "./components-library/tempData/lineChartData"
import { gatherByKeys } from "./components-library/utils/convertChartData"
import bindingEventsMultiLineChart from "./components-library/utils/bindingEventsMultiLineChart"
import {
  MultiChartContainer,
  VariableMultiChartContainer,
} from "./components-library/container"

const ViewPort = styled.div`
  background-color: #101112;
  width: ${(props) => `${props.width}px`};
  margin: 0 auto;
  transform: translateY(calc(50vh - 200px));
`

function App() {
  const [data, setData] = React.useState(null)
  const [threshold, setThreshold] = React.useState(null)
  const [width, setWidth] = React.useState(1200)
  React.useEffect(() => {
    setData(makeData(100, 500))
    setThreshold(thresholdData(100, 500))
  }, [])

  const change = (e) => {
    setData(makeData(100, 500))
    setThreshold(thresholdData(100, 500))
  }

  return (
    <ViewPort width={width}>
      <button onClick={change}>Set Data</button>
      {/* <ZoomableLineChart data={data} />
      <Brush data={data} /> */}
      {/* <ZoomableSyncAreaChartTooltip data={data} /> */}
      {/* {data && (
        <MultiChartContainer
          data={data}
          width={width}
          height={200}
          margin={{ top: 20, right: 39, left: 50, bottom: 30 }}
        />
      )} */}
      {data && (
        <VariableMultiChartContainer
          data={data}
          thresholdData={threshold}
          width={width}
          height={200}
          margin={{ top: 20, right: 39, left: 50, bottom: 30 }}
        />
      )}
    </ViewPort>
  )
}

export default App
