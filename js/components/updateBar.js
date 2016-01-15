/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')

const Button = require('./button')
const AppActions = require('../actions/appActions')

class UpdateBar extends ImmutableComponent {

  onUpdateNow () {
    AppActions.updateRequested()
  }
  onUpdateLater () {
    AppActions.updateLater()
  }

  render () {
    return <div className='updateBar'>
        <span className='updateHello' data-l10n-id='updateHello'/>
        <span className='updateMessage' data-l10n-id='updateAvail'/>
        <span className='updateRequiresRelaunch' data-l10n-id='updateRequiresRelaunch'/>
        <span className='updateSpacer'/>
        <Button className='updateButton updateLaterButton' l10nId='updateLater'
          onClick={this.onUpdateLater.bind(this)} />
        <Button className='updateButton updateNowButton' l10nId='updateNow'
          onClick={this.onUpdateNow.bind(this)} />
      </div>
  }

}

module.exports = UpdateBar
