/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {BrowserButton} = require('../../app/renderer/components/common/browserButton')

const appActions = require('../../js/actions/appActions')
const tabActions = require('../../app/common/actions/tabActions')

require('../../less/button.less')
require('../../less/window.less')
require('../../less/about/error.less')

class ErrorPage extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  goBack () {
    appActions.onGoBack()
  }

  reload () {
    tabActions.reload(null, true)
  }

  get showBackButton () {
    return this.state.previousLocation && this.state.previousLocation !== this.state.url
  }

  render () {
    return <div className='errorContent'>
      <div className='errorTitle'>
        <span className='errorText' data-l10n-id={this.state.title} />
        <span className='errorUrl'>{this.state.url}</span>
        <span className='errorText' data-l10n-id={this.state.message} />
      </div>
      <div className='buttons'>
        {this.showBackButton ? <BrowserButton actionItem l10nId='back' onClick={this.goBack} /> : null}
        {this.state.url ? <BrowserButton actionItem groupedItem l10nId='errorReload' l10nArgs={{url: this.state.url}} onClick={this.reload} /> : null}
      </div>
    </div>
  }
}

module.exports = <ErrorPage />
