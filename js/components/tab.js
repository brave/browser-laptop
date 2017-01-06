/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

const ImmutableComponent = require('./immutableComponent')

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

const {TabIcon, AudioTabIcon} = require('../../app/renderer/components/tabIcon')

class Tab extends ImmutableComponent {
  constructor () {
    super()
    this.onMouseEnter = this.onMouseEnter.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
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

  onCloseFrame (event) {
    event.stopPropagation()
    windowActions.closeFrame(windowStore.getFrames(), this.frame)
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
    window.clearTimeout(this.hoverTimeout)
    windowActions.setPreviewFrame(null)
  }

  onMouseEnter (e) {
    // relatedTarget inside mouseenter checks which element before this event was the pointer on
    // if this element has a tab-like class, then it's likely that the user was previewing
    // a sequency of tabs. Called here as previewMode.
    const previewMode = /tab(?!pages)/i.test(e.relatedTarget.classList)

    // If user isn't in previewMode, we add a bit of delay to avoid tab from flashing out
    // as reported here: https://github.com/brave/browser-laptop/issues/1434
    this.hoverTimeout =
      window.setTimeout(windowActions.setPreviewFrame.bind(null, this.frame), previewMode ? 0 : 200)
  }

  onClickTab (e) {
    // Middle click should close tab
    if (e.button === 1) {
      this.onCloseFrame(e)
    } else {
      this.setActiveFrame(e)
    }
  }

  render () {
    // Style based on theme-color
    const iconSize = 16
    let iconStyle = {
      minWidth: iconSize,
      width: iconSize
    }
    const activeTabStyle = {}
    const backgroundColor = this.props.paintTabs && (this.props.tab.get('themeColor') || this.props.tab.get('computedThemeColor'))
    if (this.props.isActive && backgroundColor) {
      activeTabStyle.background = backgroundColor
      const textColor = getTextColorForBackground(backgroundColor)
      iconStyle.color = textColor
      if (textColor) {
        activeTabStyle.color = getTextColorForBackground(backgroundColor)
      }
    }

    const icon = this.props.tab.get('icon')
    const defaultIcon = 'fa fa-file-o'

    if (!this.loading && icon) {
      iconStyle = Object.assign(iconStyle, {
        backgroundImage: `url(${icon})`,
        backgroundSize: iconSize,
        height: iconSize
      })
    }

    let playIcon = false
    let iconClass = null
    if (this.props.tab.get('audioPlaybackActive') || this.props.tab.get('audioMuted')) {
      if (this.props.tab.get('audioPlaybackActive') && !this.props.tab.get('audioMuted')) {
        iconClass = 'fa fa-volume-up'
      } else if (this.props.tab.get('audioPlaybackActive') && this.props.tab.get('audioMuted')) {
        iconClass = 'fa fa-volume-off'
      }
      playIcon = true
    }

    const locationHasFavicon = this.props.tab.get('location') !== 'about:newtab'

    return <div
      className={cx({
        tabArea: true,
        draggingOverLeft: this.isDraggingOverLeft,
        draggingOverRight: this.isDraggingOverRight,
        isDragging: this.isDragging,
        isPinned: this.isPinned,
        partOfFullPageSet: this.props.partOfFullPageSet
      })}
      onMouseEnter={this.props.previewTabs ? this.onMouseEnter : null}
      onMouseLeave={this.props.previewTabs ? this.onMouseLeave : null}>
      <div className={cx({
        tab: true,
        isPinned: this.isPinned,
        active: this.props.isActive,
        private: this.props.tab.get('isPrivate')
      })}
        data-frame-key={this.props.tab.get('frameKey')}
        ref={(node) => { this.tabNode = node }}
        draggable
        title={this.props.tab.get('title')}
        onDragStart={this.onDragStart.bind(this)}
        onDragEnd={this.onDragEnd.bind(this)}
        onDragOver={this.onDragOver.bind(this)}
        onClick={this.onClickTab.bind(this)}
        onContextMenu={contextMenus.onTabContextMenu.bind(this, this.frame)}
        style={activeTabStyle}>
        {
          this.props.tab.get('isPrivate')
          ? <TabIcon styles='fa fa-eye' />
          : null
        }
        {
          this.props.tab.get('partitionNumber')
          ? <TabIcon l10nArgs={JSON.stringify({partitionNumber: this.props.tab.get('partitionNumber')})}
            l10nId='sessionInfoTab'
            styles='fa fa-user' />
          : null
        }
        {
          locationHasFavicon
          ? <div className={cx({
            tabIcon: true,
            bookmarkFile: !icon,
            [defaultIcon]: !icon,
            'fa fa-circle-o-notch fa-spin': this.loading
          })}
            style={iconStyle} />
          : null
        }
        {
          playIcon
          ? <AudioTabIcon styles={iconClass}
            onClick={this.onMuteFrame.bind(this, !this.props.tab.get('audioMuted'))} />
          : null
        }
        {
          !this.isPinned
          ? <div className='tabTitle'>
            {this.displayValue}
          </div>
          : null
        }
        {
          !this.isPinned
          ? <span onClick={this.onCloseFrame.bind(this)}
            data-l10n-id='closeTabButton'
            className='closeTab fa fa-times-circle' />
          : null
        }
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
