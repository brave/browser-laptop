/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

class Clock extends React.Component {
  constructor () {
    super()
    this.state = {}
  }
  get currentTime () {
    const currentdate = new Date()
    let hours = currentdate.getHours()
    let minutes = currentdate.getMinutes()
    let timeOfDay = (hours < 12) ? 'am' : 'pm'
    // Set hours to be between 0 - 12
    // and minutes less than 10 to have a leading zero
    hours = (hours > 12) ? hours - 12 : hours
    hours = (hours === 0) ? 12 : hours
    minutes = (minutes < 10 ? '0' : '') + minutes

    return {
      time: `${hours}:${minutes}`,
      dayTime: `${timeOfDay}`
    }
  }
  updateClock () {
    this.setState({
      currentTime: this.currentTime.time,
      dayTime: this.currentTime.dayTime
    })
  }
  componentDidMount () {
    window.setInterval(this.updateClock.bind(this), 1000)
  }
  render () {
    return <div className='clock'>
      <span className='time'>{this.state.currentTime}</span>
      <span className='dayTime'>{this.state.dayTime}</span>
    </div>
  }
}
module.exports = Clock
