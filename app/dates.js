// The iso week is defined as the week number starting on January 4th indexed to the first Thursday
var isoWeek = function () {
  var date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  var jan4 = new Date(date.getFullYear(), 0, 4)
  return 1 + Math.round(
      ((date.getTime() - jan4.getTime()) / 86400000) - 3 +
      (((jan4.getDay() + 6) % 7) / 7)
    )
}

// Local data yyyy-mm-dd (with zero padding)
var localYMD = (d) => {
  d = d || new Date()
  var month = (d.getMonth() + 1).toString()
  var day = (d.getDate()).toString()
  return [d.getFullYear(), ('00' + month).substring(month.length), ('00' + day).substring(day.length)].join('-')
}

exports.todayYMD = () => {
  return localYMD()
}

exports.todayWOY = () => {
  return isoWeek()
}

// We add 1 to make sure January does not fail a truth test
exports.todayMonth = () => {
  return (new Date()).getMonth() + 1
}
