/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')

const Button = require('./button')

class NotificationItem extends ImmutableComponent {
  clickHandler (buttonIndex, e) {
    console.log('got click of index', buttonIndex, this.props.detail.id)
  }

  render () {
    let i = 0
    return <div className='notificationItem'>
      <span className='notificationMessage'>this.props.detail.message</span>
      {
        this.props.detail.buttons.map((button) => {
          <Button disabled={false}
            label={button}
            className='notificationButton'
            onClick={this.clickHandler.bind(i++, this)}/>
        })
      }
    </div>
  }
}

class NotificationBar extends ImmutableComponent {
  render () {
    if (!this.props.notifications || !this.props.notifications.size) {
      return null
    }

    return <div className='notificationBar'>
    {
      this.props.notifications.map((notificationDetail) => {
        <NotificationItem detail={notificationDetail} />
      })
    }
    </div>
  }
}

module.exports = NotificationBar
