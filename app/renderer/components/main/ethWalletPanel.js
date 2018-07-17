/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const locale = require('../../../../js/l10n')
const ipc = window.chrome.ipcRenderer

// Components
const ReduxComponent = require('../reduxComponent')
const Dialog = require('../common/dialog')
const Button = require('../common/button')
const {
  CommonForm,
  CommonFormTitle,
  CommonFormButtonWrapper,
  CommonFormTextbox
} = require('../common/commonForm')

// Actions
const windowActions = require('../../../../js/actions/windowActions')

class EthWalletPanel extends React.Component {
  constructor (props) {
    super(props)
    this.onCreate = this.onCreate.bind(this)
    this.onHide = this.onHide.bind(this)
  }

  onChange (e) {
    windowActions.setEthWalletNewPasswordValue(e.target.value)
  }

  onCreate (e) {
    const pwd = this.props.newPasswordValue
    ipc.send('create-wallet', pwd)

    windowActions.setEthWalletNewPasswordValue('')
    windowActions.setEthWalletVisible(false)
  }

  onHide () {
    windowActions.setEthWalletNewPasswordValue('')
    windowActions.setEthWalletVisible(false)
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const ethWalletData = currentWindow.get('ethWalletData', Immutable.Map())
    const props = {}
    props.newPasswordValue = ethWalletData.get('newPasswordValue')

    return props
  }

  render () {
    return <Dialog onHide={this.onHide} testId='ethWalletPanel' isClickDismiss>
      <CommonForm data-test-id='ethWallet' onClick={(e) => e.stopPropagation()}>
        <CommonFormTitle
          data-test-id='createEthWalletTitle'
          data-l10n-id='createEthWallet'
        />
        <CommonFormTextbox placeholder={locale.translation('walletPassword')} type='password' value={this.props.newPasswordValue || ''} onChange={this.onChange} />
        <CommonFormButtonWrapper data-test-id='importBrowserDataButtons'>
          <Button l10nId='cancel' className='whiteButton' onClick={this.onHide} />
          <Button l10nId='create' className='primaryButton' onClick={this.onCreate} />
        </CommonFormButtonWrapper>
      </CommonForm>
    </Dialog>
  }
}

module.exports = ReduxComponent.connect(EthWalletPanel)
