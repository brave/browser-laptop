/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')
const {aboutUrls, isNavigatableAboutPage} = require('../lib/appUrlUtil')

require('../../less/about/history.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

class AboutAbout extends ImmutableComponent {
  render () {
    return <div className='siteDetailsPage'>
      <div className='siteDetailsPageHeader'>
        <div data-l10n-id='aboutPages' className='sectionTitle' />
      </div>

      <div className='siteDetailsPageContent aboutAbout'>
        <div className='sectionTitle' data-l10n-id='listOfAboutPages' />
        <ul>
          {
            aboutUrls.keySeq().sort().filter((aboutSourceUrl) => isNavigatableAboutPage(aboutSourceUrl)).map((aboutSourceUrl) =>
              <li>
                <a href={aboutUrls.get(aboutSourceUrl)} target='_blank'>
                  {aboutSourceUrl}
                </a>
              </li>)
          }
        </ul>
      </div>
    </div>
  }
}

module.exports = <AboutAbout />
