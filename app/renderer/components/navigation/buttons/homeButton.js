/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// Components
const ImmutableComponent = require('../../immutableComponent')
const NavigationButton = require('./navigationButton')
const HomeIcon = require('../../../../../icons/home')

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
      <HomeIcon />
    </NavigationButton>
  }
}

module.exports = HomeButton
