import * as R from "ramda"

export function gatherByKeys(data = []) {
  const dataKeys = R.keys(R.head(data))
  const obj = {}

  dataKeys.forEach((key) => {
    obj[key] = data.map((item) => R.prop(key, item))
  })

  return obj
}

export function conditionCheck({ threshold = [], data = [] }) {
  //threshold = [{timestamp, min, max}, ...]
  const setCondition = data.map((i) => {
    threshold.forEach((t) => (i.condition = t.min < i.value && t.max > i.value))

    return i
  })

  return setCondition
}
