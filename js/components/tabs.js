const React = require('react')
const ReactDOM = require('react-dom')

import Immutable from 'immutable'
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet.js')

const getFavicon = require('../lib/faviconUtil.js')

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
    this.state = Immutable.fromJS({
      isDragging: false,
      isDraggingOn: false,
      isDraggingOverLeftHalf: false,
      isDraggingOverRightHalf: false
    })
  }

  get displayValue () {
    // YouTube tries to change the title to add a play icon when
    // there is audio. Since we have our own audio indicator we get
    // rid of it.
    return (this.props.frameProps.get('title') ||
    this.props.frameProps.get('location')).replace('▶ ', '')
  }

  onDragStart (e) {
    e.dataTransfer.setData('frameProps',
      JSON.stringify(this.props.frameProps.toJS()))
    this.setState('isDragging', true)
  }

  onDragEnd () {
    this.setState('isDragging', false)
  }

  onDragOver (e) {
    e.preventDefault()

    // Otherise, only accept it if we have some frameProps
    if (!e.dataTransfer.getData('frameProps')) {
      this.mergeState({
        isDraggingOn: true,
        isDraggingOverLeftHalf: false,
        isDraggingOverRightHalf: false
      })
      return
    }

    let rect = ReactDOM.findDOMNode(this.refs.tab).getBoundingClientRect()
    if (e.clientX > rect.left && e.clientX < rect.left + rect.width / 2 &&
      !this.state.get('isDraggingOverLeftHalf')) {
      this.mergeState({
        isDraggingOn: false,
        isDraggingOverLeftHalf: true,
        isDraggingOverRightHalf: false
      })
    } else if (e.clientX < rect.right && e.clientX >= rect.left + rect.width / 2 &&
      !this.state.get('isDraggingOverRightHalf')) {
      this.mergeState({
        isDraggingOn: false,
        isDraggingOverLeftHalf: false,
        isDraggingOverRightHalf: true
      })
    }
  }

  onDragLeave () {
    if (this.state.get('isDraggingOverLeftHalf') ||
      this.state.get('isDraggingOn') ||
      this.state.get('isDraggingOverLeftHalf')) {
      this.mergeState({
        isDraggingOn: false,
        isDraggingOverLeftHalf: false,
        isDraggingOverRightHalf: false
      })
    } else if (this.state.get('isDraggingOverRightHalf')) {
      this.setState('isDraggingOverRightHalf', false)
    }
  }

  onDrop (e) {
    var dropText = e.dataTransfer.getData('text/plain')
    if (dropText) {
      this.props.onNavigate(dropText)
      return
    }

    let dataTransferString = e.dataTransfer.getData('frameProps')
    if (!dataTransferString) {
      return
    }

    let sourceFrameProps = Immutable.fromJS(JSON.parse(dataTransferString))
    if (this.state.get('isDraggingOverLeftHalf')) {
      this.props.onMoveFrame(sourceFrameProps, this.props.frameProps, true)
    } else {
      this.props.onMoveFrame(sourceFrameProps, this.props.frameProps, false)
    }
    this.mergeState({
      isDraggingOn: false,
      isDraggingOverLeftHalf: false,
      isDraggingOverRightHalf: false
    })
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
    if (this.props.isActive && (this.props.frameProps.get('themeColor') || this.props.frameProps.get('computedThemeColor'))) {
      activeTabStyle.backgroundColor = this.props.frameProps.get('themeColor') || this.props.frameProps.get('computedThemeColor')
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
        playIcon: true,
        fa: true,
        'fa-volume-up': this.props.frameProps.get('audioPlaybackActive') &&
          !this.props.frameProps.get('audioMuted'),
        'fa-volume-off': this.props.frameProps.get('audioMuted')
      })}
      onClick={this.props.frameProps.get('audioMuted') ? this.props.onUnmuteFrame : this.props.onMuteFrame} />
    }

    return <div className='tabArea'
        style={{
          width: `${this.props.tabWidth}%`
        }}>
      <DragIndicator active={this.state.get('isDraggingOverLeftHalf')}/>
      <div className={cx({
        tab: true,
        active: this.props.isActive,
        private: this.props.isPrivate,
        draggingOn: this.state.get('isDraggingOn'),
        dragging: this.state.get('isDragging'),
        'dragging-over': this.state.get('isDraggingOverLeftHalf') ||
          this.state.get('isDraggingOverRightHalf')
      })}
      ref='tab'
      draggable='true'
      title={this.props.frameProps.get('title')}
      style={activeTabStyle}>
      <div className='thumbnail'
        style={thumbnailStyle} />
        <span onClick={this.props.onCloseFrame}
          className='closeTab fa fa-times-circle'/>
        <div className='tabIcon' style={iconStyle}/>
        <div className='tabTitle'>
          {playIcon}
          {this.displayValue}
        </div>
      </div>
      <DragIndicator
        end
        active={this.state.get('isDraggingOverRightHalf')}/>
    </div>
  }
}

class Tabs extends ImmutableComponent {
  constructor () {
    super()
  }

  render () {
    var tabWidth = 100 / this.props.frames.size

    return <div className='tabs'>
      <div className='tabRow'>
        {
        this.props.frames.map(frameProps => <Tab
          frameProps={frameProps}
          key={'tab-' + frameProps.get('key')}
          isActive={this.props.activeFrame === frameProps}
          isPrivate={frameProps.get('isPrivate')}
          tabWidth={tabWidth} />)
        }
      </div>
    </div>
  }
}

module.exports = Tabs
