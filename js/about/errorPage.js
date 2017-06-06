/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const BrowserButton = require('../../app/renderer/components/common/browserButton')

require('../../less/button.less')
require('../../less/window.less')
require('../../less/about/error.less')
const {isSourceAboutUrl, getTargetAboutUrl} = require('../lib/appUrlUtil')

class ErrorPage extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  loadUrl (url) {
    if (isSourceAboutUrl(url)) {
      url = getTargetAboutUrl(url)
    }
    window.location = url
  }

  reloadPrevious () {
    this.loadUrl(this.state.previousLocation)
  }

  reload () {
    this.loadUrl(this.state.url)
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
        {this.showBackButton ? <BrowserButton actionItem l10nId='back' onClick={this.reloadPrevious.bind(this)} /> : null}
        {this.state.url ? <BrowserButton actionItem l10nId='errorReload' l10nArgs={{url: this.state.url}} onClick={this.reload.bind(this)} /> : null}
      </div>
    </div>
  }
}

module.exports = <ErrorPage />
