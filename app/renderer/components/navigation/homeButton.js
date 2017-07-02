/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// Components
const ImmutableComponent = require('../immutableComponent')

// Actions
const appActions = require('../../../../js/actions/appActions')

// Constants
const settings = require('../../../../js/constants/settings')

// Utils
const cx = require('../../../../js/lib/classSet')
const {getSetting} = require('../../../../js/settings')
const eventUtil = require('../../../../js/lib/eventUtil')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')

const homeButton = require('../../../../img/toolbar/home_btn.svg')

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
    return <button className={cx({
      normalizeButton: true,
      [css(styles.navigationButton, styles.navigationButton_home)]: true
    })}
      data-test-id='homeButton'
      data-l10n-id='homeButton'
      ref={(node) => { this.homeButton = node }}
      onClick={this.onHome}
    />
  }
}

const styles = StyleSheet.create({
  navigationButton: {
    // cf: https://github.com/brave/browser-laptop/blob/b161b37cf5e9f59be64855ebbc5d04816bfc537b/less/navigationBar.less#L550-L553
    backgroundColor: globalStyles.color.buttonColor,
    display: 'inline-block',
    width: '100%',
    height: '100%',

    // cf: https://github.com/brave/browser-laptop/blob/b161b37cf5e9f59be64855ebbc5d04816bfc537b/less/navigationBar.less#L584-L585
    margin: 0,
    padding: 0
  },

  navigationButton_home: {
    background: `url(${homeButton}) center no-repeat`,
    backgroundSize: `16px 16px`
  }
})

module.exports = HomeButton
