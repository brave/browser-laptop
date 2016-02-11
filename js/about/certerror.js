/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const messages = require('../constants/messages')

class CertErrorPage extends React.Component {
  constructor () {
    super()
    this.state = {certDetails: {}}
    window.addEventListener(messages.CERT_DETAILS_UPDATED, (e) => {
      if (e.detail) {
        this.setState({
          certDetails: e.detail
        })
      }
    })
  }
  render () {
    return <div>
      <span data-l10n-id='certErrorText'></span>
      <span>{this.state.certDetails.url || ''}</span>
      <div>{this.state.certDetails.error || ''}</div>
    </div>
  }
}

module.exports = <CertErrorPage/>
