/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const Dialog = require('../common/dialog')
const BrowserButton = require('../common/browserButton')
const {
  CommonForm,
  CommonFormSection,
  CommonFormTextbox,
  commonFormStyles
} = require('../common/commonForm')

// Actions
const appActions = require('../../../../js/actions/appActions')

// Constants
const KeyCodes = require('../../../common/constants/keyCodes')

// Styles
const commonStyles = require('../styles/commonStyles')

class LoginRequired extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      username: '',
      password: ''
    }
    this.onUsernameChange = this.onUsernameChange.bind(this)
    this.onPasswordChange = this.onPasswordChange.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onClose = this.onClose.bind(this)
    this.onSave = this.onSave.bind(this)
  }

  focus () {
    this.loginUsername.select()
    this.loginUsername.focus()
  }

  componentDidMount () {
    this.focus()
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
    appActions.setLoginResponseDetail(this.props.tabId)
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
    appActions.setLoginResponseDetail(this.props.tabId, this.state)
  }

  render () {
    const l10nArgs = {
      host: this.props.loginRequiredUrl
    }
    return <Dialog onHide={this.onClose} isClickDismiss>
      <CommonForm onClick={this.onClick.bind(this)}>
        <CommonFormSection title l10nId='basicAuthRequired' />
        <CommonFormSection>
          <span data-l10n-id='basicAuthMessage' data-l10n-args={JSON.stringify(l10nArgs)} />
        </CommonFormSection>
        <CommonFormSection>
          <div className={css(styles.sectionWrapper)}>
            <div className={css(
              commonFormStyles.inputWrapper,
              commonFormStyles.inputWrapper__label
            )} data-test-id='loginLabel'>
              <label data-l10n-id='basicAuthUsernameLabel' htmlFor='loginUsername' />
              <label className={css(commonFormStyles.input__bottomRow)} data-l10n-id='basicAuthPasswordLabel' htmlFor='loginPassword' />
            </div>
            {
              <div id='loginInput' className={css(
                commonFormStyles.inputWrapper,
                commonFormStyles.inputWrapper__input
              )}>
                <input className={css(
                  commonStyles.formControl,
                  commonStyles.textbox,
                  commonStyles.textbox__outlineable,
                  commonFormStyles.input__box
                )}
                  spellCheck='false'
                  onKeyDown={this.onKeyDown}
                  onChange={this.onUsernameChange}
                  value={this.state.username}
                  ref={(loginUsername) => { this.loginUsername = loginUsername }}
                />
                <div className={css(commonFormStyles.input__marginRow)}>
                  <CommonFormTextbox
                    spellCheck='false'
                    type='password'
                    onKeyDown={this.onKeyDown}
                    onChange={this.onPasswordChange}
                    value={this.state.password}
                  />
                </div>
              </div>
            }
          </div>
        </CommonFormSection>
        <CommonFormSection buttons>
          <BrowserButton groupedItem secondaryColor
            l10nId='cancel'
            onClick={this.onClose}
          />
          <BrowserButton groupedItem primaryColor
            l10nId='ok'
            onClick={this.onSave}
          />
        </CommonFormSection>
      </CommonForm>
    </Dialog>
  }
}

const styles = StyleSheet.create({
  sectionWrapper: {
    display: 'flex',
    justifyContent: 'space-between'
  }
})

module.exports = LoginRequired
