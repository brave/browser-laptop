/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')

const ImmutableComponent = require('./immutableComponent')

const WindowActions = require('../actions/windowActions')
const cx = require('../lib/classSet.js')
const {getTextColorForBackground} = require('../lib/color')

const getFavicon = require('../lib/faviconUtil.js')

const contextMenus = require('../contextMenus')

class DragIndicator extends ImmutableComponent {
  constructor (props) {
    super(props)
  }

  render () {
    return <hr className={cx({
      dragIndicator: true,
      dragActive: this.props.active,
      dragIndicatorEnd: this.props.end
    })}/>
  }
}

class Tab extends ImmutableComponent {
  constructor (props) {
    super(props)
  }

  get isPinned () {
    return this.props.frameProps.get('isPinned')
  }

  get displayValue () {
    // YouTube tries to change the title to add a play icon when
    // there is audio. Since we have our own audio indicator we get
    // rid of it.
    return (this.props.frameProps.get('title') ||
    this.props.frameProps.get('location')).replace('▶ ', '')
  }

  onDragStart (e) {
    WindowActions.tabDragStart(this.props.frameProps)
  }

  onDragEnd () {
    WindowActions.tabDragStop(this.props.frameProps)
  }

  onDragOver (e) {
    e.preventDefault()

    // Otherise, only accept it if we have some frameProps
    if (!this.props.activeDraggedTab) {
      WindowActions.tabDraggingOn(this.props.frameProps)
      return
    }

    let rect = ReactDOM.findDOMNode(this.refs.tab).getBoundingClientRect()
    if (e.clientX > rect.left && e.clientX < rect.left + rect.width / 2 &&
      !this.props.frameProps.get('tabIsDraggingOverLeftHalf')) {
      WindowActions.tabDragDraggingOverLeftHalf(this.props.frameProps)
    } else if (e.clientX < rect.right && e.clientX >= rect.left + rect.width / 2 &&
      !this.props.frameProps.get('tabIsDraggingOverRightHalf')) {
      WindowActions.tabDragDraggingOverRightHalf(this.props.frameProps)
    }
  }

  onDragLeave () {
    if (this.props.frameProps.get('tabIsDraggingOverLeftHalf') ||
      this.props.frameProps.get('tabIsDraggingOn') ||
      this.props.frameProps.get('tabIsDraggingOverLeftHalf')) {
      WindowActions.tabDragExit(this.props.frameProps)
    } else if (this.props.frameProps.get('tabIsDraggingOverRightHalf')) {
      WindowActions.tabDragExitRightHalf(this.props.frameProps)
    }
  }

  onDrop (e) {
    let sourceFrameProps = this.props.activeDraggedTab
    if (!sourceFrameProps) {
      return
    }

    if (this.props.frameProps.get('tabIsDraggingOverLeftHalf')) {
      WindowActions.moveTab(sourceFrameProps, this.props.frameProps, true)
    } else {
      WindowActions.moveTab(sourceFrameProps, this.props.frameProps, false)
    }
    WindowActions.tabDragExit(this.props.frameProps)
  }

  setActiveFrame () {
    WindowActions.setActiveFrame(this.props.frameProps)
  }

  onCloseFrame () {
    WindowActions.closeFrame(this.props.frames, this.props.frameProps)
  }

  onMuteFrame (muted) {
    WindowActions.setAudioMuted(this.props.frameProps, muted)
  }

  render () {
    const thumbnailWidth = 160
    const thumbnailHeight = 100

    let thumbnailStyle = {
      backgroundSize: `${thumbnailWidth} ${thumbnailHeight}`,
      width: thumbnailWidth,
      height: thumbnailHeight
    }
    if (this.props.frameProps.get('thumbnailUrl')) {
      thumbnailStyle.backgroundImage = `url(${this.props.frameProps.get('thumbnailUrl')})`
    }

    // Style based on theme-color
    var activeTabStyle = {}
    const backgroundColor = this.props.frameProps.get('themeColor') || this.props.frameProps.get('computedThemeColor')
    if (this.props.isActive && backgroundColor) {
      activeTabStyle.backgroundColor = backgroundColor
      const textColor = getTextColorForBackground(backgroundColor)
      if (textColor) {
        activeTabStyle.color = getTextColorForBackground(backgroundColor)
      }
    }

    const iconStyle = {
      backgroundImage: `url(${getFavicon(this.props.frameProps)})`,
      backgroundSize: 16,
      width: 16,
      height: 16
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
        isPinned: this.isPinned,
        partOfFullPageSet: this.props.partOfFullPageSet
      })}>
      <DragIndicator active={this.props.frameProps.get('tabIsDraggingOverLeftHalf')}/>
      <div className={cx({
        tab: true,
        isPinned: this.isPinned,
        active: this.props.isActive,
        private: this.props.isPrivate,
        draggingOn: this.props.frameProps.get('tabIsDraggingOn'),
        dragging: this.props.frameProps.get('tabIsDragging'),
        'dragging-over': this.props.frameProps.get('tabIsDraggingOverLeftHalf') ||
          this.props.frameProps.get('tabIsDraggingOverRightHalf')
      })}
      ref='tab'
      draggable='true'
      title={this.props.frameProps.get('title')}
      onDragStart={this.onDragStart.bind(this)}
      onDragEnd={this.onDragEnd.bind(this)}
      onDragLeave={this.onDragLeave.bind(this)}
      onDragOver={this.onDragOver.bind(this)}
      onDrop={this.onDrop.bind(this)}
      onClick={this.setActiveFrame.bind(this)}
      onContextMenu={contextMenus.onTabContextMenu.bind(this, this.props.frameProps)}
      style={activeTabStyle}>
      <div className='thumbnail'
        style={thumbnailStyle} />
        { !this.isPinned
          ? <span onClick={this.onCloseFrame.bind(this)}
          className='closeTab fa fa-times-circle'/> : null }
        <div className='tabIcon' style={iconStyle}/>
        {playIcon}
        { !this.isPinned
          ? <div className='tabTitle'>
          {this.displayValue}
        </div> : null }
      </div>
      <DragIndicator
        end
        active={this.props.frameProps.get('tabIsDraggingOverRightHalf')}/>
    </div>
  }
}

module.exports = Tab
