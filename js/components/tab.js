/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

const ImmutableComponent = require('./immutableComponent')
const {StyleSheet, css} = require('aphrodite')

const windowActions = require('../actions/windowActions')
const locale = require('../l10n')
const dragTypes = require('../constants/dragTypes')
const messages = require('../constants/messages')
const cx = require('../lib/classSet')
const {getTextColorForBackground} = require('../lib/color')
const {isIntermediateAboutPage} = require('../lib/appUrlUtil')

const contextMenus = require('../contextMenus')
const dnd = require('../dnd')
const windowStore = require('../stores/windowStore')
const ipc = require('electron').ipcRenderer
const throttle = require('../lib/throttle')

const styles = require('../../app/renderer/components/styles/tab')
const {Favicon, AudioTabIcon, NewSessionIcon,
      PrivateIcon, TabTitle, CloseTabIcon} = require('../../app/renderer/components/tabContent')
const {getTabBreakpoint, tabUpdateFrameRate} = require('../../app/renderer/lib/tabUtil')
const {isWindows} = require('../../app/common/lib/platformUtil')

class Tab extends ImmutableComponent {
  constructor () {
    super()
    this.onMouseEnter = this.onMouseEnter.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
    this.onUpdateTabSize = this.onUpdateTabSize.bind(this)
  }
  get frame () {
    return windowStore.getFrame(this.props.tab.get('frameKey'))
  }
  get isPinned () {
    return !!this.props.tab.get('pinnedLocation')
  }

  get draggingOverData () {
    if (!this.props.draggingOverData ||
        this.props.draggingOverData.get('dragOverKey') !== this.props.tab.get('frameKey')) {
      return
    }

    const sourceDragData = dnd.getInProcessDragData()
    const location = sourceDragData.get('location')
    const key = this.props.draggingOverData.get('dragOverKey')
    const draggingOverFrame = windowStore.getFrame(key)
    if ((location === 'about:blank' || location === 'about:newtab' || isIntermediateAboutPage(location)) &&
        (draggingOverFrame && draggingOverFrame.get('pinnedLocation'))) {
      return
    }

    return this.props.draggingOverData
  }

  get isDragging () {
    const sourceDragData = dnd.getInProcessDragData()
    return sourceDragData && this.props.tab.get('frameKey') === sourceDragData.get('key')
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

  get displayValue () {
    // For renderer initiated navigations, make sure we show Untitled
    // until we know what we're loading.  We should probably do this for
    // all about: pages that we already know the title for so we don't have
    // to wait for the title to be parsed.
    if (this.props.tab.get('location') === 'about:blank') {
      return locale.translation('aboutBlankTitle')
    }
    // YouTube tries to change the title to add a play icon when
    // there is audio. Since we have our own audio indicator we get
    // rid of it.
    return (this.props.tab.get('title') ||
      this.props.tab.get('location')).replace('▶ ', '')
  }

  onDragStart (e) {
    dnd.onDragStart(dragTypes.TAB, this.frame, e)
  }

  onDragEnd (e) {
    dnd.onDragEnd(dragTypes.TAB, this.frame, e)
  }

  onDragOver (e) {
    dnd.onDragOver(dragTypes.TAB, this.tabNode.getBoundingClientRect(), this.props.tab.get('frameKey'), this.draggingOverData, e)
  }

  setActiveFrame (event) {
    event.stopPropagation()
    windowActions.setActiveFrame(this.frame)
  }

  onTabClosedWithMouse (event) {
    event.stopPropagation()
    if (this.props.onTabClosedWithMouse) {
      this.props.onTabClosedWithMouse(this.tabNode.parentNode.getBoundingClientRect())
      windowActions.closeFrame(windowStore.getFrames(), this.frame)
    }
  }

  onMuteFrame (muted, event) {
    event.stopPropagation()
    windowActions.setAudioMuted(this.frame, muted)
  }

  get loading () {
    return this.frame &&
    (this.props.tab.get('loading') ||
     this.props.tab.get('location') === 'about:blank') &&
    (!this.props.tab.get('provisionalLocation') ||
    !this.props.tab.get('provisionalLocation').startsWith('chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/'))
  }

  onMouseLeave () {
    if (this.props.previewTabs) {
      window.clearTimeout(this.hoverTimeout)
      windowActions.setPreviewFrame(null)
    }
    windowActions.setTabHoverState(this.frame, false)
  }

  onMouseEnter (e) {
    // relatedTarget inside mouseenter checks which element before this event was the pointer on
    // if this element has a tab-like class, then it's likely that the user was previewing
    // a sequency of tabs. Called here as previewMode.
    const previewMode = /tab(?!pages)/i.test(e.relatedTarget.classList)

    // If user isn't in previewMode, we add a bit of delay to avoid tab from flashing out
    // as reported here: https://github.com/brave/browser-laptop/issues/1434
    if (this.props.previewTabs) {
      this.hoverTimeout =
        window.setTimeout(windowActions.setPreviewFrame.bind(null, this.frame), previewMode ? 0 : 200)
    }
    windowActions.setTabHoverState(this.frame, true)
  }

  onClickTab (e) {
    // Middle click should close tab
    if (e.button === 1) {
      this.onTabClosedWithMouse(e)
    } else {
      this.setActiveFrame(e)
    }
  }

  get themeColor () {
    return this.props.paintTabs &&
    (this.props.tab.get('themeColor') || this.props.tab.get('computedThemeColor'))
  }

  get tabSize () {
    const tab = this.tabNode
    // Avoid TypeError keeping it null until component is mounted
    return tab && !this.isPinned ? tab.getBoundingClientRect().width : null
  }

  get narrowView () {
    const sizes = ['medium', 'mediumSmall', 'small', 'extraSmall', 'smallest']
    return sizes.includes(this.props.tab.get('breakpoint'))
  }

  get narrowestView () {
    const sizes = ['extraSmall', 'smallest']
    return sizes.includes(this.props.tab.get('breakpoint'))
  }

  get canPlayAudio () {
    return this.props.tab.get('audioPlaybackActive') || this.props.tab.get('audioMuted')
  }

  onUpdateTabSize () {
    const currentSize = getTabBreakpoint(this.tabSize)
    // Avoid changing state on unmounted component
    // when user switch to a new tabSet
    if (this.tabNode) {
      windowActions.setTabBreakpoint(this.frame, currentSize)
    }
  }

  componentWillMount () {
    this.onUpdateTabSize()
  }

  componentDidMount () {
    this.onUpdateTabSize()
    window.addEventListener('resize', throttle(this.onUpdateTabSize, tabUpdateFrameRate))
  }

  componentDidUpdate () {
    this.tabSize
    this.onUpdateTabSize()
  }

  componentWillUnmount () {
    this.onUpdateTabSize()
    window.removeEventListener('resize', this.onUpdateTabSize)
  }

  render () {
    const perPageStyles = StyleSheet.create({
      themeColor: {
        color: this.themeColor ? getTextColorForBackground(this.themeColor) : 'inherit',
        background: this.themeColor ? this.themeColor : 'inherit',
        ':hover': {
          color: this.themeColor ? getTextColorForBackground(this.themeColor) : 'inherit',
          background: this.themeColor ? this.themeColor : 'inherit'
        }
      }
    })
    return <div
      className={cx({
        tabArea: true,
        draggingOverLeft: this.isDraggingOverLeft,
        draggingOverRight: this.isDraggingOverRight,
        isDragging: this.isDragging,
        isPinned: this.isPinned,
        partOfFullPageSet: this.props.partOfFullPageSet || !!this.props.tabWidth
      })}
      style={this.props.tabWidth ? { flex: `0 0 ${this.props.tabWidth}px` } : {}}
      onMouseEnter={this.onMouseEnter}
      onMouseLeave={this.onMouseLeave}>
      <div className={css(
        styles.tab,
        this.isPinned && styles.isPinned,
        this.props.isActive && styles.active,
        this.props.tab.get('isPrivate') && styles.private,
        this.props.isActive && this.props.tab.get('isPrivate') && styles.activePrivateTab,
        this.narrowView && this.canPlayAudio && styles.narrowViewPlayIndicator,
        this.props.isActive && this.themeColor && perPageStyles.themeColor,
        !this.isPinned && this.narrowView && styles.tabNarrowView,
        !this.isPinned && this.narrowestView && styles.tabNarrowestView,
        !this.isPinned && this.props.tab.get('breakpoint') === 'smallest' && styles.tabMinAllowedSize,
        // Windows specific style
        isWindows() && styles.tabForWindows
        )}
        data-test-active-tab={this.props.isActive}
        data-test-pinned-tab={this.isPinned}
        data-test-private-tab={this.props.tab.get('isPrivate')}
        data-test-id='tab'
        data-frame-key={this.props.tab.get('frameKey')}
        ref={(node) => { this.tabNode = node }}
        draggable
        title={this.props.tab.get('title')}
        onDragStart={this.onDragStart.bind(this)}
        onDragEnd={this.onDragEnd.bind(this)}
        onDragOver={this.onDragOver.bind(this)}
        onClick={this.onClickTab.bind(this)}
        onContextMenu={contextMenus.onTabContextMenu.bind(this, this.frame)}>
        <div className={css(
          styles.tabId,
          this.narrowView && styles.tabIdNarrowView,
          this.props.tab.get('breakpoint') === 'smallest' && styles.tabIdMinAllowedSize
          )}>
          <Favicon tabProps={this.props.tab} isLoading={this.loading} isPinned={this.isPinned} />
          <AudioTabIcon
            tabProps={this.props.tab}
            onClick={this.onMuteFrame.bind(this, !this.props.tab.get('audioMuted'))}
          />
          <TabTitle tabProps={this.props.tab} pageTitle={this.displayValue} />
        </div>
        <PrivateIcon tabProps={this.props.tab} />
        <NewSessionIcon
          tabProps={this.props.tab}
          l10nArgs={this.props.tab.get('partitionNumber')}
          l10nId='sessionInfoTab'
        />
        <CloseTabIcon
          tabProps={this.props.tab}
          onClick={this.onTabClosedWithMouse.bind(this)}
          l10nId='closeTabButton'
        />
      </div>
    </div>
  }
}

const paymentsEnabled = () => {
  const getSetting = require('../settings').getSetting
  const settings = require('../constants/settings')
  return getSetting(settings.PAYMENTS_ENABLED)
}

windowStore.addChangeListener(() => {
  if (paymentsEnabled()) {
    const windowState = windowStore.getState()
    const tabs = windowState && windowState.get('tabs')
    if (tabs) {
      try {
        const presentP = tabs.some((tab) => {
          return tab.get('location') === 'about:preferences#payments'
        })
        ipc.send(messages.LEDGER_PAYMENTS_PRESENT, presentP)
      } catch (ex) { }
    }
  }
})
module.exports = Tab
