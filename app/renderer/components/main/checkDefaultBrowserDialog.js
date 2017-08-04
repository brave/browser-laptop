/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')
const Dialog = require('../common/dialog')
const {BrowserButton} = require('../common/browserButton')
const SwitchControl = require('../common/switchControl')
const {
  CommonFormMedium,
  CommonFormSection,
  CommonFormButtonWrapper
} = require('../common/commonForm')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Constants
const settings = require('../../../../js/constants/settings')

// Utils
const {getSetting} = require('../../../../js/settings')

// Styles
const globalStyles = require('../styles/global')
const braveAbout = require('../../../extensions/brave/img/braveAbout.png')

class CheckDefaultBrowserDialog extends React.Component {
  constructor () {
    super()
    this.onCheckDefaultOnStartup = this.onCheckDefaultOnStartup.bind(this)
    this.onNotNow = this.onNotNow.bind(this)
    this.onClick = this.onClick.bind(this)
    this.onUseBrave = this.onUseBrave.bind(this)
  }

  onCheckDefaultOnStartup (e) {
    windowActions.setModalDialogDetail('checkDefaultBrowserDialog', {
      checkDefaultOnStartup: e.target.value
    })
  }
  onNotNow () {
    appActions.defaultBrowserUpdated(false)
    appActions.defaultBrowserCheckComplete()
    appActions.changeSetting(settings.CHECK_DEFAULT_ON_STARTUP, this.props.checkDefaultOnStartup)
    this.onHide()
  }
  onUseBrave () {
    appActions.defaultBrowserUpdated(true)
    appActions.defaultBrowserCheckComplete()
    appActions.changeSetting(settings.CHECK_DEFAULT_ON_STARTUP, this.props.checkDefaultOnStartup)
    this.onHide()
  }

  onHide () {
    windowActions.setModalDialogDetail('checkDefaultBrowserDialog')
  }

  onClick (e) {
    e.stopPropagation()
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')

    const props = {}
    props.checkDefaultOnStartup = currentWindow.getIn(['modalDialogDetail', 'checkDefaultBrowserDialog']) === undefined
      ? getSetting(settings.CHECK_DEFAULT_ON_STARTUP)
      : currentWindow.getIn(['modalDialogDetail', 'checkDefaultBrowserDialog', 'checkDefaultOnStartup'])

    return props
  }

  render () {
    return <Dialog className='checkDefaultBrowserDialog'>
      <CommonFormMedium onClick={this.onClick}>
        <CommonFormSection>
          <div className={css(styles.flexAlignCenter)}>
            <div className={css(styles.section__braveIcon)} />
            <div>
              <div className={css(styles.section__title)} data-l10n-id='makeBraveDefault' />
              <SwitchControl
                className={css(styles.section__switchControl)}
                rightl10nId='checkDefaultOnStartup'
                checkedOn={this.props.checkDefaultOnStartup}
                onClick={this.onCheckDefaultOnStartup}
              />
            </div>
          </div>
        </CommonFormSection>
        <CommonFormButtonWrapper>
          <BrowserButton groupedItem secondaryColor
            l10nId='notNow'
            testId='notNowButton'
            onClick={this.onNotNow}
          />
          <BrowserButton groupedItem primaryColor
            l10nId='useBrave'
            testId='useBraveButton'
            onClick={this.onUseBrave}
          />
        </CommonFormButtonWrapper>
      </CommonFormMedium>
    </Dialog>
  }
}

module.exports = ReduxComponent.connect(CheckDefaultBrowserDialog)

const styles = StyleSheet.create({
  flexAlignCenter: {
    display: 'flex',
    alignItems: 'center'
  },

  section__braveIcon: {
    backgroundImage: `image-set(url(${braveAbout}) 2x)`,
    backgroundRepeat: 'no-repeat',
    height: '64px',
    width: '64px',
    minWidth: '64px',
    marginRight: globalStyles.spacing.dialogInsideMargin
  },
  section__title: {
    fontWeight: 'bold'
  },
  section__switchControl: {
    paddingLeft: 0,
    marginTop: `calc(${globalStyles.spacing.dialogInsideMargin} / 2)`
  }
})
