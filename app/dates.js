/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

// The iso week is defined as the week number starting on January 4th indexed to the first Thursday
const isoWeek = function () {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const jan4 = new Date(date.getFullYear(), 0, 4)
  return 1 + Math.round(
      ((date.getTime() - jan4.getTime()) / 86400000) - 3 +
      (((jan4.getDay() + 6) % 7) / 7)
    )
}

// Local data yyyy-mm-dd (with zero padding)
const localYMD = (d) => {
  d = d || new Date()
  const month = (d.getMonth() + 1).toString()
  const day = (d.getDate()).toString()
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

const MILLISECONDS_IN_ONE_DAY = 60 * 60 * 24 * 1000

// return YYYY-MM-DD of closest Monday in the past to current date
exports.lastMonday = (d) => {
  const monday = new Date(d.getTime() - ((d.getDay() - 1) * MILLISECONDS_IN_ONE_DAY))
  return localYMD(monday)
}
