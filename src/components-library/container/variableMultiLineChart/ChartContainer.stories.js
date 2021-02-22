import ChartContainer from "./ChartContainer"
import { makeData, thresholdData } from "../../tempData/lineChartData"

export default {
  title: "VariableChartContainer",
  component: ChartContainer,
}

export const Basic = (args) => <ChartContainer {...args} />

Basic.args = {
  data: makeData(100, 500),
  thresholdData: thresholdData(100, 500),
  width: 1200,
  height: 200,
  margin: { top: 20, right: 39, left: 50, bottom: 30 },
}
