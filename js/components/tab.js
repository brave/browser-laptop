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

class Tab extends ImmutableComponent {
  get isPinned () {
    return !!this.props.frameProps.get('pinnedLocation')
  }

  get draggingOverData () {
    if (!this.props.draggingOverData ||
        this.props.draggingOverData.get('dragOverKey') !== this.props.frameProps.get('key')) {
      return
    }

    const sourceDragData = dnd.getInProcessDragData()
    const location = sourceDragData.get('location')
    const key = this.props.draggingOverData.get('dragOverKey')
    const draggingOverFrame = this.props.frames.get(key)
    if ((location === 'about:blank' || location === 'about:newtab' || isIntermediateAboutPage(location)) &&
        (draggingOverFrame && draggingOverFrame.get('pinnedLocation'))) {
      return
    }

    return this.props.draggingOverData
  }

  get isDragging () {
    const sourceDragData = dnd.getInProcessDragData()
    return sourceDragData && this.props.frameProps.get('key') === sourceDragData.get('key')
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
    return (this.props.frameProps.get('title') ||
      this.props.frameProps.get('location')).replace('▶ ', '')
  }

  onDragStart (e) {
    dnd.onDragStart(dragTypes.TAB, this.props.frameProps, e)
  }

  onDragEnd (e) {
    dnd.onDragEnd(dragTypes.TAB, this.props.frameProps, e)
  }

  onDragOver (e) {
    dnd.onDragOver(dragTypes.TAB, this.tab.getBoundingClientRect(), this.props.frameProps.get('key'), this.draggingOverData, e)
  }

  setActiveFrame () {
    windowActions.setActiveFrame(this.props.frameProps)
  }

  onCloseFrame (event) {
    event.stopPropagation()
    windowActions.closeFrame(this.props.frames, this.props.frameProps)
  }

  onMuteFrame (muted, event) {
    event.stopPropagation()
    windowActions.setAudioMuted(this.props.frameProps, muted)
  }

  get loading () {
    return this.props.frameProps &&
    this.props.frameProps.get('loading') &&
    (!this.props.frameProps.get('provisionalLocation') ||
    !this.props.frameProps.get('provisionalLocation').startsWith('chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/'))
  }

  onMouseLeave () {
    window.clearTimeout(this.hoverTimeout)
    this.lastPreviewClearTime = new Date().getTime()
    windowActions.setPreviewFrame(null)
  }

  onMouseEnter () {
    // If a user has recently seen a preview they likely are scrolling through
    // previews.  If we're not in preview mode we add a bit of hover time
    // before doing a preview
    const previewMode = new Date().getTime() - this.lastPreviewClearTime < 1500
    window.clearTimeout(this.hoverClearTimeout)
    this.hoverTimeout =
      window.setTimeout(windowActions.setPreviewFrame.bind(null, this.props.frameProps), previewMode ? 0 : 400)
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
    const backgroundColor = this.props.paintTabs &&
      (this.props.frameProps.get('themeColor') || this.props.frameProps.get('computedThemeColor'))
    if (this.props.isActive && backgroundColor) {
      activeTabStyle.background = backgroundColor
      const textColor = getTextColorForBackground(backgroundColor)
      iconStyle.color = textColor
      if (textColor) {
        activeTabStyle.color = getTextColorForBackground(backgroundColor)
      }
    }

    const icon = this.props.frameProps.get('icon')
    if (!this.loading && icon) {
      iconStyle = Object.assign(iconStyle, {
        backgroundImage: `url(${icon})`,
        backgroundSize: iconSize,
        height: iconSize
      })
    }

    let playIcon = null
    if (this.props.frameProps.get('audioPlaybackActive') ||
      this.props.frameProps.get('audioMuted')) {
      playIcon = <span className={cx({
        audioPlaybackActive: true,
        fa: true,
        'fa-volume-up': this.props.frameProps.get('audioPlaybackActive') &&
          !this.props.frameProps.get('audioMuted'),
        'fa-volume-off': this.props.frameProps.get('audioPlaybackActive') &&
          this.props.frameProps.get('audioMuted')
      })}
        onClick={this.onMuteFrame.bind(this, !this.props.frameProps.get('audioMuted'))} />
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
        data-frame-key={this.props.frameProps.get('key')}
        ref={(node) => { this.tab = node }}
        draggable
        title={this.props.frameProps.get('title')}
        onDragStart={this.onDragStart.bind(this)}
        onDragEnd={this.onDragEnd.bind(this)}
        onDragOver={this.onDragOver.bind(this)}
        onClick={this.onClickTab.bind(this)}
        onContextMenu={contextMenus.onTabContextMenu.bind(this, this.props.frameProps)}
        style={activeTabStyle}>
        {
          this.props.frameProps.get('isPrivate')
          ? <div className='privateIcon fa fa-eye' />
          : null
        }
        {
          this.props.frameProps.get('partitionNumber')
          ? <div data-l10n-args={JSON.stringify({ partitionNumber: this.props.frameProps.get('partitionNumber') })}
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
