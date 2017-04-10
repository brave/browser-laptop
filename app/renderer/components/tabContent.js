/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('./styles/global')
const {isWindows} = require('../../common/lib/platformUtil')
const {tabs} = require('../../../js/constants/config')
const {hasBreakpoint, hasRelativeCloseIcon,
      hasFixedCloseIcon, hasVisibleSecondaryIcon, getTabIconColor} = require('../lib/tabUtil')
const {spinKeyframes} = require('./styles/animations')

const loadingIconSvg = require('../../extensions/brave/img/tabs/loading.svg')
const newSessionSvg = require('../../extensions/brave/img/tabs/new_session.svg')
const privateSvg = require('../../extensions/brave/img/tabs/private.svg')
const closeTabSvg = require('../../extensions/brave/img/tabs/close_btn_normal.svg')
const closeTabHoverSvg = require('../../extensions/brave/img/tabs/close_btn_hover.svg')

/**
 * Boilerplate component for all tab icons
 */
class TabIcon extends ImmutableComponent {
  render () {
    const tabIconStyle = {
      // Currently it's not possible to concatenate Aphrodite generated classes
      // and pre-built classes using default Aphrodite API, so we keep with inline-style
      fontSize: this.props.symbolContent ? '8px' : 'inherit',
      display: 'flex',
      alignSelf: 'center',
      width: globalStyles.spacing.iconSize,
      height: globalStyles.spacing.iconSize,
      alignItems: 'center',
      justifyContent: this.props.symbolContent ? 'flex-end' : 'left',
      fontWeight: this.props.symbolContent ? 'bold' : 'normal',
      color: this.props.symbolContent ? globalStyles.color.black100 : 'inherit'
    }
    return <div
      className={this.props.className}
      data-test-favicon={this.props['data-test-favicon']}
      onClick={this.props.onClick}>
      {
      this.props.symbol
        ? <span
          className={this.props.symbol}
          data-test-id={this.props['data-test-id']}
          data-l10n-id={this.props.l10nId}
          data-l10n-args={JSON.stringify(this.props.l10nArgs || {})}
          style={tabIconStyle}>{this.props.symbolContent}</span>
        : null
      }
    </div>
  }
}

class Favicon extends ImmutableComponent {
  get favicon () {
    return !this.props.isLoading && this.props.tab.get('icon')
  }

  get defaultIcon () {
    return (!this.props.isLoading && !this.favicon)
      ? globalStyles.appIcons.defaultIcon
      : null
  }

  get narrowView () {
    return this.props.tab.get('breakpoint') === 'smallest'
  }

  get shouldHideFavicon () {
    return (hasBreakpoint(this.props, 'extraSmall') && this.props.isActive) ||
    this.props.tab.get('location') === 'about:newtab'
  }

  render () {
    const iconStyles = StyleSheet.create({
      favicon: {backgroundImage: `url(${this.favicon})`},
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
          styles.icon,
          this.favicon && iconStyles.favicon,
          !this.props.tab.get('pinnedLocation') && this.narrowView && styles.faviconNarrowView
        )}
        symbol={
          (this.props.isLoading && css(styles.loadingIcon, iconStyles.loadingIconColor)) ||
          this.defaultIcon
        } />
      : null
  }
}

class AudioTabIcon extends ImmutableComponent {
  get pageCanPlayAudio () {
    return this.props.tab.get('audioPlaybackActive') || this.props.tab.get('audioMuted')
  }

  get mediumView () {
    const sizes = ['large', 'largeMedium']
    return sizes.includes(this.props.tab.get('breakpoint'))
  }

  get narrowView () {
    const sizes = ['medium', 'mediumSmall', 'small', 'extraSmall', 'smallest']
    return sizes.includes(this.props.tab.get('breakpoint'))
  }

  get locationHasSecondaryIcon () {
    return !!this.props.tab.get('isPrivate') || !!this.props.tab.get('partitionNumber')
  }

  get mutedState () {
    return this.pageCanPlayAudio && this.props.tab.get('audioMuted')
  }

  get audioIcon () {
    return !this.mutedState
      ? globalStyles.appIcons.volumeOn
      : globalStyles.appIcons.volumeOff
  }

  render () {
    return this.pageCanPlayAudio && !this.mediumView && !this.narrowView
      ? <TabIcon className={css(styles.icon, styles.audioIcon)} symbol={this.audioIcon} onClick={this.props.onClick} />
      : null
  }
}

class PrivateIcon extends ImmutableComponent {
  render () {
    const privateStyles = StyleSheet.create({
      icon: {
        WebkitMaskImage: `url(${privateSvg})`,
        backgroundColor: this.props.isActive ? globalStyles.color.white100 : globalStyles.color.black100
      }
    })
    return this.props.tab.get('isPrivate') && hasVisibleSecondaryIcon(this.props)
      ? <TabIcon data-test-id='privateIcon'
        className={css(styles.icon, styles.secondaryIcon, privateStyles.icon)} />
      : null
  }
}

class NewSessionIcon extends ImmutableComponent {
  get partitionNumber () {
    let partition = this.props.tab.get('partitionNumber')
    // Persistent partitions opened by `target="_blank"` will have
    // *partition-* string first, which causes bad UI. We don't need it for tabs
    if (typeof partition === 'string') {
      partition = partition.replace(/^partition-/i, '')
    }
    return partition
  }

  get partitionIndicator () {
    // For now due to UI limitations set session up to 9 visually
    return this.partitionNumber > tabs.maxAllowedNewSessions
      ? tabs.maxAllowedNewSessions
      : this.partitionNumber
  }

  get iconColor () {
    return getTabIconColor(this.props)
  }

  render () {
    const newSession = StyleSheet.create({
      indicator: {
        // Based on getTextColorForBackground() icons can be only black or white.
        filter: this.props.isActive && this.iconColor === 'white' ? 'invert(100%)' : 'none'
      }
    })

    return this.partitionNumber && hasVisibleSecondaryIcon(this.props)
      ? <TabIcon symbol
        data-test-id='newSessionIcon'
        className={css(styles.icon, styles.newSession, newSession.indicator)}
        symbolContent={this.partitionIndicator}
        {...this.props} />
      : null
  }
}

class TabTitle extends ImmutableComponent {
  get locationHasSecondaryIcon () {
    return !!this.props.tab.get('isPrivate') || !!this.props.tab.get('partitionNumber')
  }

  get isPinned () {
    return !!this.props.tab.get('pinnedLocation')
  }

  get shouldHideTitle () {
    return (this.props.tab.get('breakpoint') === 'mediumSmall' && this.locationHasSecondaryIcon) ||
      (hasBreakpoint(this.props, 'mediumSmall') && this.props.tab.get('hoverState')) ||
      hasBreakpoint(this.props, ['extraSmall', 'smallest']) ||
      hasFixedCloseIcon(this.props)
  }

  render () {
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
      // Windows specific style
      isWindows() && styles.tabTitleForWindows
    )}>
      {this.props.pageTitle}
    </div>
    : null
  }
}

class CloseTabIcon extends ImmutableComponent {
  get isPinned () {
    return !!this.props.tab.get('pinnedLocation')
  }

  render () {
    return !this.isPinned &&
     (hasRelativeCloseIcon(this.props) || hasFixedCloseIcon(this.props))
      ? <TabIcon
        data-test-id='closeTabIcon'
        className={css(styles.closeTab)}
        {...this.props} />
      : null
  }
}

const styles = StyleSheet.create({
  icon: {
    width: globalStyles.spacing.iconSize,
    minWidth: globalStyles.spacing.iconSize,
    height: globalStyles.spacing.iconSize,
    backgroundSize: globalStyles.spacing.iconSize,
    fontSize: globalStyles.fontSize.tabIcon,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    alignSelf: 'center',
    position: 'relative',
    textAlign: 'center',
    justifyContent: 'center',
    paddingLeft: globalStyles.spacing.defaultIconPadding,
    paddingRight: globalStyles.spacing.defaultIconPadding
  },

  iconNarrowView: {
    padding: 0
  },

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
  },

  audioIcon: {
    color: globalStyles.color.highlightBlue,
    fontSize: '16px'
  },

  secondaryIcon: {
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center'
  },

  newSession: {
    position: 'relative',
    backgroundImage: `url(${newSessionSvg})`,
    backgroundPosition: 'left'
  },

  closeTab: {
    position: 'relative',
    paddingLeft: globalStyles.spacing.defaultIconPadding,
    paddingRight: globalStyles.spacing.defaultIconPadding,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: globalStyles.spacing.closeIconSize,
    width: globalStyles.spacing.closeIconSize,
    height: globalStyles.spacing.closeIconSize,
    border: '0',
    zIndex: globalStyles.zindex.zindexTabs,
    backgroundImage: `url(${closeTabSvg})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: globalStyles.spacing.closeIconSize,
    backgroundPosition: 'center center',

    ':hover': {
      backgroundImage: `url(${closeTabHoverSvg})`
    }
  },

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

  tabTitleForWindows: {
    fontWeight: '500',
    fontSize: globalStyles.fontSize.tabTitle
  }
})

module.exports = {
  Favicon,
  AudioTabIcon,
  NewSessionIcon,
  PrivateIcon,
  TabTitle,
  CloseTabIcon
}
