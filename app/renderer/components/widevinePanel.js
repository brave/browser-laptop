/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const Dialog = require('../../../js/components/dialog')
const Button = require('../../../js/components/button')
const appConfig = require('../../../js/constants/appConfig')
const WidevineInfo = require('./widevineInfo')
const SwitchControl = require('../../../js/components/switchControl')
const windowActions = require('../../../js/actions/windowActions')
const appActions = require('../../../js/actions/appActions')
const siteUtil = require('../../../js/state/siteUtil')

class ImportBrowserDataPanel extends ImmutableComponent {
  constructor () {
    super()
    this.onInstallAndAllow = this.onInstallAndAllow.bind(this)
    this.onClickRememberForNetflix = this.onClickRememberForNetflix.bind(this)
  }
  get origin () {
    return siteUtil.getOrigin(this.props.widevinePanelDetail.get('location'))
  }
  onInstallAndAllow () {
    appActions.setResourceEnabled(appConfig.resourceNames.WIDEVINE, true)
    this.props.onHide()
    // The site permissions that is set if this.props.widevinePanelDetail.get('alsoAddRememberSiteSetting') is handled once the resource is ready
    // in main.js.  This is so that the reload doesn't happen until it is ready.
  }
  onClickRememberForNetflix (e) {
    windowActions.widevinePanelDetailChanged({
      alsoAddRememberSiteSetting: e.target.value
    })
  }
  render () {
    const isLinux = process.platform === 'linux'
    if (isLinux) {
      return null
    }
    return <Dialog onHide={this.props.onHide} className='commonDialog' isClickDismiss>
      <div className='commonForm' onClick={(e) => e.stopPropagation()}>
        <h2 className='formSection commonFormTitle' data-l10n-id='widevinePanelTitle' />
        <div className='formSection'>
          <WidevineInfo createTabRequestedAction={appActions.createTabRequested} />
        </div>
        <div className='formSection commonFormButtons'>
          <Button l10nId='cancel' className='whiteButton' onClick={this.props.onHide} />
          <Button l10nId='installAndAllow' className='primaryButton' onClick={this.onInstallAndAllow} />
        </div>
        <div className='formSection commonFormBottom'>
          <div className='commonFormButtonGroup'>
            <SwitchControl id={this.props.prefKey}
              rightl10nId='rememberThisDecision'
              rightl10nArgs={JSON.stringify({origin: this.origin})}
              onClick={this.onClickRememberForNetflix}
              checkedOn={this.props.widevinePanelDetail.get('alsoAddRememberSiteSetting')} />
          </div>
        </div>
      </div>
    </Dialog>
  }
}

module.exports = ImportBrowserDataPanel
