const ImmutableComponent = require('../immutableComponent')
const preferenceTabs = require('../../../../js/constants/preferenceTabs')
const PreferenceNavigationButton = require('./preferenceNavigationButton')
const HelpfulHints = require('./helpfulHints')

const {StyleSheet, css} = require('aphrodite')
const globalStyles = require('../styles/global')
const { theme } = require('../styles/theme')

// Icons
const iconGeneral = require('../../../extensions/brave/img/preferences/browser_prefs_general.svg')
const iconSearch = require('../../../extensions/brave/img/preferences/browser_prefs_search.svg')
const iconTabs = require('../../../extensions/brave/img/preferences/browser_prefs_tabs.svg')
const iconExtensions = require('../../../extensions/brave/img/preferences/browser_prefs_extensions.svg')
const iconPlugins = require('../../../extensions/brave/img/preferences/browser_prefs_plugins.svg')
const iconSecurity = require('../../../extensions/brave/img/preferences/browser_prefs_security.svg')
const iconShieldsOn = require('../../../extensions/brave/img/preferences/browser_prefs_shields_on.svg')
const iconShieldsOff = require('../../../extensions/brave/img/preferences/browser_prefs_shields_off.svg')
const iconPaymentsOn = require('../../../extensions/brave/img/preferences/browser_prefs_payments_on.svg')
const iconPaymentsOff = require('../../../extensions/brave/img/preferences/browser_prefs_payments_off.svg')
// sync TBD
const iconSync = require('../../../extensions/brave/img/preferences/browser_prefs_sync.svg')
const iconAdvanced = require('../../../extensions/brave/img/preferences/browser_prefs_advanced.svg')

class PreferenceNavigation extends ImmutableComponent {
  render () {
    return <div className={css(styles.prefAside)}>
      <div className={css(styles.prefNav)}>
        <PreferenceNavigationButton icon={styles.general}
          l10nId='general'
          onClick={this.props.changeTab.bind(null, preferenceTabs.GENERAL)}
          selected={this.props.preferenceTab === preferenceTabs.GENERAL}
        />
        <PreferenceNavigationButton icon={styles.search}
          l10nId='search'
          onClick={this.props.changeTab.bind(null, preferenceTabs.SEARCH)}
          selected={this.props.preferenceTab === preferenceTabs.SEARCH}
        />
        <PreferenceNavigationButton icon={styles.tabs}
          l10nId='tabs'
          testId='tabsTabButton'
          onClick={this.props.changeTab.bind(null, preferenceTabs.TABS)}
          selected={this.props.preferenceTab === preferenceTabs.TABS}
        />
        <PreferenceNavigationButton icon={styles.security}
          l10nId='security'
          testId='securityTabButton'
          onClick={this.props.changeTab.bind(null, preferenceTabs.SECURITY)}
          selected={this.props.preferenceTab === preferenceTabs.SECURITY}
        />
        <PreferenceNavigationButton icon={styles.sync}
          l10nId='sync'
          testId='syncTabButton'
          onClick={this.props.changeTab.bind(null, preferenceTabs.SYNC)}
          selected={this.props.preferenceTab === preferenceTabs.SYNC}
        />
        <PreferenceNavigationButton
          iconOn={styles.paymentsOn}
          iconOff={styles.paymentsOff}
          l10nId='payments'
          testId='paymentsTabButton'
          onClick={this.props.changeTab.bind(null, preferenceTabs.PAYMENTS)}
          selected={this.props.preferenceTab === preferenceTabs.PAYMENTS}
        />
        <PreferenceNavigationButton icon={styles.extensions}
          l10nId='extensions'
          onClick={this.props.changeTab.bind(null, preferenceTabs.EXTENSIONS)}
          selected={this.props.preferenceTab === preferenceTabs.EXTENSIONS}
        />
        <PreferenceNavigationButton icon={styles.plugins}
          l10nId='plugins'
          onClick={this.props.changeTab.bind(null, preferenceTabs.PLUGINS)}
          selected={this.props.preferenceTab === preferenceTabs.PLUGINS}
        />
        <PreferenceNavigationButton
          iconOn={styles.shieldsOn}
          iconOff={styles.shieldsOff}
          l10nId='shields'
          onClick={this.props.changeTab.bind(null, preferenceTabs.SHIELDS)}
          selected={this.props.preferenceTab === preferenceTabs.SHIELDS}
        />
        <PreferenceNavigationButton icon={styles.advanced}
          l10nId='advanced'
          onClick={this.props.changeTab.bind(null, preferenceTabs.ADVANCED)}
          selected={this.props.preferenceTab === preferenceTabs.ADVANCED}
        />
      </div>
      <HelpfulHints hintNumber={this.props.hintNumber} refreshHint={this.props.refreshHint} />
    </div>
  }
}

const navIcon = icon => ({WebkitMask: `url(${icon}) no-repeat 0 0`})
const styles = StyleSheet.create({
  prefAside: {
    background: theme.preferences.navigationBackground,
    boxShadow: globalStyles.shadow.insetShadow,
    position: 'fixed',
    zIndex: '600',
    width: globalStyles.spacing.sideBarWidth,
    height: '100%',
    display: 'flex',
    flexFlow: 'column nowrap',
    fontSize: '16px'
  },

  prefNav: {
    display: 'flex',
    flexFlow: 'column nowrap',
    flex: '1 0 auto',
    padding: '30px 0'
  },

  general: navIcon(iconGeneral),
  search: navIcon(iconSearch),
  tabs: navIcon(iconTabs),
  plugins: navIcon(iconPlugins),
  security: navIcon(iconSecurity),
  shieldsOn: {background: `url(${iconShieldsOn}) no-repeat 0 0`},
  shieldsOff: navIcon(iconShieldsOff),
  paymentsOn: {background: `url(${iconPaymentsOn}) no-repeat 0 0`},
  paymentsOff: navIcon(iconPaymentsOff),
  sync: navIcon(iconSync),
  extensions: navIcon(iconExtensions),
  advanced: navIcon(iconAdvanced)
})

module.exports = PreferenceNavigation
