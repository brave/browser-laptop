/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../../../../js/components/immutableComponent')
const TabIcon = require('./tabIcon')

// Utils
const {hasRelativeCloseIcon, hasFixedCloseIcon} = require('../../../lib/tabUtil')

// Styles
const globalStyles = require('../../styles/global')
const closeTabHoverSvg = require('../../../../extensions/brave/img/tabs/close_btn_hover.svg')
const closeTabSvg = require('../../../../extensions/brave/img/tabs/close_btn_normal.svg')

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

module.exports = CloseTabIcon

const styles = StyleSheet.create({
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
  }
})
