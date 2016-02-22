/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const messages = require('../constants/messages')
const Immutable = require('immutable')
const Button = require('../components/button')
const aboutActions = require('./aboutActions')

require('../../less/button.less')

class CertErrorPage extends React.Component {
  constructor () {
    super()
    this.state = {
      advanced: false,
      certDetails: window.initCertDetails ? Immutable.fromJS(window.initCertDetails) : Immutable.Map()
    }
    window.addEventListener(messages.CERT_DETAILS_UPDATED, (e) => {
      if (e.detail) {
        this.setState({
          certDetails: Immutable.fromJS(e.detail)
        })
      }
    })
  }

  onAccept () {
    aboutActions.acceptCertError(this.state.certDetails.get('url'))
  }

  onSafety () {
    window.location.href = 'about:newtab'
  }

  onAdvanced () {
    this.setState({advanced: true})
  }

  render () {
    return <div>
      <span data-l10n-id='certErrorText'></span>
      <span>{this.state.certDetails.get('url') || ''}</span>
      <div style={{color: 'red'}}>{this.state.certDetails.get('error') || ''}</div>
      <Button l10nId='certErrorSafety' className='wideButton' onClick={this.onSafety.bind(this)}/>
      <div>
      {this.state.advanced
        ? <Button l10nId='certErrorButtonText' className='subtleButton' onClick={this.onAccept.bind(this)}/>
        : <Button l10nId='certErrorAdvanced' className='subtleButton' onClick={this.onAdvanced.bind(this)}/>}
      </div>
    </div>
  }
}

module.exports = <CertErrorPage/>
