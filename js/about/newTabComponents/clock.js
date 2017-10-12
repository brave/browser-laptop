/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

class Clock extends React.Component {
  constructor () {
    super()
    this.dateTimeFormat = new Intl.DateTimeFormat([], {hour: '2-digit', minute: '2-digit'})
    this.state = this.getClockState(new Date())
  }
  get formattedTime () {
    const time = this.state.currentTime
    return time.replace(' AM', '').replace(' PM', '')
  }
  get formattedTimePeriod () {
    const time = this.state.currentTime
    if (time.toUpperCase().indexOf(' AM') > -1) return 'AM'
    if (time.toUpperCase().indexOf(' PM') > -1) return 'PM'
    return ''
  }
  getMinutes (date) {
    return Math.floor(date / 1000 / 60)
  }
  maybeUpdateClock () {
    const now = new Date()
    if (this.getMinutes(this.state.date) !== this.getMinutes(now)) {
      this.setState(this.getClockState(now))
    }
  }
  getClockState (now) {
    return {
      date: now,
      currentTime: this.dateTimeFormat.format(now)
    }
  }
  componentDidMount () {
    window.setInterval(this.maybeUpdateClock.bind(this), 2000)
  }
  render () {
    return <div className='clock'>
      <span className='time'>{this.formattedTime}</span><span className='timePeriod'>{this.formattedTimePeriod}</span>
    </div>
  }
}

module.exports = Clock
