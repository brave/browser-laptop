/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../app/renderer/components/immutableComponent')
const {aboutUrls, isNavigatableAboutPage} = require('../lib/appUrlUtil')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../../app/renderer/components/styles/global')
require('../../app/renderer/components/styles/globalSelectors')
const commonStyles = require('../../app/renderer/components/styles/commonStyles')

const {
  AboutPageSectionTitle,
  AboutPageSectionSubTitle
} = require('../../app/renderer/components/common/sectionTitle')

require('../../node_modules/font-awesome/css/font-awesome.css')

class AboutAbout extends ImmutableComponent {
  render () {
    return <div className={css(styles.site__details__page)}>
      <div className={css(styles.site__details__page__header)}>
        <AboutPageSectionTitle data-l10n-id='aboutPages' />
      </div>

      <div className={css(commonStyles.siteDetailsPageContent, styles.site__details__page__content)}>
        <AboutPageSectionSubTitle data-l10n-id='listOfAboutPages' />
        <ul className={css(styles.list)}>
          {
            aboutUrls.keySeq().sort().filter((aboutSourceUrl) => isNavigatableAboutPage(aboutSourceUrl)).map((aboutSourceUrl) =>
              <li>
                <a href={aboutUrls.get(aboutSourceUrl)} rel='noopener' target='_blank'>
                  {aboutSourceUrl}
                </a>
              </li>)
          }
        </ul>
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  site__details__page: {
    minWidth: '704px',
    margin: 0,
    paddingTop: '24px'
  },

  site__details__page__header: {
    padding: `0 ${globalStyles.spacing.aboutPageSectionPadding}`
  },

  site__details__page__content: {
    borderTop: '0px',
    marginTop: '24px',
    display: 'block',
    clear: 'both'
  },

  list: {
    marginLeft: globalStyles.spacing.aboutPageSectionPadding
  }
})

module.exports = <AboutAbout />
