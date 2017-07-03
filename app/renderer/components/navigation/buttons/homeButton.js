/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../../reduxComponent')

// Actions
const appActions = require('../../../../../js/actions/appActions')

// Constants
const settings = require('../../../../../js/constants/settings')

// State
const tabState = require('../../../../common/state/tabState')
const frameStateUtil = require('../../../../../js/state/frameStateUtil')

// Utils
const cx = require('../../../../../js/lib/classSet')
const eventUtil = require('../../../../../js/lib/eventUtil')
const {getSetting} = require('../../../../../js/settings')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../../styles/global')

const homeButtonIcon = require('../../../../../img/toolbar/home_btn.svg')

class HomeButton extends React.Component {
  constructor (props) {
    super(props)
    this.onHome = this.onHome.bind(this)
  }

  onHome (e) {
    getSetting(settings.HOMEPAGE).split('|')
      .forEach((homepage, i) => {
        if (i === 0 && !eventUtil.isForSecondaryAction(e)) {
          appActions.loadURLRequested(this.props.activeTabId, homepage)
        } else {
          appActions.createTabRequested({
            url: homepage,
            active: false
          })
        }
      })
  }

  mergeProps (state, dispatchProps, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const activeTabId = activeFrame.get('tabId', tabState.TAB_ID_NONE)

    const props = {}

    props.activeTabId = activeTabId

    return props
  }

  render () {
    return (
      <button className={cx({
        // TODO: check if iconOnly solves this and if not
        // find a way to remove cx cos cx is evooool :P
        normalizeButton: true,
        [css(styles.navigationButton, styles.navigationButton_home)]: true
      })}
        data-test-id='homeButton'
        data-l10n-id='homeButton'
        onClick={this.onHome}
      />
    )
  }
}

const styles = StyleSheet.create({
  navigationButton: {
    backgroundColor: globalStyles.color.buttonColor,
    display: 'inline-block',
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0
  },

  navigationButton_home: {
    background: `url(${homeButtonIcon}) center no-repeat`,
    backgroundSize: '16px 16px'
  }
})

module.exports = ReduxComponent.connect(HomeButton)
