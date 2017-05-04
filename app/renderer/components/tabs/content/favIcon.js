/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../immutableComponent')
const TabIcon = require('./tabIcon')

// Utils
const {hasBreakpoint, getTabIconColor} = require('../../../lib/tabUtil')

// Styles
const globalStyles = require('../../styles/global')
const tabStyles = require('../../styles/tab')
const {spinKeyframes} = require('../../styles/animations')
const loadingIconSvg = require('../../../../extensions/brave/img/tabs/loading.svg')

class Favicon extends ImmutableComponent {
  get favicon () {
    return !this.props.isLoading && this.props.frame.get('icon')
  }

  get defaultIcon () {
    return (!this.props.isLoading && !this.favicon)
      ? globalStyles.appIcons.defaultIcon
      : null
  }

  get narrowView () {
    return this.props.frame.get('breakpoint') === 'smallest'
  }

  get shouldHideFavicon () {
    return (hasBreakpoint(this.props, 'extraSmall') && this.props.isActive) ||
      this.props.frame.get('location') === 'about:newtab'
  }

  render () {
    const iconStyles = StyleSheet.create({
      favicon: {
        backgroundImage: `url(${this.favicon})`,
        filter: getTabIconColor(this.props) === 'white' ? globalStyles.filter.whiteShadow : 'none'
      },
      loadingIconColor: {
        // Don't change icon color unless when it should be white
        filter: getTabIconColor(this.props) === 'white' ? globalStyles.filter.makeWhite : 'none'
      }
    })

    return !this.shouldHideFavicon
      ? <TabIcon
        data-test-favicon={this.favicon}
        data-test-id={this.props.isLoading ? 'loading' : 'defaultIcon'}
        className={css(
          tabStyles.icon,
          this.favicon && iconStyles.favicon,
          !this.props.frame.get('pinnedLocation') && this.narrowView && styles.faviconNarrowView
        )}
        symbol={
          (this.props.isLoading && css(styles.loadingIcon, iconStyles.loadingIconColor)) ||
          this.defaultIcon
        } />
      : null
  }
}

module.exports = Favicon

const styles = StyleSheet.create({
  faviconNarrowView: {
    minWidth: 'auto',
    width: globalStyles.spacing.narrowIconSize,
    backgroundSize: 'contain',
    padding: '0',
    fontSize: '10px',
    backgroundPosition: 'center center'
  },

  loadingIcon: {
    backgroundImage: `url(${loadingIconSvg})`,
    animationName: spinKeyframes,
    animationTimingFunction: 'linear',
    animationDuration: '1200ms',
    animationIterationCount: 'infinite'
  }
})
