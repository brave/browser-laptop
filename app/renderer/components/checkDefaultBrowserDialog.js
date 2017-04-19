/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Dialog = require('../../../js/components/dialog')
const Button = require('../../../js/components/button')
const SwitchControl = require('../../../js/components/switchControl')
const appActions = require('../../../js/actions/appActions')
const windowActions = require('../../../js/actions/windowActions')
const settings = require('../../../js/constants/settings')

class CheckDefaultBrowserDialog extends ImmutableComponent {
  constructor () {
    super()
    this.onCheckDefaultOnStartup = this.onCheckDefaultOnStartup.bind(this)
    this.onNotNow = this.onNotNow.bind(this)
    this.onUseBrave = this.onUseBrave.bind(this)
  }

  onCheckDefaultOnStartup (e) {
    windowActions.setModalDialogDetail('checkDefaultBrowserDialog', {checkDefaultOnStartup: e.target.value})
  }
  onNotNow () {
    appActions.defaultBrowserUpdated(false)
    appActions.defaultBrowserCheckComplete()
    appActions.changeSetting(settings.CHECK_DEFAULT_ON_STARTUP, this.props.checkDefaultOnStartup)
    this.props.onHide()
  }
  onUseBrave () {
    appActions.defaultBrowserUpdated(true)
    appActions.defaultBrowserCheckComplete()
    appActions.changeSetting(settings.CHECK_DEFAULT_ON_STARTUP, this.props.checkDefaultOnStartup)
    this.props.onHide()
  }
  render () {
    return <Dialog className='checkDefaultBrowserDialog' >
      <div className='checkDefaultBrowser' onClick={(e) => e.stopPropagation()}>
        <div className='braveIcon' />
        <div className='makeBraveDefault' data-l10n-id='makeBraveDefault' />
        <SwitchControl className='checkDefaultOnStartup' rightl10nId='checkDefaultOnStartup'
          checkedOn={this.props.checkDefaultOnStartup} onClick={this.onCheckDefaultOnStartup} />
        <div className='checkDefaultBrowserButtons'>
          <Button l10nId='notNow' className='whiteButton' onClick={this.onNotNow} />
          <Button l10nId='useBrave' className='primaryButton' onClick={this.onUseBrave} />
        </div>
      </div>
    </Dialog>
  }
}

module.exports = CheckDefaultBrowserDialog
