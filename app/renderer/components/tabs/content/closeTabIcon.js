/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')

// State helpers
const tabState = require('../../../../common/state/tabState')
const tabUIState = require('../../../../common/state/tabUIState')
const closeState = require('../../../../common/state/tabContentState/closeState')
const frameStateUtil = require('../../../../../js/state/frameStateUtil')

// Styles
const globalStyles = require('../../styles/global')
const {theme} = require('../../styles/theme')

class CloseTabIcon extends React.Component {
  constructor (props) {
    super(props)
    this.onDragStart = this.onDragStart.bind(this)
    this.setRef = this.setRef.bind(this)
  }

  onDragStart (event) {
    event.preventDefault()
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const tabId = ownProps.tabId
    const frameKey = frameStateUtil.getFrameKeyByTabId(currentWindow, tabId)
    const isPinned = tabState.isTabPinned(state, tabId)

    const props = {}
    props.isPinned = isPinned
    props.onClick = ownProps.onClick
    props.isDragging = tabState.isTabDragging(state, tabId)
    props.hasFrame = frameStateUtil.hasFrame(currentWindow, frameKey)
    props.centralizeTabIcons = tabUIState.centralizeTabIcons(currentWindow, frameKey, isPinned)
    props.showCloseIcon = closeState.showCloseTabIcon(currentWindow, frameKey)
    return props
  }

  setRef (ref) {
    this.element = ReactDOM.findDOMNode(ref)
  }

  render () {
    if (this.props.isPinned || this.props.isDragging || !this.props.showCloseIcon) {
      return null
    }

    return <div
      data-test-id='closeTabIcon'
      data-test2-id={this.props.showCloseIcon ? 'close-icon-on' : 'close-icon-off'}
      className={css(
        styles.closeIcon,
        this.props.centralizeTabIcons && styles.closeIcon_centered
      )}
      data-l10n-id='closeTabButton'
      onClick={this.props.onClick}
      onDragStart={this.onDragStart}
      draggable='true'
      ref={this.setRef}
    >
      <svg className={css(styles.closeIcon__graphic)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'>
        <path className={css(styles.closeIcon__line)} fill='none' stroke='#000' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.29' d='M11.5 4.5l-7 7m7 0l-7-7' />
      </svg>
    </div>
  }
}

const styles = StyleSheet.create({
  closeIcon: {
    '--close-line-color': 'var(--tab-color)',
    boxSizing: 'border-box',
    alignSelf: 'center',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.tab.closeButton.borderRadius,
    background: theme.tab.closeButton.background,
    marginRight: `calc(${globalStyles.spacing.defaultTabMargin} - 2px)`,
    width: globalStyles.spacing.closeIconSize,
    height: globalStyles.spacing.closeIconSize,
    zIndex: globalStyles.zindex.zindexTabsThumbnail,
    ':hover': {
      '--close-line-color': theme.tab.closeButton.hover.color,
      background: theme.tab.closeButton.hover.background,
      '--close-transit-duration': theme.tab.transitionDurationIn,
      '--close-transit-timing': theme.tab.transitionEasingIn
    },
    ':active': {
      background: theme.tab.closeButton.active.background
    }
  },

  closeIcon__graphic: {
    flex: 1
  },

  closeIcon__line: {
    stroke: 'var(--close-line-color)'
  },

  closeIcon_centered: {
    position: 'absolute',
    left: `calc(50% - (${globalStyles.spacing.closeIconSize} / 2))`,
    right: 0,
    top: `calc(50% - (${globalStyles.spacing.closeIconSize} / 2))`,
    bottom: 0,
    margin: 0
  }
})

module.exports = ReduxComponent.connect(CloseTabIcon)
