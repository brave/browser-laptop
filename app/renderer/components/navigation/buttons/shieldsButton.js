/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')
const NavigationButton = require('./navigationButton')
const ShieldIcon = require('../../../../../icons/shield')

// Actions
const windowActions = require('../../../../../js/actions/windowActions')

// State
const tabState = require('../../../../common/state/tabState')
const shieldState = require('../../../../common/state/shieldState')
const menuBarState = require('../../../../common/state/menuBarState')
const siteSettingsState = require('../../../../common/state/siteSettingsState')

// Utils
const frameStateUtil = require('../../../../../js/state/frameStateUtil')
const isWindows = require('../../../../common/lib/platformUtil').isWindows()
const {getSetting} = require('../../../../../js/settings')
const siteSettings = require('../../../../../js/state/siteSettings')

// Constants
const appConfig = require('../../../../../js/constants/appConfig')
const settings = require('../../../../../js/constants/settings')

// Styles
const globalStyles = require('../../styles/global')

class ShieldsButton extends React.Component {
  constructor (props) {
    super(props)
    this.onBraveMenu = this.onBraveMenu.bind(this)
  }

  onBraveMenu () {
    if (this.props.shieldEnabled) {
      windowActions.setBraveryPanelDetail({})
    }
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')

    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const activeTabId = activeFrame.get('tabId', tabState.TAB_ID_NONE)
    const activeTab = tabState.getByTabId(state, activeTabId) || Immutable.Map()

    const allSiteSettings = siteSettingsState.getAllSiteSettings(state, activeFrame.get('isPrivate'))
    const activeSiteSettings = siteSettings.getSiteSettingsForURL(allSiteSettings, activeFrame.get('location'))
    const braverySettings = siteSettings.activeSettings(activeSiteSettings, state, appConfig)

    const shieldsEnabled = shieldState.braveShieldsEnabled(activeFrame)

    const props = {}
    props.activeTabShowingMessageBox = !!(!activeTab.isEmpty() && tabState.isShowingMessageBox(state, activeTabId))
    props.shieldsDown = !braverySettings.shieldsUp
    props.shieldEnabled = shieldsEnabled
    props.shieldPanelShowing = shieldsEnabled && !!currentWindow.get('braveryPanelDetail')
    props.menuBarVisible = menuBarState.isMenuBarVisible(currentWindow)
    props.isCaptionButton = isWindows && !props.menuBarVisible
    props.totalBlocks = activeFrame ? frameStateUtil.getTotalBlocks(activeFrame) : false
    props.isCounterEnabled = getSetting(settings.BLOCKED_COUNT_BADGE) &&
      props.totalBlocks &&
      props.shieldEnabled

    return props
  }

  render () {
    return (
      <div
        className={css(
          styles.braveMenu,
          // See #9696
          (!this.props.shieldEnabled || this.props.activeTabShowingMessageBox) && styles.braveMenu_disabled,
          this.props.shieldsDown && styles.braveMenu_down,
          this.props.isCaptionButton && styles.braveMenu_isCaptionButton
        )}
      >
        <NavigationButton
          testId={
            (this.props.shieldEnabled ? 'braveMenu' : 'braveMenuDisabled') +
            ` shield-down-${this.props.shieldsDown}`
          }
          l10nId={'braveMenu'}
          disabled={this.props.activeTabShowingMessageBox}
          onClick={this.onBraveMenu}
          styles={styles.braveMenu__button}
          active={this.props.shieldPanelShowing}
        >
          <ShieldIcon />
        </NavigationButton>
      </div>
    )
  }
}

const styles = StyleSheet.create({

  braveMenu: {
    '--shields-fill-color': 'transparent',
    '--shields-line-color': '#FB552A',
    WebkitAppRegion: 'no-drag',
    position: 'relative',
    transition: '--shields-line-color .24s ease-in-out',
    margin: '0 0 0 5px',
    ':hover': {
      '--shields-counter-opacity': 'transparent'
    }
  },

  braveMenu_disabled: {
    // See: browserButton_disabled
    pointerEvents: 'none',
    animation: 'none',
    '--shields-line-color': globalStyles.color.buttonColorDisabled
  },

  braveMenu_down: {
    '--shields-line-color': globalStyles.color.buttonColor
  },

  braveMenu_isCaptionButton: {
    marginRight: '3px'
  },

  braveMenu__button: {
    marginLeft: 0,
    marginRight: 0,
    '--icon-line-color': 'var(--shields-line-color)',
    '--icon-fill-color': 'var(--shields-fill-color)'
  },

  braveMenu__counter: {
    position: 'absolute',
    right: 0,
    left: 0,
    bottom: '-6px',
    textAlign: 'center',
    pointerEvents: 'none',
    fontSize: '8px',
    WebkitUserSelect: 'none',
    background: 'var(--shields-counter-background)',
    color: 'var(--shields-counter-opacity, var(--shields-line-color))',
    transition: 'color .24s ease-in-out'
  },

  braveMenu__counter_right: {

  },

  braveMenu__counter_subtleShowUp: globalStyles.animations.subtleShowUp
})

module.exports = ReduxComponent.connect(ShieldsButton)
