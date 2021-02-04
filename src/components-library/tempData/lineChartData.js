import faker from "faker"
import moment from "moment"

function makeData(dataLength = 10, range = 5) {
  let data = []

  for (let i = 0; i < dataLength; i++) {
    data.push({
      timestamp: moment()
        .subtract(dataLength - i, "days")
        .valueOf(), // make timestamp
      value: faker.random.number(range),
    })
  }

  return data
}

export const data = makeData(100, 500)
