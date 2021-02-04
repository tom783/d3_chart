import * as React from "react"
import { brushX, axisTop, scaleLinear, select, extent, scaleUtc } from "d3"
import { gatherByKeys } from "../utils/convertChartData"

function Brush({ data = [] }) {
  const testRef = React.useRef()
  const [state, setState] = React.useState([])

  const brushEvent = (e) => {
    const selectedExtend = e.selection
    setState(selectedExtend)
  }

  const createBrush = () => {
    const _data = gatherByKeys(data)

    const svgInstance = select(testRef.current)
    const scale = scaleUtc()
      .domain(extent(_data.timestamp, (d) => d))
      .range([0, 1200])
    const setBrushEvent = brushX()
      .extent([
        [0, 0], //[brush 설정 x축 범위, brush 높이 좌표]
        [1200, 100],
      ])
      .on("brush", brushEvent)
    const dayAxis = axisTop().scale(scale)

    svgInstance
      .append("g")
      .attr("class", "brushaxis")
      .attr("transform", "translate(0, 25)")

    svgInstance.select("g.brushaxis").call(dayAxis) // 브러쉬 axis축 설정
    svgInstance.append("g").attr("class", "brush").selectAll("g.brush")

    svgInstance.select("g.brush").call(setBrushEvent) // 브러쉬 이벤트 바인딩
  }

  React.useEffect(() => {
    createBrush()
  }, [])

  return (
    <>
      <svg width='1200px' ref={testRef}></svg>
      <div>
        {state.map((i, idx) => (
          <p key={idx}>{i}</p>
        ))}
      </div>
    </>
  )
}

export default Brush
