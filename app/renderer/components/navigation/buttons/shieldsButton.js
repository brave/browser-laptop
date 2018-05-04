/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')
const NavigationButton = require('./navigationButton')

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
const {theme} = require('../../styles/theme')

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
          this.props.shieldPanelShowing && styles.braveMenu_open,
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
          class={css(styles.braveMenu__button)}
        >
          <svg xmlns='http://www.w3.org/2000/svg' width='16' height='18'>
            <path className={css(styles.braveMenu__iconPath)} strokeWidth='1.5' d='M14.53095 6.26826224c-.0445223-.76583059-.084629-1.3499159-.1200692-1.75002362-.0111845-.12627004-.0218121-.23303532-.0316863-.3192869-1.0933479-.78319055-1.8253695-1.14758745-1.8841038-1.128047l-.3893086.12951984-1.9498865-1.57673235-2.487197-.13492532-2.55698464.13498489-1.92275392 1.60180845-.39752772-.13416177c-.0611308-.02063105-.82832086.36345453-1.9039341 1.13394828-.00828918.08488998-.0172281.18917136-.02668334.31202497-.03052664.39663806-.06576799.97703202-.10554544 1.73931767l1.94698725 7.09873002c.13944205.5091829.46268472.957941.91303402 1.2656017.05029967.0340238.14702233.099134.282976.1901564.22703687.1520035.48171817.3214537.75803168.5039712.78927211.5213497 1.59323528 1.0426313 2.36348108 1.5286358.13904932.0877364.27595143.1736524.41052293.2576151.03766629.0234923.03766629.0234923.07564418.0471435.08516233.0530753.12714318.0681879.15474019.06807.00750363.0000982.04925517-.01495.13228124-.0670692.95018545-.5972941 1.88359105-1.2006751 2.76020989-1.779447.306718-.2025051.5843423-.3874108.8278903-.5508894.1457401-.0978262.2474691-.1665893.2981982-.2010914.4526923-.3100845.7754682-.7594171.9144232-1.2689953L14.53095 6.26826224zM.91246307 4.01682341c.00012001-.00062769.00024123-.00128282.00037515-.0020066-.00010416.00050658-.0002177.00108567-.00034023.00173593z' />
          </svg>
        </NavigationButton>
        {
          this.props.isCounterEnabled
            ? <div className={css(
                styles.braveMenu__counter,
                (this.props.menuBarVisible || !isWindows) && styles.braveMenu__counter_right,

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
    transition: 'opacity .24s ease-in-out'
  },

  braveMenu_disabled: {
    // See: browserButton_disabled
    pointerEvents: 'none',
    animation: 'none',
    opacity: 0.25,
    '--shields-line-color': globalStyles.color.buttonColor
  },

  // braveMenu__braveShield: {
  //   marginRight: globalStyles.spacing.navbarButtonSpacing
  // },

  braveMenu_down: {
    '--shields-line-color': globalStyles.color.buttonColor
  },

  braveMenu_open: {
    '--shields-fill-color': 'var(--shields-line-color)'
  },

  braveMenu_isCaptionButton: {
    marginRight: '3px'
  },

  braveMenu__button: {
    ':active': {
     // '--shields-fill-color': 'var(--shields-line-color)'
    }
  },

  braveMenu__iconPath: {
    fill: 'var(--shields-fill-color)',
    stroke: 'var(--shields-line-color)',
    transition: 'stroke .24s ease-in-out, fill .24s ease-in-oute'
  },

  braveMenu__counter: {
    left: 'calc(50% - 1px)',
    top: '14px',
    position: 'absolute',
    color: theme.navigator.braveMenu.counter.color,
    borderRadius: '2.5px',
    padding: '1px 2px',
    pointerEvents: 'none',
    font: '6pt "Arial Narrow"',
    textAlign: 'center',
    background: theme.navigator.braveMenu.counter.backgroundColor,
    minWidth: '10px',
    WebkitUserSelect: 'none'
  },

  braveMenu__counter_right: {
    left: 'auto',
    right: '2px'
  },

  braveMenu__counter_subtleShowUp: globalStyles.animations.subtleShowUp
})

module.exports = ReduxComponent.connect(ShieldsButton)
