/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../../js/components/immutableComponent')

const {StyleSheet, css} = require('aphrodite')
const globalStyles = require('../styles/global')
const {thirdPartyPasswordManagers} = require('../../../../js/constants/passwordManagers')
const aboutActions = require('../../../../js/about/aboutActions')
const settings = require('../../../../js/constants/settings')
const config = require('../../../../js/constants/config')
const {getSetting} = require('../../../../js/settings')
const {SettingCheckbox} = require('../settings')
const {isPasswordManager, getExtensionKey, isBuiltInExtension, bravifyText} = require('../../lib/extensionsUtil')

const HelpfulText = require('../helpfulText')
const SortableTable = require('../../../../js/components/sortableTable')

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
    if ([config.braveExtensionId, config.syncExtensionId].includes(extension.get('id')) ||
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
      },
      { // Exclude option
        html: !extension.get('isDummy') && !isBuiltInExtension(extension.get('id'))
        ? <div className={globalStyles.appIcons.trash}
          onClick={this.onRemoveExtension.bind(this, extension.get('id'))} />
        : <span data-l10n-id={isBuiltInExtension(extension.get('id')) ? 'integrated' : 'notInstalled'} />
      }
    ]
  }

  get columnClassNames () {
    return [
      css(styles.extensionsColumn, styles.center),
      css(styles.extensionsColumn),
      css(styles.extensionsColumn),
      css(styles.extensionsColumn),
      css(styles.extensionsColumn, styles.center),
      css(styles.extensionsColumn, styles.center)
    ]
  }

  render () {
    if (!this.props.extensions) {
      return null
    }
    return <div className={css(styles.extensionsContainer)}>
      <main className={css(styles.extensionsMain)}>
        <header className={css(styles.extensionsOption)}>
          <h1 className={css(styles.extensionsHeading)} data-l10n-id='extensions' />
        </header>
        <SortableTable
          tableClassNames={css(styles.extensionsTable)}
          headings={['icon', 'name', 'description', 'version', 'enabled', 'exclude']}
          columnClassNames={this.columnClassNames}
          rowClassNames={
            this.props.extensions.map(entry => (entry = css(styles.extensionsRow))).toJS()
          }
          rows={this.props.extensions.map(entry => this.getRow(entry))} />
      </main>
      <footer className={css(styles.moreInfo)}>
        <HelpfulText l10nId='extensionsTabFooterInfo'>&nbsp;
          <span data-l10n-id='community'
            className={css(styles.moreInfoLink)}
            onClick={aboutActions.createTabRequested.bind(null, {
              url: 'https://community.brave.com'
            }, true)} />.
        </HelpfulText>
      </footer>
    </div>
  }
}

const styles = StyleSheet.create({
  extensionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%'
  },

  extensionsMain: {
    paddingBottom: '40px'
  },

  icon: {
    display: 'flex',
    margin: 'auto',
    width: '32px',
    height: '32px'
  },

  extensionsOption: {
    display: 'flex',
    flex: '1',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '15px'
  },

  extensionsHeading: {
    color: '#444444',
    cursor: 'default',
    fontSize: '1.2em',
    marginBottom: '0.7em',
    userSelect: 'none'
  },

  extensionsTable: {
    width: '100%'
  },

  extensionsRow: {
    background: '#fff',
    height: '56px',

    ':nth-child(even)': {
      background: globalStyles.color.veryLightGray
    },
    ':hover': {
      background: globalStyles.color.lightGray
    }
  },

  extensionsColumn: {
    padding: '0 8px'
  },

  center: {
    textAlign: 'center'
  },

  moreInfo: {
    display: 'flex',
    flex: '1',
    alignItems: 'flex-end'
  },

  moreInfoLink: {
    cursor: 'pointer',
    color: globalStyles.color.braveOrange,
    textDecoration: 'none',

    ':hover': {
      textDecoration: 'underline'
    }
  }
})

module.exports = ExtensionsTab
