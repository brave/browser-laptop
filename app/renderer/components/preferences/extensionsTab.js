/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')
const {thirdPartyPasswordManagers} = require('../../../../js/constants/passwordManagers')
const aboutActions = require('../../../../js/about/aboutActions')
const settings = require('../../../../js/constants/settings')
const config = require('../../../../js/constants/config')
const {getSetting} = require('../../../../js/settings')
const {SettingCheckbox} = require('../common/settings')
const commonStyles = require('../styles/commonStyles')
const {isPasswordManager, getExtensionKey, isBuiltInExtension, bravifyText} = require('../../lib/extensionsUtil')

const {DefaultSectionTitle} = require('../common/sectionTitle')

const HelpfulText = require('./helpfulText')
const SortableTable = require('../common/sortableTable')

class ExtensionsTab extends ImmutableComponent {
  getIcon (extension) {
    const icon = extension.getIn(['manifest', 'icons', '128'])
    return `${extension.get('base_path')}/${icon}`
  }

  onRemoveExtension (extensionId) {
    // Disable extension before uninstalling
    // otherwise user will not be able to install it again
    isPasswordManager(extensionId)
      ? aboutActions.changeSetting(settings.ACTIVE_PASSWORD_MANAGER, extensionId)
      : aboutActions.changeSetting(getExtensionKey(extensionId), false)

    aboutActions.extensionUninstalled(extensionId)
  }

  getCheckedExtension (extensionId) {
    const activePwManager = getSetting(settings.ACTIVE_PASSWORD_MANAGER, this.props.settings)
    return isPasswordManager(extensionId)
      ? activePwManager === getExtensionKey(extensionId)
      : void (0)
  }

  isRemovableExtension (extension) {
    // do not allow built-in extensions from being uninstalled
    return extension.get('excluded') && !isBuiltInExtension(extension.get('id'))
  }

  getRow (extension) {
    if ([config.braveExtensionId, config.syncExtensionId, config.cryptoTokenExtensionId].includes(extension.get('id')) ||
    (!extension.get('dummy') && this.isRemovableExtension(extension))) {
      return []
    }

    return [
      { // Icon
        html: <img className={css(styles.icon)} src={this.getIcon(extension)} />
      },
      { // Name
        html: <span data-extension-id={extension.get('id')}
          data-extension-enabled={extension.get('enabled')}
          data-l10n-id={bravifyText(extension.get('name'))} />
      },
      { // Description
        html: <span data-l10n-id={bravifyText(extension.get('description'))} />
      },
      { // Version
        html: <span data-l10n-id={extension.get('version') || 'latest'} />
      },
      { // Enable/Disable toggle
        html: <SettingCheckbox
          forPassword={thirdPartyPasswordManagers.includes(extension.get('id'))}
          prefKey={getExtensionKey(extension.get('id'))}
          settings={this.props.settings}
          checked={this.getCheckedExtension(extension.get('id'))}
          onChangeSetting={this.props.onChangeSetting} />
      }
    ]
  }

  render () {
    if (!this.props.extensions) {
      return null
    }
    return <section>
      <DefaultSectionTitle data-l10n-id='extensions' />
      <SortableTable
        fillAvailable
        largeRow
        sortingDisabled
        headings={['icon', 'name', 'description', 'version', 'enabled'] /* 'exclude' */}
        rowClassNames={
          this.props.extensions.map(entry => css(styles.tableRow)).toJS()
        }
        rows={this.props.extensions.map(entry => this.getRow(entry))}
      />
      <footer className={css(styles.moreInfo)}>
        <HelpfulText l10nId='extensionsTabFooterInfo'>&nbsp;
          <span data-l10n-id='community'
            className={css(commonStyles.linkText)}
            onClick={aboutActions.createTabRequested.bind(null, {
              url: 'https://community.brave.com/c/feature-requests/extension-requests'
            }, true)}
          />.
        </HelpfulText>
      </footer>
    </section>
  }
}

const styles = StyleSheet.create({
  tableRow: {
    fontSize: '15px',
    background: '#fff',

    ':nth-child(even)': {
      background: globalStyles.color.veryLightGray
    },

    ':hover': {
      background: globalStyles.color.lightGray
    }
  },

  icon: {
    display: 'flex',
    margin: 'auto',
    width: '32px',
    height: '32px'
  },

  moreInfo: {
    // ref: https://github.com/brave/browser-laptop/blob/64c48d5039b5ab66c45b5fdd5be68206ffd6aa89/app/renderer/components/preferences/paymentsTab.js#L292
    // and https://github.com/brave/browser-laptop/blob/0d0261a2d107d6173e917bb98b56de386601295b/less/about/preferences.less#L18
    margin: '40px 0'
  }
})

module.exports = ExtensionsTab
