/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

const ImmutableComponent = require('./immutableComponent')

const windowActions = require('../actions/windowActions')
const dragTypes = require('../constants/dragTypes')
const cx = require('../lib/classSet.js')
const {getTextColorForBackground} = require('../lib/color')
const {isIntermediateAboutPage} = require('../lib/appUrlUtil')

const contextMenus = require('../contextMenus')
const dnd = require('../dnd')
const windowStore = require('../stores/windowStore')

class Tab extends ImmutableComponent {
  get frame () {
    return windowStore.getFrame(this.props.frameKey)
  }
  get isPinned () {
    return !!this.frame.get('pinnedLocation')
  }

  get draggingOverData () {
    if (!this.props.draggingOverData ||
        this.props.draggingOverData.get('dragOverKey') !== this.props.frameKey) {
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
    return sourceDragData && this.props.frameKey === sourceDragData.get('key')
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
    // YouTube tries to change the title to add a play icon when
    // there is audio. Since we have our own audio indicator we get
    // rid of it.
    return (this.frame.get('title') ||
      this.frame.get('location')).replace('▶ ', '')
  }

  onDragStart (e) {
    dnd.onDragStart(dragTypes.TAB, this.frame, e)
  }

  onDragEnd (e) {
    dnd.onDragEnd(dragTypes.TAB, this.frame, e)
  }

  onDragOver (e) {
    dnd.onDragOver(dragTypes.TAB, this.tab.getBoundingClientRect(), this.props.frameKey, this.draggingOverData, e)
  }

  setActiveFrame () {
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
    this.frame.get('loading') &&
    (!this.frame.get('provisionalLocation') ||
    !this.frame.get('provisionalLocation').startsWith('chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/'))
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
    const backgroundColor = this.props.paintTabs && this.props.themeColor
    if (this.props.isActive && backgroundColor) {
      activeTabStyle.background = backgroundColor
      const textColor = getTextColorForBackground(backgroundColor)
      iconStyle.color = textColor
      if (textColor) {
        activeTabStyle.color = getTextColorForBackground(backgroundColor)
      }
    }

    const icon = this.props.icon
    if (!this.loading && icon) {
      iconStyle = Object.assign(iconStyle, {
        backgroundImage: `url(${icon})`,
        backgroundSize: iconSize,
        height: iconSize
      })
    }

    let playIcon = null
    if (this.props.audioPlaybackActive || this.propsaudioMuted) {
      playIcon = <span className={cx({
        audioPlaybackActive: true,
        fa: true,
        'fa-volume-up': this.props.audioPlaybackActive &&
          !this.props.audioMuted,
        'fa-volume-off': this.props.audioPlaybackActive &&
          this.props.audioMuted
      })}
        onClick={this.onMuteFrame.bind(this, !this.props.audioMuted)} />
    }

    return <div
      className={cx({
        tabArea: true,
        draggingOverLeft: this.isDraggingOverLeft,
        draggingOverRight: this.isDraggingOverRight,
        isDragging: this.isDragging,
        isPinned: this.isPinned,
        partOfFullPageSet: this.props.partOfFullPageSet
      })}
      onMouseEnter={this.props.previewTabs ? this.onMouseEnter.bind(this) : null}
      onMouseLeave={this.props.previewTabs ? this.onMouseLeave.bind(this) : null}>
      <div className={cx({
        tab: true,
        isPinned: this.isPinned,
        active: this.props.isActive,
        private: this.props.isPrivate
      })}
        data-frame-key={this.props.frameKey}
        ref={(node) => { this.tab = node }}
        draggable
        title={this.props.title}
        onDragStart={this.onDragStart.bind(this)}
        onDragEnd={this.onDragEnd.bind(this)}
        onDragOver={this.onDragOver.bind(this)}
        onClick={this.onClickTab.bind(this)}
        onContextMenu={contextMenus.onTabContextMenu.bind(this, this.frame)}
        style={activeTabStyle}>
        {
          this.props.isPrivate
          ? <div className='privateIcon fa fa-eye' />
          : null
        }
        {
          this.props.partitionNumber
          ? <div data-l10n-args={JSON.stringify({ partitionNumber: this.props.partitionNumber })}
            data-l10n-id='sessionInfoTab'
            className='privateIcon fa fa-user' />
          : null
        }
        <div className={cx({
          tabIcon: true,
          'fa fa-circle-o-notch fa-spin': this.loading
        })}
          style={iconStyle} />
        {playIcon}
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

module.exports = Tab
