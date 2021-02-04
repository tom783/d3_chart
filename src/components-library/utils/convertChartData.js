import * as R from "ramda"

export function gatherByKeys(data = []) {
  const dataKeys = R.keys(R.head(data))
  const obj = {}

  dataKeys.forEach((key) => {
    obj[key] = data.map((item) => R.prop(key, item))
  })

  return obj
}
