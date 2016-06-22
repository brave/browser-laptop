/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Button = require('../components/button')
const aboutActions = require('./aboutActions')
const WindowConstants = require('../constants/windowConstants')

require('../../less/button.less')
require('../../less/window.less')
require('../../less/about/error.less')

class ErrorPage extends React.Component {
  constructor () {
    super()
    this.state = {}
  }

  reloadPrevious () {
    aboutActions.dispatchAction({
      actionType: WindowConstants.WINDOW_SET_URL,
      location: this.state.previousLocation,
      key: this.state.frameKey
    })
  }

  reload () {
    aboutActions.dispatchAction({
      actionType: WindowConstants.WINDOW_SET_URL,
      location: this.state.url,
      key: this.state.frameKey
    })
  }

  get showBackButton () {
    return this.state.previousLocation && this.state.previousLocation !== this.state.url
  }

  render () {
    return <div className='errorContent'>
      <div className='errorTitle'>
        <span className='errorText' data-l10n-id={this.state.title}></span>
        <span className='errorUrl'>{this.state.url}</span>
        <span className='errorText' data-l10n-id={this.state.message}></span>
      </div>
      <div className='buttons'>
        {this.showBackButton ? <Button l10nId='back' className='actionButton' onClick={this.reloadPrevious.bind(this)} /> : null}
        {this.state.url ? <Button l10nId='errorReload' l10nArgs={{url: this.state.url}} className='actionButton' onClick={this.reload.bind(this)} /> : null}
      </div>
    </div>
  }
}

module.exports = <ErrorPage />
