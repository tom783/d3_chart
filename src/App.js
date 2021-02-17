import * as React from "react"
import styled from "@emotion/styled"
import {
  Brush,
  ZoomableLineChart,
  ZoomableAreaChart,
  ZoomableSyncAreaChartTooltip,
  ZoomableSyncAreaChart,
} from "./components-library/components"
import { makeData } from "./components-library/tempData/lineChartData"
import { gatherByKeys } from "./components-library/utils/convertChartData"
import bindingEventsMultiLineChart from "./components-library/utils/bindingEventsMultiLineChart"
import { ChartContainer } from "./components-library/container"

const ViewPort = styled.div`
  background-color: #101112;
  width: 1200px;
  margin: 0 auto;
  transform: translateY(calc(50vh - 200px));
`

function App() {
  const [data, setData] = React.useState(null)
  React.useEffect(() => {
    setData(makeData(100, 500))
  }, [])

  const change = (e) => {
    setData(makeData(100, 500))
  }

  return (
    <ViewPort>
      <button onClick={change}>Set Data</button>
      {/* <ZoomableLineChart data={data} />
      <Brush data={data} /> */}
      {/* <ZoomableSyncAreaChartTooltip data={data} /> */}
      {data && (
        <ChartContainer
          data={data}
          width={1200}
          height={200}
          margin={{ top: 20, right: 39, left: 50, bottom: 30 }}
        />
      )}
    </ViewPort>
  )
}

export default App
