/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../immutableComponent')
const NavigationButton = require('./navigationButton')

// Actions
const appActions = require('../../../../../js/actions/appActions')

// Constants
const settings = require('../../../../../js/constants/settings')

// Utils
const {getSetting} = require('../../../../../js/settings')
const eventUtil = require('../../../../../js/lib/eventUtil')

class HomeButton extends ImmutableComponent {
  constructor (props) {
    super(props)
    this.onHome = this.onHome.bind(this)
  }

  componentDidMount () {
    this.homeButton.addEventListener('auxclick', this.onHome)
  }

  componentWillUnmount () {
    this.homeButton.removeEventListener('auxclick', this.onHome)
  }

  onHome (e) {
    if (e.button === 2) {
      return
    }

    getSetting(settings.HOMEPAGE).split('|')
      .forEach((homepage, i) => {
        if (i === 0 && !eventUtil.isForSecondaryAction(e)) {
          appActions.loadURLRequested(this.props.activeTabId, homepage)
        } else {
          appActions.createTabRequested({
            url: homepage,
            active: false
          })
        }
      })
  }

  render () {
    return <NavigationButton
      testId='homeButton'
      l10nId='homeButton'
      class='homeButton'
      navigationButtonRef={(node) => { this.homeButton = node }}
      onClick={this.onHome}
    >
      <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
        <g className={css(styles.homeButton__path)} fill='none' fillRule='evenodd' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.25'>
          <path d='M5.56137384 14.539316h4.63377659V8.45748421H5.56137384z' />
          <path d='M13.6362509 14.539316H2.12044718c-.4987102 0-.90329682-.4037178-.90329682-.9012696V5.8515641c0-.30525004.15436268-.58964808.41095806-.75588481l5.75775703-3.73279666c.30003703-.1940394.68464049-.1940394.98438791 0L14.1283 5.09567929c.2565954.16623673.4109581.45063477.4109581.75588481v7.7864823c0 .4975518-.4045867.9012696-.9030072.9012696z' />
        </g>
      </svg>
    </NavigationButton>
  }
}

const styles = StyleSheet.create({
  homeButton__path: {
    stroke: 'var(--icon-line-color)',
    fill: 'none'
  }
})

module.exports = HomeButton
