const React = require('react')
const ReactDOM = require('react-dom')

const ImmutableComponent = require('./immutableComponent')

const AppActions = require('../actions/appActions')
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
  }

  get displayValue () {
    // YouTube tries to change the title to add a play icon when
    // there is audio. Since we have our own audio indicator we get
    // rid of it.
    return (this.props.frameProps.get('title') ||
    this.props.frameProps.get('location')).replace('▶ ', '')
  }

  onDragStart (e) {
    AppActions.tabDragStart(this.props.frameProps)
  }

  onDragEnd () {
    AppActions.tabDragStop(this.props.frameProps)
  }

  onDragOver (e) {
    e.preventDefault()

    // Otherise, only accept it if we have some frameProps
    if (!this.props.activeDraggedTab) {
      AppActions.tabDraggingOn(this.props.frameProps)
      return
    }

    let rect = ReactDOM.findDOMNode(this.refs.tab).getBoundingClientRect()
    if (e.clientX > rect.left && e.clientX < rect.left + rect.width / 2 &&
      !this.props.frameProps.get('tabIsDraggingOverLeftHalf')) {
      AppActions.tabDragDraggingOverLeftHalf(this.props.frameProps)
    } else if (e.clientX < rect.right && e.clientX >= rect.left + rect.width / 2 &&
      !this.props.frameProps.get('tabIsDraggingOverRightHalf')) {
      AppActions.tabDragDraggingOverRightHalf(this.props.frameProps)
    }
  }

  onDragLeave () {
    if (this.props.frameProps.get('tabIsDraggingOverLeftHalf') ||
      this.props.frameProps.get('tabIsDraggingOn') ||
      this.props.frameProps.get('tabIsDraggingOverLeftHalf')) {
      AppActions.tabDragExit(this.props.frameProps)
    } else if (this.props.frameProps.get('tabIsDraggingOverRightHalf')) {
      AppActions.tabDragExitRightHalf(this.props.frameProps)
    }
  }

  onDrop (e) {
    let sourceFrameProps = this.props.activeDraggedTab
    if (!sourceFrameProps) {
      return
    }

    if (this.props.frameProps.get('tabIsDraggingOverLeftHalf')) {
      AppActions.moveTab(sourceFrameProps, this.props.frameProps, true)
    } else {
      AppActions.moveTab(sourceFrameProps, this.props.frameProps, false)
    }
    AppActions.tabDragExit(this.props.frameProps)
  }

  setActiveFrame () {
    AppActions.setActiveFrame(this.props.frameProps)
  }

  onCloseFrame () {
    AppActions.closeFrame(this.props.frameProps)
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
      <DragIndicator active={this.props.frameProps.get('tabIsDraggingOverLeftHalf')}/>
      <div className={cx({
        tab: true,
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
      style={activeTabStyle}>
      <div className='thumbnail'
        style={thumbnailStyle} />
        <span onClick={this.onCloseFrame.bind(this)}
          className='closeTab fa fa-times-circle'/>
        <div className='tabIcon' style={iconStyle}/>
        <div className='tabTitle'>
          {playIcon}
          {this.displayValue}
        </div>
      </div>
      <DragIndicator
        end
        active={this.props.frameProps.get('tabIsDraggingOverRightHalf')}/>
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
          activeDraggedTab={this.props.tabs.get('activeDraggedTab')}
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
