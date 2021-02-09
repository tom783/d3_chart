import styled from "@emotion/styled"
import {
  Brush,
  ZoomableLineChart,
  ZoomableAreaChart,
  ZoomableSyncAreaChartTooltip,
} from "./components-library/components"
import { data } from "./components-library/tempData/lineChartData"

const ViewPort = styled.div`
  background-color: #101112;
  width: 1200px;
  margin: 0 auto;
  transform: translateY(calc(50vh - 200px));
`

function App() {
  return (
    <ViewPort>
      {/* <ZoomableLineChart data={data} />
      <Brush data={data} /> */}
      <ZoomableSyncAreaChartTooltip data={data} />
    </ViewPort>
  )
}

export default App
