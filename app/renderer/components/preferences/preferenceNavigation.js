const ImmutableComponent = require('../../../../js/components/immutableComponent')
const preferenceTabs = require('../../../../js/constants/preferenceTabs')
const PreferenceNavigationButton = require('./preferenceNavigationButton')
const HelpfulHints = require('./helpfulHints')

const {StyleSheet, css} = require('aphrodite')
const globalStyles = require('../styles/global')

// Icons
const iconGeneral = require('../../../extensions/brave/img/preferences/browser_prefs_general.svg')
const iconSearch = require('../../../extensions/brave/img/preferences/browser_prefs_search.svg')
const iconTabs = require('../../../extensions/brave/img/preferences/browser_prefs_tabs.svg')
const iconExtensions = require('../../../extensions/brave/img/preferences/browser_prefs_extensions.svg')
const iconPlugins = require('../../../extensions/brave/img/preferences/browser_prefs_plugins.svg')
const iconSecurity = require('../../../extensions/brave/img/preferences/browser_prefs_security.svg')
const iconShields = require('../../../extensions/brave/img/preferences/browser_prefs_shields.svg')
const iconPayments = require('../../../extensions/brave/img/preferences/browser_prefs_payments.svg')
// sync TBD
const iconSync = require('../../../extensions/brave/img/preferences/browser_prefs_sync.svg')
const iconAdvanced = require('../../../extensions/brave/img/preferences/browser_prefs_advanced.svg')

class PreferenceNavigation extends ImmutableComponent {
  render () {
    return <div className={css(styles.prefAside)}>
      <div className={css(styles.prefNav)}>
        <PreferenceNavigationButton icon={styles.general}
          dataL10nId='general'
          onClick={this.props.changeTab.bind(null, preferenceTabs.GENERAL)}
          selected={this.props.preferenceTab === preferenceTabs.GENERAL}
        />
        <PreferenceNavigationButton icon={styles.search}
          dataL10nId='search'
          onClick={this.props.changeTab.bind(null, preferenceTabs.SEARCH)}
          selected={this.props.preferenceTab === preferenceTabs.SEARCH}
        />
        <PreferenceNavigationButton icon={styles.tabs}
          dataL10nId='tabs'
          onClick={this.props.changeTab.bind(null, preferenceTabs.TABS)}
          selected={this.props.preferenceTab === preferenceTabs.TABS}
        />
        <PreferenceNavigationButton icon={styles.security}
          dataL10nId='security'
          onClick={this.props.changeTab.bind(null, preferenceTabs.SECURITY)}
          selected={this.props.preferenceTab === preferenceTabs.SECURITY}
        />
        <PreferenceNavigationButton icon={styles.sync}
          dataL10nId='sync'
          onClick={this.props.changeTab.bind(null, preferenceTabs.SYNC)}
          selected={this.props.preferenceTab === preferenceTabs.SYNC}
        />
        <PreferenceNavigationButton icon={styles.payments}
          dataL10nId='payments'
          onClick={this.props.changeTab.bind(null, preferenceTabs.PAYMENTS)}
          selected={this.props.preferenceTab === preferenceTabs.PAYMENTS}
        />
        <PreferenceNavigationButton icon={styles.extensions}
          dataL10nId='extensions'
          onClick={this.props.changeTab.bind(null, preferenceTabs.EXTENSIONS)}
          selected={this.props.preferenceTab === preferenceTabs.EXTENSIONS}
        />
        <PreferenceNavigationButton icon={styles.plugins}
          dataL10nId='plugins'
          onClick={this.props.changeTab.bind(null, preferenceTabs.PLUGINS)}
          selected={this.props.preferenceTab === preferenceTabs.PLUGINS}
        />
        <PreferenceNavigationButton icon={styles.shields}
          dataL10nId='shields'
          onClick={this.props.changeTab.bind(null, preferenceTabs.SHIELDS)}
          selected={this.props.preferenceTab === preferenceTabs.SHIELDS}
        />
        <PreferenceNavigationButton icon={styles.advanced}
          dataL10nId='advanced'
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
    background: `linear-gradient(${globalStyles.color.gray}, ${globalStyles.color.mediumGray})`,
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
  shields: navIcon(iconShields),
  payments: navIcon(iconPayments),
  sync: navIcon(iconSync),
  extensions: navIcon(iconExtensions),
  advanced: navIcon(iconAdvanced)
})

module.exports = PreferenceNavigation
