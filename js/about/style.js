/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')

// Stylesheets go here

class AboutStyle extends ImmutableComponent {
  render () {
    return <div>
      <h1 className='typography' data-l10n-id='typography' />
      <h1 data-l10n-id='h1' />
      <h2 data-l10n-id='h2' />
      <h3 data-l10n-id='h3' />
      <h4 data-l10n-id='h4' />
    </div>
  }
}

module.exports = <AboutStyle />
