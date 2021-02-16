import ChartContainer from "./ChartContainer"
import { data } from "../../tempData/lineChartData"

export default {
  title: "ChartContainer",
  component: ChartContainer,
}

export const Basic = (args) => <ChartContainer {...args} />

Basic.args = {
  data,
  width: 1200,
  height: 200,
  margin: { top: 20, right: 39, left: 50, bottom: 30 },
}
