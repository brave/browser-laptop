/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')
const NavigationButton = require('./navigationButton')
const ShieldIcon = require('../../../../../icons/brave')

// Actions
const windowActions = require('../../../../../js/actions/windowActions')

// State
const tabState = require('../../../../common/state/tabState')
const shieldState = require('../../../../common/state/shieldState')
const menuBarState = require('../../../../common/state/menuBarState')
const siteSettingsState = require('../../../../common/state/siteSettingsState')

// Utils
const frameStateUtil = require('../../../../../js/state/frameStateUtil')
const platformUtil = require('../../../../common/lib/platformUtil')
const {getSetting} = require('../../../../../js/settings')
const siteSettings = require('../../../../../js/state/siteSettings')

// Constants
const appConfig = require('../../../../../js/constants/appConfig')
const settings = require('../../../../../js/constants/settings')

const isWindows = platformUtil.isWindows()
const hasArialNarrowFont = platformUtil.isWindows()

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
            ((this.props.shieldEnabled && this.props.activeTabShowingMessageBox !== true) ? 'braveMenu' : 'braveMenuDisabled') +
            ` shield-down-${this.props.shieldsDown}`
          }
          l10nId={'braveMenu'}
          disabled={this.props.activeTabShowingMessageBox}
          onClick={this.onBraveMenu}
          styles={styles.braveMenu__button}
          active={this.props.shieldPanelShowing}
        >
          <ShieldIcon styles={styles.braveMenu__icon} />
        </NavigationButton>
        {
          this.props.isCounterEnabled
            ? <div className={css(
                styles.braveMenu__counter,

                // delay badge show-up.
                // this is also set for extension badge
                // in a way that both can appear at the same time.
                styles.braveMenu__counter_subtleShowUp
              )}
              data-test-id='lionBadge'
            >
              {this.props.totalBlocks}
            </div>
            : null
        }
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
    margin: '0 6px 0 5px'
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
    margin: 0,
    '--icon-line-color': 'var(--shields-line-color)',
    '--icon-fill-color': 'var(--shields-fill-color)'
  },

  braveMenu__icon: {
    padding: 0
  },

  braveMenu__counter: {
    position: 'absolute',
    right: '-2px',
    bottom: '1px',
    textAlign: 'center',
    pointerEvents: 'none',
    fontSize: '8px',
    WebkitUserSelect: 'none',
    background: 'rgba(105,105,112, .9)',
    padding: !hasArialNarrowFont ? '1px 2px' : '2px 2px 1px 2px',
    color: 'white',
    borderRadius: '5px',
    fontFamily: !hasArialNarrowFont ? '"Helvetica Neue", Ubuntu, sans-serif' : '"Arial Narrow"',
    minWidth: '10px'
  },

  braveMenu__counter_subtleShowUp: globalStyles.animations.subtleShowUp
})

module.exports = ReduxComponent.connect(ShieldsButton)
