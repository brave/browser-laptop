/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const PropTypes = require('prop-types')
const Dialog = require('./dialog')
const Button = require('./button')
const appActions = require('../actions/appActions')
const KeyCodes = require('../../app/common/constants/keyCodes')
const urlResolve = require('url').resolve

class LoginRequired extends React.Component {
  constructor () {
    super()
    this.state = {
      username: '',
      password: ''
    }
    this.onUsernameChange = this.onUsernameChange.bind(this)
    this.onPasswordChange = this.onPasswordChange.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onClose = this.onClose.bind(this)
  }
  focus () {
    this.loginUsername.select()
    this.loginUsername.focus()
  }
  componentDidMount () {
    this.focus()
  }
  get detail () {
    return this.props.loginRequiredDetail
  }
  get tabId () {
    return this.props.tabId
  }
  onKeyDown (e) {
    switch (e.keyCode) {
      case KeyCodes.ENTER:
        this.onSave()
        break
      case KeyCodes.ESC:
        this.onClose()
        break
    }
  }
  onClose () {
    appActions.setLoginResponseDetail(this.tabId)
  }
  onClick (e) {
    e.stopPropagation()
  }
  onUsernameChange (e) {
    this.setState({
      username: e.target.value
    })
  }
  onPasswordChange (e) {
    this.setState({
      password: e.target.value
    })
  }
  onSave () {
    this.focus()
    this.setState({
      username: '',
      password: ''
    })
    appActions.setLoginResponseDetail(this.tabId, this.state)
  }
  render () {
    const l10nArgs = {
      host: urlResolve(this.detail.getIn(['request', 'url']), '/')
    }
    return <Dialog onHide={this.onClose} isClickDismiss>
      <div className='genericForm' onClick={this.onClick.bind(this)}>
        <h2 data-l10n-id='basicAuthRequired' />
        <div className='genericFormSubtitle' data-l10n-id='basicAuthMessage' data-l10n-args={JSON.stringify(l10nArgs)} />
        <div className='genericFormTable'>
          <div id='loginUsername' className='formRow'>
            <label data-l10n-id='basicAuthUsernameLabel' htmlFor='loginUsername' />
            <input spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onUsernameChange} value={this.state.username} ref={(loginUsername) => { this.loginUsername = loginUsername }} />
          </div>
          {
            !this.isFolder
            ? <div id='loginPassword' className='formRow'>
              <label data-l10n-id='basicAuthPasswordLabel' htmlFor='loginPassword' />
              <input spellCheck='false' type='password' onKeyDown={this.onKeyDown} onChange={this.onPasswordChange} value={this.state.password} />
            </div>
            : null
          }
          <div className='formRow'>
            <Button l10nId='cancel' className='whiteButton' onClick={this.onClose} />
            <Button l10nId='ok' className='primaryButton' onClick={this.onSave.bind(this)} />
          </div>
        </div>
      </div>
    </Dialog>
  }
}

LoginRequired.propTypes = { frameProps: PropTypes.object }
module.exports = LoginRequired
