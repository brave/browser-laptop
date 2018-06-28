/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')
const aphroditeInject = require('aphrodite/lib/inject')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')
const Favicon = require('./content/favIcon')
const AudioTabIcon = require('./content/audioTabIcon')
const NewSessionIcon = require('./content/newSessionIcon')
const PrivateIcon = require('./content/privateIcon')
const TorIcon = require('./content/torIcon')
const TabTitle = require('./content/tabTitle')
const CloseTabIcon = require('./content/closeTabIcon')
const {NotificationBarCaret} = require('../main/notificationBar')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Store
const windowStore = require('../../../../js/stores/windowStore')

// State helpers
const privateState = require('../../../common/state/tabContentState/privateState')
const audioState = require('../../../common/state/tabContentState/audioState')
const tabUIState = require('../../../common/state/tabUIState')
const tabState = require('../../../common/state/tabState')
const titleState = require('../../../common/state/tabContentState/titleState')

// Constants
const settings = require('../../../../js/constants/settings')
const dragTypes = require('../../../../js/constants/dragTypes')

// Styles
const globalStyles = require('../styles/global')
const {theme} = require('../styles/theme')

// Utils
const {backgroundRequiresLightText} = require('../../../../js/lib/color')
const {isIntermediateAboutPage} = require('../../../../js/lib/appUrlUtil')
const contextMenus = require('../../../../js/contextMenus')
const dnd = require('../../../../js/dnd')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const {hasTabAsRelatedTarget} = require('../../lib/tabUtil')
const {getCurrentWindowId} = require('../../currentWindow')
const {setObserver} = require('../../lib/observerUtil')
const UrlUtil = require('../../../../js/lib/urlutil')
const {getSetting} = require('../../../../js/settings')

class Tab extends React.Component {
  constructor (props) {
    super(props)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onMouseEnter = this.onMouseEnter.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
    this.onDrag = this.onDrag.bind(this)
    this.onDragStart = this.onDragStart.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
    this.onDragOver = this.onDragOver.bind(this)
    this.onClickTab = this.onClickTab.bind(this)
    this.onObserve = this.onObserve.bind(this)
    this.onTabClosedWithMouse = this.onTabClosedWithMouse.bind(this)
    this.tabNode = null
    this.mouseTimeout = null
  }

  get frame () {
    return windowStore.getFrame(this.props.frameKey)
  }

  get draggingOverData () {
    const draggingOverData = this.props.dragData && this.props.dragData.get('dragOverData')
    if (!draggingOverData ||
        draggingOverData.get('draggingOverKey') !== this.props.tabId ||
        draggingOverData.get('draggingOverWindowId') !== getCurrentWindowId()) {
      return
    }

    const sourceDragData = dnd.getInterBraveDragData()
    if (!sourceDragData) {
      return
    }
    const location = sourceDragData.get('location')
    const tabId = draggingOverData.get('draggingOverKey')
    const draggingOverFrame = windowStore.getFrameByTabId(tabId)
    if ((location === 'about:blank' || location === 'about:newtab' || isIntermediateAboutPage(location)) &&
        (draggingOverFrame && draggingOverFrame.get('pinnedLocation'))) {
      return
    }

    return draggingOverData
  }

  get isDragging () {
    const sourceDragData = dnd.getInterBraveDragData()
    return sourceDragData &&
      sourceDragData.get('tabId') === this.props.tabId &&
      sourceDragData.get('draggingOverWindowId') === getCurrentWindowId()
  }

  get isDraggingOverSelf () {
    const draggingOverData = this.props.dragData && this.props.dragData.get('dragOverData')
    const sourceDragData = dnd.getInterBraveDragData()
    if (!draggingOverData || !sourceDragData) {
      return false
    }
    return draggingOverData.get('draggingOverKey') === sourceDragData.get('tabId')
  }

  get isDraggingOverLeft () {
    if (!this.draggingOverData) {
      return false
    }
    return this.draggingOverData.get('draggingOverLeftHalf')
  }

  get isDraggingOverRight () {
    if (!this.draggingOverData) {
      return false
    }
    return this.draggingOverData.get('draggingOverRightHalf')
  }

  onDragStart (e) {
    if (this.frame) {
      // showing up the sentinel while dragging leads to show the shadow
      // of the next tab. See 10691#issuecomment-329854096
      // this is added back to original size when onDrag event is happening
      this.tabSentinel.style.width = 0

      dnd.onDragStart(dragTypes.TAB, this.frame, e)
      // cancel tab preview while dragging. see #10103
      windowActions.setTabHoverState(this.props.frameKey, false, false)
    }
  }

  onDrag () {
    // re-enable the tabSentinel while dragging
    this.tabSentinel.style.width = globalStyles.spacing.sentinelSize
  }

  onDragEnd (e) {
    if (this.frame) {
      dnd.onDragEnd(dragTypes.TAB, this.frame, e)
    }
  }

  onDragOver (e) {
    dnd.onDragOver(dragTypes.TAB, this.tabNode.getBoundingClientRect(), this.props.tabId, this.draggingOverData, e)
  }

  onMouseLeave (e) {
    // mouseleave will keep the previewMode
    // as long as the related target is another tab
    clearTimeout(this.mouseTimeout)
    windowActions.setTabHoverState(this.props.frameKey, false, hasTabAsRelatedTarget(e))
  }

  onMouseEnter (e) {
    // if mouse entered a tab we only trigger a new preview
    // if user is in previewMode, which is defined by mouse move
    clearTimeout(this.mouseTimeout)
    windowActions.setTabHoverState(this.props.frameKey, true, this.props.previewMode)
    // In case there's a tab preview happening, cancel the preview
    // when mouse is over a tab
    windowActions.setTabPageHoverState(this.props.tabPageIndex, false)
    // cache offset position for hover radial grandient
    if (this.tabNode) {
      const tabBounds = this.tabNode.getBoundingClientRect()
      this.tabOffsetLeft = tabBounds.left
    }
  }

  onMouseMove (e) {
    // dispatch a message to the store so it can delay
    // and preview the tab based on mouse idle time
    clearTimeout(this.mouseTimeout)
    this.mouseTimeout = setTimeout(
      () => {
        windowActions.setTabHoverState(this.props.frameKey, true, true)
      },
      getSetting(settings.TAB_PREVIEW_TIMING))
    // fancy radial gradient mouse tracker
    if (this.elementRef && !this.props.isActive) {
      // only update position once per render frame
      if (!this.nextFrameSetTabMouseX) {
        var x = e.pageX - this.tabOffsetLeft
        this.nextFrameSetTabMouseX = window.requestAnimationFrame(() => {
          this.nextFrameSetTabMouseX = null
          this.elementRef.style.setProperty('--tab-mouse-x', `${x}px`)
        })
      }
    }
  }

  onAuxClick (e) {
    this.onClickTab(e)
  }

  onTabClosedWithMouse (event) {
    event.stopPropagation()
    const frame = this.frame

    if (frame && !frame.isEmpty()) {
      // do not mimic tab size if closed tab is a pinned tab or last tab
      if (!this.props.isPinnedTab) {
        const tabWidth = this.fixTabWidth
        windowActions.onTabClosedWithMouse({
          fixTabWidth: this.props.isLastTabOfPage ? null : tabWidth
        })
      }
      appActions.tabCloseRequested(this.props.tabId)
    }
  }

  onClickTab (e) {
    switch (e.button) {
      case 2:
        // Ignore right click
        return
      case 1:
        // Close tab with middle click
        this.onTabClosedWithMouse(e)
        break
      default:
        e.stopPropagation()
        appActions.tabActivateRequested(this.props.tabId)
    }
  }

  componentDidMount () {
    // Workaround the fact that aphrodite will not inject style rules until some time
    // after css([rules]) is called.
    // This causes CSS transitions to fire on the changes from the default values to the
    // specified initial values, which definitely should not happen.
    // Ensuring styles are written to DOM before this element is rendered
    // means the element will not be rendered first with 0 rules.
    // See https://codepen.io/petemill/pen/rdeqqv for a reproduction.
    aphroditeInject.flushToStyleTag()
    // unobserve tabs that we don't need. This will
    // likely be made by onObserve method but added again as
    // just to double-check
    if (this.props.isPinned) {
      this.observer && this.observer.unobserve(this.tabSentinel)
    }
    const threshold = Object.values(globalStyles.intersection)
    // At this moment Chrome can't handle unitless zeroes for rootMargin
    // see https://github.com/w3c/IntersectionObserver/issues/244
    const margin = '0px'
    this.observer = setObserver(this.tabSentinel, threshold, margin, this.onObserve)
    this.observer.observe(this.tabSentinel)

    this.tabNode.addEventListener('auxclick', this.onAuxClick.bind(this))
  }

  componentWillUnmount () {
    this.observer.unobserve(this.tabSentinel)
    clearTimeout(this.mouseTimeout)
  }

  onObserve (entries) {
    if (this.props.isPinnedTab) {
      return
    }
    // we only have one entry
    const entry = entries[0]
    windowActions.setTabIntersectionState(this.props.frameKey, entry.intersectionRatio)
  }

  get fixTabWidth () {
    if (!this.tabNode) {
      return 0
    }

    const rect = this.elementRef.getBoundingClientRect()
    return rect && rect.width
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const frame = frameStateUtil.getFrameByKey(currentWindow, ownProps.frameKey) || Immutable.Map()
    const frameKey = ownProps.frameKey
    const previewFrameKey = frameStateUtil.getPreviewFrameKey(currentWindow)
    const tabId = frame.get('tabId', tabState.TAB_ID_NONE)
    const isPinned = tabState.isTabPinned(state, tabId)
    const partOfFullPageSet = ownProps.partOfFullPageSet

    // TODO: this should have its own method
    const notifications = state.get('notifications')
    const notificationOrigins = notifications ? notifications.map(bar => bar.get('frameOrigin')) : false
    const notificationBarActive = frame.get('location') && notificationOrigins &&
      notificationOrigins.includes(UrlUtil.getUrlOrigin(frame.get('location')))

    const props = {}
    // TODO: this should have its own method
    props.notificationBarActive = notificationBarActive
    props.frameKey = frameKey
    props.isLastTabOfPage = ownProps.isLastTabOfPage
    props.isPinnedTab = isPinned
    props.isPrivateTab = privateState.isPrivateTab(currentWindow, frameKey)
    props.isActive = !!frameStateUtil.isFrameKeyActive(currentWindow, frameKey)
    props.isPreview = frameKey === previewFrameKey /* || frameKey === 2 */ // <-- uncomment to force 1 preview tab for style inspection
    props.anyTabIsPreview = previewFrameKey != null
    props.tabWidth = isPinned ? null : currentWindow.getIn(['ui', 'tabs', 'fixTabWidth'])
    props.themeColor = tabUIState.getThemeColor(currentWindow, frameKey)
    props.title = titleState.getDisplayTitle(currentWindow, frameKey)
    props.tabPageIndex = frameStateUtil.getTabPageIndex(currentWindow)
    props.partOfFullPageSet = partOfFullPageSet
    props.showAudioTopBorder = audioState.showAudioTopBorder(currentWindow, frameKey, isPinned)
    props.centralizeTabIcons = tabUIState.centralizeTabIcons(currentWindow, frameKey, isPinned)
    props.guestInstanceId = frame.get('guestInstanceId')
    // required only so that context menu shows correct state (mute vs unmute)
    props.isAudioMuted = audioState.isAudioMuted(currentWindow, frameKey)
    props.isAudio = audioState.canPlayAudio(currentWindow, frameKey)
    props.visualTabIdDebug = getSetting(settings.DEBUG_VERBOSE_TAB_INFO)
    if (props.visualTabIdDebug) {
      const tab = tabState.getByTabId(state, tabId)
      props.tabIndex = tab && tab.get('index')
      props.frameStateInternalIndex = frameStateUtil.getIndexByTabId(currentWindow, tabId)
    }

    // used in other functions
    props.dragData = state.getIn(['dragData', 'type']) === dragTypes.TAB && state.get('dragData')
    props.tabId = tabId
    props.previewMode = currentWindow.getIn(['ui', 'tabs', 'previewMode'])

    return props
  }

  componentDidUpdate (prevProps) {
    if (prevProps.tabWidth && !this.props.tabWidth && !this.props.partOfFullPageSet) {
      window.requestAnimationFrame(() => {
        this.elementRef && this.elementRef.animate([
          { flexBasis: `${prevProps.tabWidth}px`, flexGrow: 0, flexShrink: 0 },
          { flexBasis: 0, flexGrow: 1, flexShrink: 1 }
        ], {
          duration: 250,
          iterations: 1,
          easing: 'ease-in-out'
        })
      })
    }

    // no transition between:
    // - active <-> inactive state
    // - no theme color and first theme color
    if (this.elementRef && prevProps && (
      prevProps.isActive !== this.props.isActive ||
      (!prevProps.themeColor && this.props.themeColor)
    )) {
      const className = css(styles.tabArea_instantTransition)
      this.elementRef.classList.add(className)
      window.requestAnimationFrame(() => {
        this.elementRef.classList.remove(className)
      })
    }
  }

  render () {
    // we don't want themeColor if tab is private
    const isThemed = !this.props.isPrivateTab && this.props.isActive && this.props.themeColor
    const instanceStyles = { }
    if (isThemed) {
      const lightText = backgroundRequiresLightText(this.props.themeColor)
      instanceStyles['--theme-color-bg'] = this.props.themeColor
      // complementing foreground color
      instanceStyles['--theme-color-fg'] =
        lightText
          ? theme.tab.active.colorLight
          : theme.tab.active.colorDark
      // complementing icon color
      instanceStyles['--theme-color-default-icon'] =
        lightText
          ? theme.tab.defaultFaviconColorLight
          : theme.tab.defaultFaviconColor
    }
    if (this.props.tabWidth) {
      instanceStyles.flex = `0 0 ${this.props.tabWidth}px`
    }
    return <div
      data-tab-area
      className={css(
        styles.tabArea,
        (this.isDraggingOverLeft && !this.isDraggingOverSelf) && styles.tabArea_dragging_left,
        (this.isDraggingOverRight && !this.isDraggingOverSelf) && styles.tabArea_dragging_right,
        this.isDragging && styles.tabArea_isDragging,
        this.props.isPinnedTab && styles.tabArea_isPinned,
        (this.props.partOfFullPageSet || !!this.props.tabWidth) && styles.tabArea_partOfFullPageSet,
        this.props.isPreview && styles.tabArea_isPreview,
        !this.props.isPreview && this.props.anyTabIsPreview && styles.tabArea_siblingIsPreview,
        this.props.isActive && this.props.anyTabIsPreview && styles.tabArea_isActive_siblingIsPreview,
        // Set background-color and color to active tab and private tab
        this.props.isActive && styles.tabArea_isActive,
        this.props.isPrivateTab && styles.tabArea_private,
        (this.props.isPrivateTab && this.props.isActive) && styles.tabArea_private_active,
        // Apply themeColor if tab is active and not private
        isThemed && styles.tabArea_themed,
        this.props.isPreview && styles.tabArea_isPreview
      )}
      style={instanceStyles}
      onMouseMove={this.onMouseMove}
      onMouseEnter={this.onMouseEnter}
      onMouseLeave={this.onMouseLeave}
      data-test-id='tab-area'
      data-tab-id={this.props.tabId}
      data-guest-instance-id={this.props.guestInstanceId}
      data-frame-key={this.props.frameKey}
      ref={elementRef => { this.elementRef = elementRef }}
      >
      {
        this.props.isActive && this.props.notificationBarActive
          ? <NotificationBarCaret />
          : null
      }
      <div
        data-tab
        ref={(node) => { this.tabNode = node }}
        className={css(
          styles.tabArea__tab,
          // tab icon only (on pinned tab / small tab)
          this.props.isPinnedTab && styles.tabArea__tab_pinned,
          this.props.centralizeTabIcons && styles.tabArea__tab_centered,
          this.props.showAudioTopBorder && styles.tabArea__tab_audioTopBorder
        )}
        data-test-id='tab'
        data-test-active-tab={this.props.isActive}
        data-test-pinned-tab={this.props.isPinnedTab}
        data-test-private-tab={this.props.isPrivateTab}
        data-frame-key={this.props.frameKey}
        draggable
        title={this.props.isPreview ? null : this.props.title}
        onDrag={this.onDrag}
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
        onDragOver={this.onDragOver}
        onClick={this.onClickTab}
        onContextMenu={contextMenus.onTabContextMenu.bind(this, this.frame)}
      >
        <div
          ref={(node) => { this.tabSentinel = node }}
          className={css(styles.tabArea__tab__sentinel)}
        />
        <div className={css(
          styles.tabArea__tab__identity,
          this.props.centralizeTabIcons && styles.tabArea__tab__identity_centered
        )}>
          <Favicon tabId={this.props.tabId} />
          <AudioTabIcon tabId={this.props.tabId} />
          {
            this.props.visualTabIdDebug &&
            <span className={css(styles.tabArea__tab__tabIdDebug)}>
              <span>[t:{this.props.tabId},(g:{this.props.guestInstanceId})]</span>
              <span>[f:{this.props.frameKey}]</span>
              <span>#[fi:{this.props.frameStateInternalIndex},ti:{this.props.tabIndex}]</span>
            </span>
          }
          <TabTitle tabId={this.props.tabId} />
        </div>
        <PrivateIcon tabId={this.props.tabId} />
        <TorIcon tabId={this.props.tabId} />
        <NewSessionIcon tabId={this.props.tabId} />
        <CloseTabIcon tabId={this.props.tabId} onClick={this.onTabClosedWithMouse} />
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  tabArea: {
    cusor: 'default',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
    flex: '1 1 0',
    // put the top border underneath tab-stip top border, and
    // the left border underneath the previous tab's right border
    margin: `0 0 0 -${theme.tab.borderWidth}px`,
    zIndex: 100, // underneath toolbar shadow
    transformOrigin: 'bottom center',
    minWidth: 0,
    width: 0,
    // no-drag is applied to the button and tab area
    // ref: tabs__tabStrip__newTabButton on tabs.js
    WebkitAppRegion: 'no-drag',
    // There's a special case that tabs should span the full width
    // if there are a full set of them.
    maxWidth: '184px',
    boxShadow: 'var(--tab-box-shadow)',
    // Use css variables for some transition options so that we can change them
    // with other classes below, without having to re-define the whole property.
    // Avoid aphrodite bug which will change css variables
    // to --tab--webkit-transition-duration by calling it 'transit'.
    '--tab-transit-duration': theme.tab.transitionDurationOut,
    '--tab-transit-easing': theme.tab.transitionEasingOut,
    // z-index should be delayed when it changes, so that preview tab stays on top until
    // its scale transition has completed
    '--tab-zindex-delay': theme.tab.transitionDurationOut,
    transition: ['box-shadow', 'transform', 'border', 'margin', 'opacity']
      .map(prop => `${prop} var(--tab-transit-duration) var(--tab-transit-easing) 0s`)
      .join(',') +
      ', z-index var(--tab-zindex-duration, 0s) linear var(--tab-zindex-delay)',
    '--tab-background': theme.tab.background,
    '--tab-color': theme.tab.color,
    '--tab-border-color': theme.tab.borderColor,
    '--tab-background-hover': theme.tab.hover.background,
    '--tab-default-icon-color': theme.tab.defaultFaviconColor,
    ':hover': {
      '--tab-background': `var(--tab-background-hover)`,
      '--tab-color': `var(--tab-color-hover, ${theme.tab.color})`,
      '--tab-default-icon-color': `var(--tab-default-icon-color-hover, ${theme.tab.defaultFaviconColor})`,
      '--tab-border-color': `var(--tab-border-color-hover, ${theme.tab.borderColor})`,
      '--tab-transit-duration': theme.tab.transitionDurationIn,
      '--tab-transit-easing': theme.tab.transitionEasingIn,
      '--tab-mouse-opacity': '1'
    }
  },

  tabArea_instantTransition: {
    '--tab-transit-duration': '0 !important'
  },

  tabArea_dragging_left: {
    paddingLeft: globalStyles.spacing.dragSpacing
  },

  tabArea_dragging_right: {
    paddingRight: globalStyles.spacing.dragSpacing
  },

  tabArea_isDragging: {
    opacity: 0.2,
    paddingLeft: 0,
    paddingRight: 0
  },

  tabArea_isPinned: {
    flex: 'initial',
    width: 'auto'
  },

  tabArea_partOfFullPageSet: {
    maxWidth: 'initial'
  },

  tabArea_isActive: {
    '--tab-color': theme.tab.active.colorDark,
    '--tab-background': theme.tab.active.background,
    '--tab-background-hover': theme.tab.hover.active.background,
    '--tab-border-color': 'var(--tab-background)',
    '--tab-border-color-hover': 'var(--tab-background)',
    '--tab-border-color-bottom': 'var(--tab-background)',
    '--tab-mouse-opacity': '0 !important',
    // on top of toolbar shadow but underneath preview
    zIndex: 300,
    '--tab-box-shadow': '0 2px 4px -0.5px rgba(0, 0, 0, 0.18)'
  },

  tabArea_isPreview: {
    '--tab-background': theme.tab.preview.background,
    '--tab-background-hover': theme.tab.preview.background,
    '--tab-color': theme.tab.active.colorDark,
    '--tab-color-hover': theme.tab.active.colorDark,
    '--tab-border-color': theme.tab.preview.background,
    '--tab-border-color-hover': theme.tab.preview.background,
    // on top of toolbar shadow and preview
    zIndex: 400,
    transform: `scale(${theme.tab.preview.scale})`,
    '--tab-box-shadow': theme.tab.preview.boxShadow,
    '--tab-border-radius': '3px',
    // want the zindex to change immediately when previewing, but delay when un-previewing
    '--tab-zindex-delay': '0s',
    '--tab-zindex-duration': '0s',
    '--tab-transit-duration': theme.tab.transitionDurationIn,
    '--tab-transit-easing': theme.tab.transitionEasingIn
  },

  tabArea_siblingIsPreview: {
    // when un-previewing, if there's still another tab previewed
    // then we want to immediately have that tab on top of the last-previewed tab
    // but have the last previewed tab wait to be underneath the next tab in the DOM
    '--tab-zindex-delay': '0s',
    '--tab-zindex-duration': '.85s',
    willChange: 'transform'
  },

  tabArea_isActive_siblingIsPreview: {
    opacity: '.5'
  },

  tabArea_private: {
    '--tab-background': theme.tab.private.background,
    '--tab-background-hover': theme.tab.hover.private.background
  },

  tabArea_private_active: {
    '--tab-background': theme.tab.active.private.background,
    '--tab-background-hover': theme.tab.active.private.background,
    '--tab-color': theme.tab.active.private.color,
    '--tab-color-hover': theme.tab.active.private.color,
    '--tab-default-icon-color': theme.tab.active.private.defaultFaviconColor,
    '--tab-default-icon-color-hover': theme.tab.active.private.defaultFaviconColor
  },

  tabArea_themed: {
    '--tab-background': `var(--theme-color-bg)`,
    '--tab-background-hover': 'var(--theme-color-bg)',
    '--tab-color': `var(--theme-color-fg)`,
    '--tab-color-hover': 'var(--theme-color-fg)',
    '--tab-default-icon-color': 'var(--theme-color-default-icon)',
    '--tab-default-icon-color-hover': 'var(--theme-color-default-icon)'
  },

  tabArea__tab: {
    boxSizing: 'border-box',
    background: `var(--tab-background, ${theme.tab.background})`,
    // make sure the tab element which contains the background color
    // has a new layer, so that the tab title text is rendered with subpixel antialiasing
    // that knows about both the foreground and background colors
    display: 'flex',
    transition: ['background-color', 'color', 'border']
      .map(prop => `${prop} var(--tab-transit-duration) var(--tab-transit-easing) 0s`)
      .join(','),
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    color: `var(--tab-color, ${theme.tab.color})`,
    borderRadius: 'var(--tab-border-radius, 2px) var(--tab-border-radius, 2px) 0 0',
    border: `solid var(--tab-border-width, ${theme.tab.borderWidth}px) var(--tab-border-color)`,
    borderTopColor: 'var(--tab-background) !important',  // aphrodite puts this above the border defined in the previous line, so use important :-(
    borderBottom: `solid var(--tab-border-width, ${theme.tab.borderWidth}px) transparent !important`,  // aphrodite puts this above the border defined in the previous line, so use important :-(

    // mouse-tracking radial gradient
    '::before': {
      content: '" "',
      position: 'absolute',
      left: 'var(--tab-mouse-x)',
      top: 0,
      bottom: 0,
      width: 'calc(100% * var(--tab-mouse-opacity, 0))',
      background: `radial-gradient(
        circle farthest-corner,
        var(--tab-background-hover),
        transparent
      )`,
      filter: 'brightness(var(--tab-mouse-brightness, 106%))',
      transform: 'translateX(-50%)',
      transition: 'opacity var(--tab-transit-duration) ease, width 0s linear var(--tab-transit-duration)',
      opacity: 'var(--tab-mouse-opacity, 0)'
    },
    ':hover:before': {
      // Show immediately, and fade-in opacity,
      // but when leaving, wait for fade-out to finish before hiding.
      transitionDelay: '0s'
    }
  },

  tabArea__tab_audioTopBorder: {
    '::after': {
      content: `''`,
      display: 'block',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: theme.tab.icon.audio.color
    }
  },

  tabArea__tab_pinned: {
    padding: 0,
    width: '28px',
    justifyContent: 'center'
  },

  tabArea__tab_centered: {
    flex: 'auto',
    justifyContent: 'center',
    padding: 0,
    margin: 0
  },

  // The sentinel is responsible to respond to tabs
  // intersection state. This is an empty hidden element
  // which `width` value shouldn't be changed unless the intersection
  // point needs to be edited.
  tabArea__tab__sentinel: {
    position: 'absolute',
    left: 0,
    height: '1px',
    background: 'transparent',
    width: globalStyles.spacing.sentinelSize
  },

  tabArea__tab__identity: {
    flex: '1',
    minWidth: '0', // @see https://bugzilla.mozilla.org/show_bug.cgi?id=1108514#c5
    margin: `calc(var(--tab-border-width, 0) * -1px) 6px 0 ${globalStyles.spacing.defaultTabMargin}`, // bring the right margin closer as we do fade-out
    // make sure title text is not cut off, but is also vertically centered
    // by giving it full height of favicon
    height: theme.tab.identityHeight,
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    overflow: 'visible'
  },

  tabArea__tab__identity_centered: {
    flex: 'auto',
    justifyContent: 'center',
    padding: 0,
    margin: 0
  },

  tabArea__tab__tabIdDebug: {
    fontSize: '8px',
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap'
  }
})

module.exports = ReduxComponent.connect(Tab)
