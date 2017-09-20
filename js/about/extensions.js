/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const Immutable = require('immutable')
const ImmutableComponent = require('../../app/renderer/components/immutableComponent')
const messages = require('../constants/messages')
const aboutActions = require('./aboutActions')
const appActions = require('../actions/appActions')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../../app/renderer/components/styles/global')
const commonStyles = require('../../app/renderer/components/styles/commonStyles')
const { bravifyText } = require('../../app/renderer/lib/extensionsUtil')

const ipc = window.chrome.ipcRenderer

// Stylesheets
require('../../less/about/common.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

class ExtensionItem extends ImmutableComponent {
  constructor () {
    super()
    this.onContextMenu = this.onContextMenu.bind(this)
    this.onInspect = this.onInspect.bind(this)
  }
  onContextMenu (e) {
    aboutActions.contextMenu(this.props.extension.toJS(), 'extensions', e)
  }
  get icon () {
    return this.props.extension.getIn(['manifest', 'icons', '128']) ||
      this.props.extension.getIn(['manifest', 'icons', '64']) ||
      this.props.extension.getIn(['manifest', 'icons', '48']) ||
      this.props.extension.getIn(['manifest', 'icons', '16']) ||
      null
  }
  get backgroundPage () {
    return this.props.extension.getIn(['manifest', 'background', 'page']) || '_generated_background_page.html'
  }
  onInspect () {
    const url = this.props.extension.get('url')
    const backgroundPage = this.backgroundPage
    chrome.tabs.query(
      {currentWindow: true, active: true},
      function (tabArray) {
        appActions.loadURLRequested(tabArray[0].id, url + backgroundPage)
      }
    )
  }

  render () {
    const className = css(
      commonStyles.listItem,
      styles.listItem,
      !this.props.extension.get('enabled') && styles.isDisabled
    )
    const icon = this.icon
    const permissions = this.props.extension.getIn(['manifest', 'permissions'])
    const hasBackground = this.props.extension.getIn(['manifest', 'background'])

    return <div role='listitem'
      disabled={!this.props.extension.get('enabled')}
      className={className}
      data-extension-id={this.props.extension.get('id')}
      onContextMenu={this.onContextMenu}
      data-context-menu-disable>
      <div className={css(styles.extensionImage)}>
        <img className={css(styles.img)} src={`${this.props.extension.get('base_path')}/${icon}`} />
      </div>
      <div data-test-id='extensionDetails'>
        <h3 className={css(styles.extensionTitle)}>{bravifyText(this.props.extension.get('name'))}</h3>
        <span className={css(styles.extensionVersion)}>{this.props.extension.get('version')}</span>
        {
          // SAMPSON: Revisit to see if we can remove this Array.prototype.includes call
          !['__MSG_extDescriptionGoogleChrome__', '__MSG_appDesc__'].includes(this.props.extension.get('description'))
          ? <div data-test-id='extensionDescription' data-l10n-id={bravifyText(this.props.extension.get('description'))} />
          : null
        }
        <div className='extensionPath'><span data-l10n-id='extensionPathLabel' /> <span>{this.props.extension.get('base_path')}</span></div>
        <div className='extensionID'><span data-l10n-id='extensionIdLabel' /> <span>{this.props.extension.get('id')}</span></div>
        {
          permissions
          ? <div className='extensionPermissions'><span data-l10n-id='extensionPermissionsLabel' /> <span>{permissions.join(', ')}</span></div>
          : null
        }
        {
          hasBackground && this.props.extension.get('enabled')
          ? <div className='extensionInspectViews'><span data-l10n-id='extensionInspectViewsLabel' /> <label className={css(commonStyles.linkText, commonStyles.linkText_small)} onClick={this.onInspect}>{this.backgroundPage}</label></div>
          : null
        }
      </div>
    </div>
  }
}

class ExtensionList extends ImmutableComponent {
  render () {
    return <list className='extensionDetailsList'>
      {
        this.props.extensions.map((entry) =>
          <ExtensionItem extension={entry} />)
      }
    </list>
  }
}

class AboutExtensions extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      extensions: Immutable.List()
    }
    ipc.on(messages.EXTENSIONS_UPDATED, (e, detail) => {
      if (!detail) {
        return
      }
      const extensions = Object.keys(detail)
        // Exclude the Brave Extension becuase it looks strange in this list
        .filter((extensionID) => extensionID !== 'mnojpmjdmbbfmejpflffifhffcmidifd')
        // Sort enabled things first
        .map((extensionID) => detail[extensionID])
        .sort((extension, extension2) => (extension2.enabled || false) - (extension.enabled || false))
      this.setState({
        extensions: Immutable.fromJS(extensions)
      })
    })
  }
  onChangeSelectedEntry (id) {
    this.setState({
      selectedEntry: id,
      search: ''
    })
  }
  onChangeSearch (evt) {
    this.setState({
      search: evt.target.value
    })
  }
  onClearSearchText (evt) {
    this.setState({
      search: ''
    })
  }
  render () {
    return <div className={css(styles.extensionDetailsPage)}>
      <h2 data-l10n-id='extensions' />
      <div data-test-id='extensionDetailsPageContent'>
        <ExtensionList extensions={this.state.extensions} />
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  extensionDetailsPage: {
    margin: '20px',
    minWidth: globalStyles.spacing.aboutPageDetailsPageWidth
  },

  extensionImage: {
    paddingRight: '10px'
  },

  extensionTitle: {
    display: 'inline-block',
    marginBottom: '5px'
  },

  extensionVersion: {
    color: '#999',
    fontSize: 'smaller',
    marginLeft: '20px'
  },

  listItem: {
    display: 'flex',
    userSelect: 'text'
  },

  isDisabled: {
    opacity: '0.3'
  },

  img: {
    width: '48px'
  }
})

module.exports = <AboutExtensions />
