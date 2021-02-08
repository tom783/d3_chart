import styled from "@emotion/styled"
import {
  Brush,
  ZoomableLineChart,
  ZoomableAreaChart,
  ZoomableAreaChartTooltip,
} from "./components-library/components"
import { data } from "./components-library/tempData/lineChartData"

const ViewPort = styled.div`
  background-color: #101112;
  width: 1200px;
  height: 650px;
  margin: 0 auto;
  transform: translateY(calc(50vh - 200px));
`

function App() {
  return (
    <ViewPort>
      {/* <ZoomableLineChart data={data} />
      <Brush data={data} /> */}
      <ZoomableAreaChartTooltip data={data} />
    </ViewPort>
  )
}

export default App
