/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Immutable = require('immutable')
const electron = global.require('electron')
const ipc = electron.ipcRenderer

// Actions
const WindowActions = require('../actions/windowActions')
const loadOpenSearch = require('../lib/openSearch').loadOpenSearch
const contextMenus = require('../contextMenus')
const getSetting = require('../settings').getSetting

// Components
const NavigationBar = require('./navigationBar')
const Frame = require('./frame')
const TabPages = require('./tabPages')
const TabsToolbar = require('./tabsToolbar')
const UpdateBar = require('./updateBar')
const Button = require('./button')
const SiteInfo = require('./siteInfo')
const AddEditBookmark = require('./addEditBookmark')
const ReleaseNotes = require('./releaseNotes')
const BookmarksToolbar = require('./bookmarksToolbar')

// Constants
const Config = require('../constants/config')
const AppConfig = require('../constants/appConfig')
const messages = require('../constants/messages')
const settings = require('../constants/settings')
const siteTags = require('../constants/siteTags')
const dragTypes = require('../constants/dragTypes')

// State handling
const FrameStateUtil = require('../state/frameStateUtil')

// Util
const cx = require('../lib/classSet.js')

class Main extends ImmutableComponent {
  constructor () {
    super()
    this.onCloseFrame = this.onCloseFrame.bind(this)
  }
  registerSwipeListener () {
    // Navigates back/forward on OS X two-finger swipe
    var trackingFingers = false
    var deltaX = 0
    var deltaY = 0
    var startTime = 0

    this.mainWindow.addEventListener('wheel', (e) => {
      if (trackingFingers) {
        deltaX = deltaX + e.deltaX
        deltaY = deltaY + e.deltaY
      }
    })
    ipc.on('scroll-touch-begin', function () {
      trackingFingers = true
      startTime = (new Date()).getTime()
    })
    ipc.on('scroll-touch-end', function () {
      var time = (new Date()).getTime() - startTime
      var xVelocity = deltaX / time
      var yVelocity = deltaY / time
      if (trackingFingers && Math.abs(yVelocity) < 1) {
        if (xVelocity > 4) {
          ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_FORWARD)
        } else if (xVelocity < -4) {
          ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_BACK)
        }
      }
      trackingFingers = false
      deltaX = 0
      deltaY = 0
      startTime = 0
    })
  }

  loadOpenSearch () {
    let engine = getSetting(this.props.appState.get('settings'), settings.DEFAULT_SEARCH_ENGINE)
    if (this.lastLoadedOpenSearch === undefined || engine !== this.lastLoadedOpenSearch) {
      loadOpenSearch(engine).then(searchDetail => WindowActions.setSearchDetail(searchDetail))
      this.lastLoadedOpenSearch = engine
    }
  }

  componentDidUpdate () {
    this.loadOpenSearch()
  }

  componentDidMount () {
    this.registerSwipeListener()
    ipc.on(messages.SHORTCUT_NEW_FRAME, (event, url, options = {}) => {
      if (options.singleFrame) {
        const frameProps = self.props.windowState.get('frames').find(frame => frame.get('location') === url)
        if (frameProps) {
          WindowActions.setActiveFrame(frameProps)
          return
        }
      }

      let openInForeground = getSetting(self.props.appState.get('settings'), settings.SWITCH_TO_NEW_TABS) === true || options.openInForeground
      WindowActions.newFrame({
        location: url || Config.defaultUrl,
        isPrivate: !!options.isPrivate,
        isPartitioned: !!options.isPartitioned
      }, openInForeground)
    })

    ipc.on(messages.SHORTCUT_CLOSE_FRAME, (e, i) => typeof i !== 'undefined'
      ? WindowActions.closeFrame(self.props.windowState.get('frames'), FrameStateUtil.getFrameByKey(self.props.windowState, i))
      : WindowActions.closeFrame(self.props.windowState.get('frames'), FrameStateUtil.getActiveFrame(this.props.windowState)))
    ipc.on(messages.SHORTCUT_UNDO_CLOSED_FRAME, () => WindowActions.undoClosedFrame())

    const self = this
    ipc.on(messages.SHORTCUT_SET_ACTIVE_FRAME_BY_INDEX, (e, i) =>
      WindowActions.setActiveFrame(FrameStateUtil.getFrameByIndex(self.props.windowState, i)))

    ipc.on(messages.SHORTCUT_SET_ACTIVE_FRAME_TO_LAST, () =>
      WindowActions.setActiveFrame(self.props.windowState.getIn(['frames', self.props.windowState.get('frames').size - 1])))

    ipc.on(messages.BLOCKED_RESOURCE, (e, blockType, details) => {
      const filteredFrameProps = this.props.windowState.get('frames').filter(frame => frame.get('location') === details.firstPartyUrl)
      filteredFrameProps.forEach(frameProps =>
        WindowActions.setBlockedBy(frameProps, blockType, details.url))
    })

    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_BACK, this.onBack.bind(this))
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_FORWARD, this.onForward.bind(this))

    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_LOAD_URL, (e, url) => {
      const activeFrame = FrameStateUtil.getActiveFrame(self.props.windowState)
      WindowActions.loadUrl(activeFrame, url)
    })

    this.loadOpenSearch()

    window.addEventListener('mousemove', (e) => {
      self.checkForTitleMode(e.pageY)
    })
  }

  checkForTitleMode (pageY) {
    const navigator = document.querySelector('#navigator')
    // Uncaught TypeError: Cannot read property 'getBoundingClientRect' of null
    if (!navigator) {
      return
    }

    const height = navigator.getBoundingClientRect().bottom
    if (pageY <= height && this.props.windowState.getIn(['ui', 'mouseInTitlebar']) !== true) {
      WindowActions.setMouseInTitlebar(true)
    } else if (pageY === undefined || pageY > height && this.props.windowState.getIn(['ui', 'mouseInTitlebar']) !== false) {
      WindowActions.setMouseInTitlebar(false)
    }
  }

  get activeFrame () {
    return this.frames[this.props.windowState.get('activeFrameKey')]
  }

  onBack () {
    this.activeFrame.goBack()
  }

  onForward () {
    this.activeFrame.goForward()
  }

  onBraveMenu () {
    // TODO
  }

  onHamburgerMenu (e) {
    let braverySettings = {}
    Object.keys(AppConfig.resourceNames).forEach((name) => {
      let value = AppConfig.resourceNames[name]
      let enabled = this.props.appState.getIn([value, 'enabled'])
      braverySettings[value] = enabled === undefined ? AppConfig[value].enabled : enabled
    })
    // whether the current page is bookmarked. needed to re-initialize the
    // application menu.
    braverySettings.bookmarked = this.navBar.bookmarked
    contextMenus.onHamburgerMenu(braverySettings, this.props.appState.get('settings'), e)
  }

  onMainFocus () {
    // When the main container is in focus, set the URL bar to inactive.
    WindowActions.setUrlBarActive(false)
  }

  onHideSiteInfo () {
    WindowActions.setSiteInfoVisible(false)
  }

  onHideReleaseNotes () {
    WindowActions.setReleaseNotesVisible(false)
  }

  get enableAds () {
    let enabled = this.props.appState.getIn(['adInsertion', 'enabled'])
    if (enabled === undefined) {
      enabled = AppConfig.adInsertion.enabled
    }
    return enabled
  }

  onCloseFrame (activeFrameProps) {
    WindowActions.closeFrame(this.props.windowState.get('frames'), this.props.frame)
  }

  render () {
    const comparatorByKeyAsc = (a, b) => a.get('key') > b.get('key')
      ? 1 : b.get('key') > a.get('key') ? -1 : 0

    // Sort frames by key so that the order of the frames do not change which could
    // cause unexpected reloading when a user moves tabs.
    // All frame operations work off of frame keys and not index though so unsorted frames
    // can be passed everywhere other than the Frame elements.
    const sortedFrames = this.props.windowState.get('frames').sort(comparatorByKeyAsc)

    const activeFrame = FrameStateUtil.getActiveFrame(this.props.windowState)

    this.frames = {}
    const settingsState = this.props.appState.get('settings') || new Immutable.Map()
    const nonPinnedFrames = this.props.windowState.get('frames').filter(frame => !frame.get('pinnedLocation'))
    const tabsPerPage = getSetting(settingsState, settings.TABS_PER_TAB_PAGE)
    const showBookmarksToolbar = getSetting(settingsState, settings.SHOW_BOOKMARKS_TOOLBAR)
    const sourceDragTabData = this.props.windowState.getIn(['ui', 'dragging', 'dragType']) === dragTypes.TAB &&
      this.props.windowState.getIn(['ui', 'dragging', 'sourceDragData'])
    return <div id='window' ref={node => this.mainWindow = node}>
      <div className='top'>
        <div className='navigatorWrapper'>
          <div className='backforward'>
            <span data-l10n-id='backButton'
              className='back fa fa-angle-left'
              disabled={!activeFrame || !activeFrame.get('canGoBack')}
              onClick={this.onBack.bind(this)} />
            <span data-l10n-id='forwardButton'
              className='forward fa fa-angle-right'
              disabled={!activeFrame || !activeFrame.get('canGoForward')}
              onClick={this.onForward.bind(this)} />
          </div>
          <NavigationBar
            ref={node => this.navBar = node}
            navbar={activeFrame && activeFrame.get('navbar')}
            frames={this.props.windowState.get('frames')}
            sites={this.props.appState.get('sites')}
            activeFrame={activeFrame}
            mouseInTitlebar={this.props.windowState.getIn(['ui', 'mouseInTitlebar'])}
            searchSuggestions={activeFrame && activeFrame.getIn(['navbar', 'urlbar', 'searchSuggestions'])}
            settings={settingsState}
            searchDetail={this.props.windowState.get('searchDetail')}
          />
          { this.props.windowState.getIn(['ui', 'siteInfo', 'isVisible'])
            ? <SiteInfo frameProps={activeFrame}
                siteInfo={this.props.windowState.getIn(['ui', 'siteInfo'])}
                onHide={this.onHideSiteInfo.bind(this)} /> : null
          }
          { this.props.windowState.get('bookmarkDetail')
            ? <AddEditBookmark sites={this.props.appState.get('sites')}
                currentDetail={this.props.windowState.getIn(['bookmarkDetail', 'currentDetail'])}
                originalDetail={this.props.windowState.getIn(['bookmarkDetail', 'originalDetail'])}/>
            : null
          }
          { this.props.windowState.getIn(['ui', 'releaseNotes', 'isVisible'])
            ? <ReleaseNotes
                metadata={this.props.appState.getIn(['updates', 'metadata'])}
                onHide={this.onHideReleaseNotes.bind(this)} /> : null
          }
          <div className='topLevelEndButtons'>
            <Button iconClass='braveMenu'
              className='navbutton'
              onClick={this.onBraveMenu.bind(this)} />
          </div>
        </div>
        { showBookmarksToolbar
          ? <BookmarksToolbar settings={settingsState}
              sourceDragData={this.props.windowState.getIn(['ui', 'dragging', 'dragType']) === dragTypes.BOOKMARK && this.props.windowState.getIn(['ui', 'dragging', 'sourceDragData'])}
              draggingOverData={this.props.windowState.getIn(['ui', 'dragging', 'draggingOver', 'dragType']) === dragTypes.BOOKMARK && this.props.windowState.getIn(['ui', 'dragging', 'draggingOver'])}
              activeFrame={activeFrame}
              bookmarks={this.props.appState.get('sites')
                .filter(site => site.get('tags').includes(siteTags.BOOKMARK) || site.get('tags').includes(siteTags.BOOKMARK_FOLDER))
              }/>
          : null }
        <div className={cx({
          tabPages: true,
          singlePage: nonPinnedFrames.size <= tabsPerPage
        })}
          onContextMenu={contextMenus.onTabsToolbarContextMenu.bind(this, settingsState, activeFrame)}>
          { nonPinnedFrames.size > tabsPerPage
            ? <TabPages frames={nonPinnedFrames}
                sourceDragData={sourceDragTabData}
                tabsPerTabPage={tabsPerPage}
                tabPageIndex={this.props.windowState.getIn(['ui', 'tabs', 'tabPageIndex'])}
              /> : null }
        </div>
        <TabsToolbar
          paintTabs={getSetting(settingsState, settings.PAINT_TABS)}
          sourceDragData={sourceDragTabData}
          draggingOverData={this.props.windowState.getIn(['ui', 'dragging', 'draggingOver', 'dragType']) === dragTypes.TAB && this.props.windowState.getIn(['ui', 'dragging', 'draggingOver'])}
          previewTabs={getSetting(settingsState, settings.SHOW_TAB_PREVIEWS)}
          settings={settingsState}
          tabsPerTabPage={tabsPerPage}
          tabs={this.props.windowState.getIn(['ui', 'tabs'])}
          frames={this.props.windowState.get('frames')}
          sites={this.props.appState.get('sites')}
          key='tab-bar'
          activeFrame={activeFrame}
          onMenu={this.onHamburgerMenu.bind(this)}
        />
        <UpdateBar updates={this.props.appState.get('updates')} />
      </div>
      <div className='mainContainer'
        onFocus={this.onMainFocus.bind(this)}>
        <div className='tabContainer'>
        {
          sortedFrames.map(frame =>
            <Frame
              ref={node => this.frames[frame.get('key')] = node}
              prefOpenInForeground={getSetting(settingsState, settings.SWITCH_TO_NEW_TABS)}
              onCloseFrame={this.onCloseFrame}
              frame={frame}
              key={frame.get('key')}
              settings={frame.get('location') === 'about:preferences' ? settingsState || new Immutable.Map() : null}
              bookmarks={frame.get('location') === 'about:bookmarks'
                ? this.props.appState.get('sites')
                    .filter(site => site.get('tags')
                      .includes(siteTags.BOOKMARK)) || new Immutable.Map()
                : null}
              enableAds={this.enableAds}
              isPreview={frame.get('key') === this.props.windowState.get('previewFrameKey')}
              isActive={FrameStateUtil.isFrameKeyActive(this.props.windowState, frame.get('key'))}
            />)
        }
        </div>
      </div>
    </div>
  }
}

module.exports = Main
