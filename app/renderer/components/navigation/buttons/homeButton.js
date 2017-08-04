/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../immutableComponent')
const {NormalizedButton} = require('../../common/browserButton')

// Actions
const appActions = require('../../../../../js/actions/appActions')

// Constants
const settings = require('../../../../../js/constants/settings')

// Utils
const {getSetting} = require('../../../../../js/settings')
const eventUtil = require('../../../../../js/lib/eventUtil')

// Styles
const homeButtonIcon = require('../../../../../img/toolbar/home_btn.svg')

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

  // BEM Level: navigationBar__buttonContainer
  render () {
    return <NormalizedButton
      navigationButton
      custom={styles.homeButton}
      testId='homeButton'
      l10nId='homeButton'
      ref={(node) => { this.homeButton = node }}
      onClick={this.onHome}
    />
  }
}

const styles = StyleSheet.create({
  homeButton: {
    background: `url(${homeButtonIcon}) center no-repeat`,
    backgroundSize: '16px 16px'
  }
})

module.exports = HomeButton
