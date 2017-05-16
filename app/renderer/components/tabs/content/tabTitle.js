/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../immutableComponent')

// Utils
const {hasBreakpoint, getTabIconColor} = require('../../../lib/tabUtil')
const {isWindows, isDarwin} = require('../../../../common/lib/platformUtil')

// Styles
const globalStyles = require('../../styles/global')

class TabTitle extends ImmutableComponent {
  get isActiveOrHasSecondaryIcon () {
    return this.props.isActive ||
      (!!this.props.frame.get('isPrivate') || !!this.props.frame.get('partitionNumber'))
  }

  get isPinned () {
    return !!this.props.frame.get('pinnedLocation')
  }

  get shouldHideTitle () {
    return (hasBreakpoint(this.props, 'small') && this.props.isActive) ||
      hasBreakpoint(this.props, ['extraSmall', 'smallest'])
  }

  render () {
    // Brad said that tabs with white title on macOS look too thin
    const enforceFontVisibilty = isDarwin() && getTabIconColor(this.props) === 'white'
    const titleStyles = StyleSheet.create({
      gradientText: {
        backgroundImage: `-webkit-linear-gradient(left,
        ${getTabIconColor(this.props)} 90%, ${globalStyles.color.almostInvisible} 100%)`
      }
    })

    return !this.isPinned && !this.shouldHideTitle
      ? <div data-test-id='tabTitle'
        className={css(
          styles.tabTitle,
          titleStyles.gradientText,
          enforceFontVisibilty && styles.enforceFontVisibilty,
          // Windows specific style
          isWindows() && styles.tabTitleForWindows
        )}>
        {this.props.pageTitle}
      </div>
      : null
  }
}

module.exports = TabTitle

const styles = StyleSheet.create({
  tabTitle: {
    display: 'flex',
    flex: '1',
    userSelect: 'none',
    boxSizing: 'border-box',
    fontSize: globalStyles.fontSize.tabTitle,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    lineHeight: '1.6',
    padding: globalStyles.spacing.defaultTabPadding,
    color: 'transparent',
    WebkitBackgroundClip: 'text'
  },

  enforceFontVisibilty: {
    fontWeight: '600'
  },

  tabTitleForWindows: {
    fontWeight: '500',
    fontSize: globalStyles.fontSize.tabTitle
  }
})
