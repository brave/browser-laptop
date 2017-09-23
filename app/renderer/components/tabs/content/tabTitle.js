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

// Utils
const platformUtil = require('../../../../common/lib/platformUtil')
const isWindows = platformUtil.isWindows()
const isDarwin = platformUtil.isDarwin()

// Styles
const globalStyles = require('../../styles/global')

class TabTitle extends React.Component {
  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const tabId = ownProps.tabId
    const frameKey = frameStateUtil.getFrameKeyByTabId(currentWindow, tabId)

    const props = {}
    props.isWindows = isWindows
    props.isDarwin = isDarwin
    props.isPinned = frameStateUtil.isPinned(currentWindow, frameKey)
    props.showTabTitle = titleState.showTabTitle(currentWindow, frameKey)
    props.displayTitle = titleState.getDisplayTitle(currentWindow, frameKey)
    props.addExtraGutter = tabUIState.addExtraGutterToTitle(currentWindow, frameKey)
    props.isTextWhite = tabUIState.checkIfTextColor(currentWindow, frameKey, 'white')
    props.gradientColor = tabUIState.getTabEndIconBackgroundColor(currentWindow, frameKey)
    props.tabId = tabId

    return props
  }

  render () {
    if (this.props.isPinned || !this.props.showTabTitle) {
      return null
    }
    const perPageGradient = StyleSheet.create({
      tab__title_gradient: {
        '::after': {
          background: this.props.gradientColor
        }
      }
    })

    return <div data-test-id='tabTitle'
      className={css(
        styles.tab__title,
        !this.props.isPinned && perPageGradient.tab__title_gradient,
        this.props.addExtraGutter && styles.tab__title_extraGutter,
        (this.props.isDarwin && this.props.isTextWhite) && styles.tab__title_isDarwin,
        // Windows specific style
        this.props.isWindows && styles.tab__title_isWindows
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
    lineHeight: '1.6',
    minWidth: 0, // see https://stackoverflow.com/a/36247448/4902448
    marginLeft: '4px',
    overflow: 'hidden',

    // this enable us to have gradient text
    '::after': {
      zIndex: globalStyles.zindex.zindexTabs,
      content: '""',
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: '-webkit-fill-available',
      height: '-webkit-fill-available',
      // add a pixel margin so the box-shadow of the
      // webview is not covered by the gradient
      marginBottom: '1px'
    }
  },

  tab__title_isDarwin: {
    fontWeight: '400'
  },

  tab__title_isWindows: {
    fontWeight: '500',
    fontSize: globalStyles.fontSize.tabTitle
  },

  tab__title_extraGutter: {
    margin: '0 2px'
  }
})
