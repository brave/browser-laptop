/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const BrowserButton = require('../../app/renderer/components/common/browserButton')

const {StyleSheet, css} = require('aphrodite/no-important')

const globalStyles = require('../../app/renderer/components/styles/global')
require('../../app/renderer/components/styles/globalSelectors')

class SafebrowsingPage extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      advanced: false
    }
  }

  onAdvancedToggle = () => {
    this.setState({advanced: !this.state.advanced})
  }

  render () {
    return <div className={css(styles.appContainer)}>
      <div className={css(styles.error__content)} data-test-id='errorContent'>
        <svg width='75' height='75' className={css(styles.error__logo)} viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
          <path className={css(styles.error__logo__inner)} d='M11.4743662,97.2253545 C1.98936285,97.2253571 -1.69987039,86.6466353 1.98936288,81.2764443 C2.36018089,80.2888073 37.5445854,9.4248374 37.6406733,9.21698534 C41.524789,0.483122973 56.8650161,0.0416071437 60.7924391,9.21698534 C60.7572519,9.19524917 98.2991929,81.8687547 97.9337883,81.2642177 C101.323931,86.2404407 96.9260512,97.2253571 88.8978453,97.2253545 C88.8978453,97.2253545 11.4756386,97.2879401 11.4743662,97.2253545 Z M50.5378687,73.3388569 C47.2443918,73.3388569 44.2703808,76.046195 44.2703808,79.5061732 C44.2703808,82.9729198 47.1388056,85.6802579 50.5378687,85.6802579 C53.9369317,85.6802579 56.8040029,82.9729198 56.8040029,79.5061732 C56.8053565,76.046195 53.8313455,73.3388569 50.5378687,73.3388569 Z M50.3063913,28.5 C46.5729719,28.5 42.719076,30.2990258 43.0805057,32.9143334 L45.8826007,65.934287 L54.7315355,65.934287 L57.5322768,32.9143334 C57.8937065,30.2990258 54.0398106,28.5 50.3063913,28.5 Z' />
        </svg>
        <div className={css(styles.safebrowsingErrorText__wrapper)}>
          <span data-l10n-id='safebrowsingErrorText' />
        </div>
        <section>
          {this.state.advanced
            ? <section>
              <div className={css(styles.buttons__wrapper)}>
                <BrowserButton subtleItem
                  l10nId='safebrowsingErrorHideAdvanced'
                  testId='safebrowsingErrorHideAdvanced'
                  onClick={this.onAdvancedToggle}
                />
              </div>
              <div className={css(styles.subtleText)}>
                <p data-l10n-id='safebrowsingErrorInfo' />
                <p className={css(styles.subtleText__p)} data-l10n-id='safebrowsingErrorBypass' />
              </div>
            </section>
            : <section className={css(styles.buttons__wrapper)}>
              <BrowserButton subtleItem
                l10nId='safebrowsingErrorAdvanced'
                testId='safebrowsingErrorAdvanced'
                onClick={this.onAdvancedToggle}
              />
            </section>
          }
        </section>
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  appContainer: {
    backgroundColor: 'red',
    overflow: 'auto'
  },

  error__content: {
    background: globalStyles.color.veryLightGray,
    display: 'flex',
    width: '60vw',
    maxWidth: '600px',
    margin: '20vh auto',
    lineHeight: '1.6em',
    flexDirection: 'column',
    padding: '40px',
    height: 'auto !important' // TODO: override #appcontainer > div
  },

  error__logo: {
    marginBottom: '2rem'
  },

  error__logo__inner: {
    fill: globalStyles.color.braveOrange
  },

  safebrowsingErrorText__wrapper: {
    marginBottom: '1rem'
  },

  buttons__wrapper: {
    display: 'flex',
    flexFlow: 'row wrap'
  },

  subtleText: {
    marginTop: '1rem'
  },

  subtleText__p: {
    marginTop: '1rem'
  }
})

module.exports = <SafebrowsingPage />
