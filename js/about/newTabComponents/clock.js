/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

class Clock extends React.Component {
  constructor () {
    super()
    this.state = {
      time: this.formattedTime,
      timePeriod: this.formattedTimePeriod
    }
  }
  get currentTime () {
    const date = new Date()
    const timeOptions = {hour: '2-digit', minute: '2-digit'}
    return date.toLocaleTimeString([], timeOptions)
  }
  get formattedTime () {
    const time = this.currentTime
    return time.replace(' AM', '').replace(' PM', '')
  }
  get formattedTimePeriod () {
    const time = this.currentTime
    if (time.toUpperCase().indexOf(' AM') > -1) return 'AM'
    if (time.toUpperCase().indexOf(' PM') > -1) return 'PM'
    return ''
  }
  updateClock () {
    this.setState({
      time: this.formattedTime,
      timePeriod: this.formattedTimePeriod
    })
  }
  componentDidMount () {
    window.setInterval(this.updateClock.bind(this), 1000)
  }
  render () {
    return <div className='clock'>
      <span className='time'>{this.state.time}</span><span className='timePeriod'>{this.state.timePeriod}</span>
    </div>
  }
}

module.exports = Clock
