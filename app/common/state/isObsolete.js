
// We never included re-select lib, so let's just do a simple version.
// Avoid date-calculation for every render / non-related state change
// by memo-izing the function and only checking every hour.
const obsoleteDuration = 1000 * 60 * 60 * 24 * 10 // 10 days
const updateInterval = 1000 * 60 * 60 // 1 hour
let lastDeprecatedOn
let lastState
let lastValue = null

setInterval(function () {
  lastValue = null
}, updateInterval)

module.exports = function getIsObsolete (state) {
  // Only run if 'deprecatedOn' has changed, or it's time to force-refresh
  if (lastValue === null ||
        (lastState !== state &&
        state.get('deprecatedOn') !== lastDeprecatedOn)
    ) {
    const deprecatedOn = state.get('deprecatedOn')
    if (!deprecatedOn) {
      console.error(`Didn't find deprecatedOn state property!`)
      return false
    }
    const now = new Date().getTime()
    const isObsolete = (now - deprecatedOn) > obsoleteDuration
    lastState = state
    lastDeprecatedOn = deprecatedOn
    lastValue = isObsolete
    console.log({isObsolete, now, deprecatedOn})
    return isObsolete
  }
  return lastValue
}
