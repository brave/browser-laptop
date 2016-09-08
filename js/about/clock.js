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
    const date = new Date()
    const timeOptions = {hour: '2-digit', minute: '2-digit'}
    const currentTime = date.toLocaleTimeString([], timeOptions)

    return currentTime
  }
  updateClock () {
    this.setState({
      currentTime: this.currentTime
    })
  }
  componentDidMount () {
    window.setInterval(this.updateClock.bind(this), 1000)
  }
  render () {
    return <div className='clock'>
      <span className='time'>{this.state.currentTime}</span>
    </div>
  }
}
module.exports = Clock
