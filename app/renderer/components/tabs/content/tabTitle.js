/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')

// State helpers
const titleState = require('../../../../common/state/tabContentState/titleState')
const frameStateUtil = require('../../../../../js/state/frameStateUtil')
const tabUIState = require('../../../../common/state/tabUIState')
const tabState = require('../../../../common/state/tabState')

// Styles
const globalStyles = require('../../styles/global')

class TabTitle extends React.Component {
  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const tabId = ownProps.tabId
    const frameKey = frameStateUtil.getFrameKeyByTabId(currentWindow, tabId)

    const props = {}
    props.isPinned = tabState.isTabPinned(state, tabId)
    props.showTabTitle = titleState.showTabTitle(currentWindow, frameKey)
    props.displayTitle = titleState.getDisplayTitle(currentWindow, frameKey)
    props.addExtraGutter = tabUIState.addExtraGutterToTitle(currentWindow, frameKey)
    props.isDragging = tabState.isTabDragging(state, tabId)
    props.tabId = tabId

    return props
  }

  render () {
    if (this.props.isPinned || !this.props.showTabTitle) {
      return null
    }
    return <div
      data-test-id='tabTitle'
      data-text={this.props.displayTitle}
      className={css(
        styles.tab__title,
        this.props.addExtraGutter && styles.tab__title_extraGutter
      )}>
      {this.props.displayTitle}
    </div>
  }
}

module.exports = ReduxComponent.connect(TabTitle)

const styles = StyleSheet.create({

  tab__title: {
    boxSizing: 'border-box',
    display: 'flex',
    flex: 1,
    userSelect: 'none',
    fontSize: globalStyles.fontSize.tabTitle,
    fontWeight: 400,
    minWidth: 0, // see https://stackoverflow.com/a/36247448/4902448
    lineHeight: globalStyles.spacing.tabsToolbarHeight,
    width: '-webkit-fill-available',
    marginLeft: '6px',
    // Fade any overflow text out,
    // but use a technique which preserves:
    // 1. Sub-pixel colored antialized text - e.g. background-clip: text does not use this.
    //    (with color - zoom in 20x on mac and you'll see)
    // 2. Background and text color transition with no artifacts left over due to a
    //    pseudo element gradient fade which cannot transition (cannot transition linear gradient color)
    overflow: 'hidden',
    position: 'relative',
    color: 'transparent',
    // the text, rendered as normal, but cut off early
    '::before': {
      position: 'absolute',
      display: 'block',
      overflow: 'hidden',
      top: 0,
      left: 0,
      right: 'calc(18% - 1px)',
      bottom: 0,
      fontWeight: 'inherit',
      content: 'attr(data-text)',
      color: 'var(--tab-color)',
      transition: `color var(--tab-transit-duration) var(--tab-transit-easing)`
    },
    // the fade-out using background gradient clipped to text
    // and only starting off where actual text is cut off
    '::after': {
      position: 'absolute',
      display: 'block',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      fontWeight: 'inherit',
      content: 'attr(data-text)',
      // restrict background-size to a tiny portion of the text as background-clip: text means
      // no sub-pixel antializing
      background: `linear-gradient(
        to right,
        var(--tab-color) 0,
        transparent 100%
      ) right top / 18% 100% no-repeat`,
      WebkitBackgroundClip: 'text !important', // !important is neccessary because aphrodite will put this at top of ruleset :-(
      color: 'transparent',
      transition: `background 0s var(--tab-transit-easing) var(--tab-transit-duration)`
    }
  },

  tab__title_extraGutter: {
    margin: '0 2px'
  }
})
