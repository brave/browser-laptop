/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const messages = require('../constants/messages')
const Immutable = require('immutable')

class CertErrorPage extends React.Component {
  constructor () {
    super()
    this.state = {
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
  render () {
    return <div>
      <span data-l10n-id='certErrorText'></span>
      <span>{this.state.certDetails.get('url') || ''}</span>
      <div>{this.state.certDetails.get('error') || ''}</div>
    </div>
  }
}

module.exports = <CertErrorPage/>
