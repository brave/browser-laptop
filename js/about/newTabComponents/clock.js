/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
const React = require('react')

class Clock extends React.Component {
  constructor (props) {
    super(props)
    this.setDateTimeFormat()
    this.state = this.getClockState(new Date())
  }
  get formattedTime () {
    return this.state.currentTime.map(component => {
      if (component.type === 'literal') {
        // wrap ':' in a span with a class, so it can be centered
        if (component.value === ':') {
          return <span className='timeSeparator'>{component.value}</span>
        } else if (component.value.trim() === '') {
          // hide blank strings
          return null
        }
      } else if (component.type === 'dayperiod' || component.type === 'dayPeriod') {
        // hide day-period (AM / PM), it's rendered in a separate component
        return null
      }
      return component.value
    })
  }
  get formattedTimePeriod () {
    const time = this.state.currentTime
    const period = time.find(component => component.type === 'dayperiod' || component.type === 'dayPeriod')
    return period ? period.value : ''
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
  setDateTimeFormat () {
    this.dateTimeFormat = new Intl.DateTimeFormat([],
      {
        hour12: !this.props.displayTwentyFour,
        hour: '2-digit',
        minute: '2-digit'
      }
    )
  }
  getClockState (now) {
    return {
      date: now,
      currentTime: this.dateTimeFormat.formatToParts(now)
    }
  }
  applyUpdatedFormat () {
    this.setDateTimeFormat()
    this.setState(this.getClockState(new Date()))
  }
  componentDidMount () {
    window.setInterval(this.maybeUpdateClock.bind(this), 2000)
  }
  componentDidUpdate (prevProps) {
    if (prevProps.displayTwentyFour !== this.props.displayTwentyFour) {
      this.applyUpdatedFormat()
    }
  }

  render () {
    return <div className='clock'>
      <span className='time'>{this.formattedTime}</span><span className='timePeriod'>{this.formattedTimePeriod}</span>
    </div>
  }
}

module.exports = Clock
