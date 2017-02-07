/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const Immutable = require('immutable')
const ImmutableComponent = require('../components/immutableComponent')
const messages = require('../constants/messages')
const aboutActions = require('./aboutActions')

const ipc = window.chrome.ipcRenderer

// Stylesheets
require('../../less/about/itemList.less')
require('../../less/about/extensions.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

const bravifyText = (text) => text.replace(/Google Chrome/g, 'Brave')
class ExtensionItem extends ImmutableComponent {
  constructor () {
    super()
    this.onContextMenu = this.onContextMenu.bind(this)
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
  render () {
    const icon = this.icon
    const permissions = this.props.extension.getIn(['manifest', 'permissions'])
    return <div role='listitem'
      disabled={!this.props.extension.get('enabled')}
      className='listItem'
      data-extension-id={this.props.extension.get('id')}
      onContextMenu={this.onContextMenu}
      data-context-menu-disable>
      <div className='extensionImage'>
        <img src={`${this.props.extension.get('base_path')}/${icon}`} />
      </div>
      <div className='extensionDetails'>
        <h3 className='extensionTitle'>{bravifyText(this.props.extension.get('name'))}</h3>
        <span className='extensionVersion'>{this.props.extension.get('version')}</span>
        {
          !['__MSG_extDescriptionGoogleChrome__', '__MSG_appDesc__'].includes(this.props.extension.get('description'))
          ? <div className='extensionDescription'>{bravifyText(this.props.extension.get('description'))}</div>
          : null
        }
        <div className='extensionPath'><span data-l10n-id='extensionPathLabel' /> <span>{this.props.extension.get('base_path')}</span></div>
        <div className='extensionID'><span data-l10n-id='extensionIdLabel' /> <span>{this.props.extension.get('id')}</span></div>
        {
          permissions
          ? <div className='extensionPermissions'><span data-l10n-id='extensionPermissionsLabel' /> <span>{permissions.join(', ')}</span></div>
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
  constructor () {
    super()
    this.state = {
      extensions: Immutable.List()
    }
    ipc.on(messages.EXTENSIONS_UPDATED, (e, detail) => {
      if (!detail) {
        return
      }
      const extensions = Object.keys(detail.extensions)
        // Exclude the Brave Extension becuase it looks strange in this list
        .filter((extensionID) => extensionID !== 'mnojpmjdmbbfmejpflffifhffcmidifd')
        // Sort enabled things first
        .map((extensionID) => detail.extensions[extensionID])
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
    return <div className='extensionDetailsPage'>
      <h2 data-l10n-id='extensions' />
      <div className='extensionDetailsPageContent'>
        <ExtensionList extensions={this.state.extensions} />
      </div>
    </div>
  }
}

module.exports = <AboutExtensions />
