/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const urlResolve = require('url').resolve

class FullScreenWarning extends ImmutableComponent {
  render () {
    const l10nArgs = {
      host: urlResolve(this.props.location, '/')
    }
    return <div className='fullScreenModeWarning'
      data-l10n-id='fullScreenModeWarning'
      data-l10n-args={JSON.stringify(l10nArgs)} />
  }
}

module.exports = FullScreenWarning
