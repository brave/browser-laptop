
// We never included re-select lib, so let's just do a simple version.
// Avoid date-calculation for every render / non-related state change
// by memo-izing the function and only checking every hour.
const oneDay = 1000 * 60 * 60 * 24
const obsoleteDuration = oneDay * 10 // 10 days
const updateInterval = 1000 * 60 * 60 // 1 hour
let lastDeprecatedOn
let lastState
let lastValue = null

setInterval(function () {
  lastValue = null
}, updateInterval)

function getDaysUntilObsolete (state) {
  // Only run if 'deprecatedOn' has changed, or it's time to force-refresh
  if (lastValue === null ||
    (lastState !== state &&
    state.get('deprecatedOn') !== lastDeprecatedOn)
  ) {
    const deprecatedOn = state.get('deprecatedOn')
    if (!deprecatedOn) {
      console.error(`Didn't find deprecatedOn state property!`)
      return 10
    }
    const now = new Date().getTime()
    const obsoleteTime = deprecatedOn + obsoleteDuration
    const timeUntilObsolete = obsoleteTime - now
    const daysUntilObsolete = timeUntilObsolete > 0
                ? Math.ceil(timeUntilObsolete / oneDay)
                : 0
    lastState = state
    lastDeprecatedOn = deprecatedOn
    lastValue = daysUntilObsolete
    return daysUntilObsolete
  }
  return lastValue
}

module.exports.getIsObsolete = function getIsObsolete (state) {
  return getDaysUntilObsolete(state) === 0
}
module.exports.getDaysUntilObsolete = getDaysUntilObsolete

if (process.env.NODE_ENV === 'test') {
  module.exports.test_fireResetInterval = function () {
    lastValue = null
  }
}
