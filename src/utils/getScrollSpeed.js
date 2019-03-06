// https://stackoverflow.com/a/22599173/2255980
let lastPos = 0
let newPos = 0
let delta = 0
let timer = null

function clear() {
  lastPos = 0
}

// TODO: need to indicate when scrolling has stopped

export default function (latestYOffset, scrollThrottleMs) {
  newPos = latestYOffset
  
  if (lastPos !== 0) delta = newPos - lastPos

  lastPos = newPos
  timer && clearTimeout(timer)
  timer = setTimeout(clear, scrollThrottleMs * 2.5)
  return Math.abs(delta)
}
