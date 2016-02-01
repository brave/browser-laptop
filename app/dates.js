const moment = require('moment')

exports.todayYMD = () => {
  return moment().format('YYYY-MM-DD')
}

exports.todayWOY = () => {
  return moment().isoWeek()
}

// Months a returned zero based from moment
// We add 1 to make sure January does not fail a truth test
exports.todayMonth = () => {
  return moment().month() + 1
}
