/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')
const { aboutUrls, isIntermediateAboutPage } = require('../lib/appUrlUtil')

class AboutAbout extends ImmutableComponent {
  render () {
    return <div>
      <h1 data-l10n-id='listOfAboutPages' />
      <ul>
      {
      aboutUrls.keySeq().sort().filter((aboutSourceUrl) => !isIntermediateAboutPage(aboutSourceUrl)).map((aboutSourceUrl) =>
        <li>
          <a href={aboutUrls.get(aboutSourceUrl)} target='_blank'>
            {aboutSourceUrl}
          </a>
        </li>)
      }
      </ul>
    </div>
  }
}

module.exports = <AboutAbout />
