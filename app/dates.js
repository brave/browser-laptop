const moment = require('moment')

exports.todayYMD = () => {
  return moment().format('YYYY-MM-DD')
}
