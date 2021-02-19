import faker from "faker"
import moment from "moment"

export function makeData(dataLength = 10, range = 5) {
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

export function thresholdData(dataLength = 10, range = 5) {
  let data = []

  for (let i = 0; i < dataLength; i++) {
    const res = faker.random.number(range)
    const res2 = faker.random.number(range)

    data.push({
      timestamp: moment()
        .subtract(dataLength - i, "days")
        .valueOf(), // make timestamp
      min: res > res2 ? res2 : res,
      max: res < res2 ? res2 : res,
    })
  }

  return data
}
