/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')

const Button = require('./button')
const AppActions = require('../actions/appActions')

class UpdateBar extends ImmutableComponent {

  onUpdate () {
    AppActions.updateRequested(this.props.frameProps)
  }

  render () {
    return <div id='updateBar'>
        <Button label='Update'
          onClick={this.onUpdate.bind(this)} />
      </div>
  }

}

module.exports = UpdateBar
