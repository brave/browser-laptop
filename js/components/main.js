/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Immutable = require('immutable')
const electron = global.require('electron')
const ipc = electron.ipcRenderer
const remote = electron.remote

// Actions
const windowActions = require('../actions/windowActions')
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
const LoginRequired = require('./loginRequired')
const ReleaseNotes = require('./releaseNotes')
const BookmarksToolbar = require('./bookmarksToolbar')
const ContextMenu = require('./contextMenu')

// Constants
const config = require('../constants/config')
const appConfig = require('../constants/appConfig')
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
    ipc.on(messages.LEAVE_FULL_SCREEN, () => {
      const activeFrame = FrameStateUtil.getActiveFrame(this.props.windowState)
      if (activeFrame && activeFrame.get('isFullScreen')) {
        windowActions.setFullScreen(activeFrame, false)
      }
    })
  }

  loadOpenSearch () {
    let engine = getSetting(settings.DEFAULT_SEARCH_ENGINE)
    if (this.lastLoadedOpenSearch === undefined || engine !== this.lastLoadedOpenSearch) {
      loadOpenSearch(engine).then(searchDetail => windowActions.setSearchDetail(searchDetail))
      this.lastLoadedOpenSearch = engine
    }
  }

  componentDidUpdate (prevProps) {
    this.loadOpenSearch()
    const activeFrame = FrameStateUtil.getActiveFrame(this.props.windowState)
    const activeFramePrev = FrameStateUtil.getActiveFrame(prevProps.windowState)
    const activeFrameTitle = activeFrame && (activeFrame.get('title') || activeFrame.get('location')) || ''
    const activeFramePrevTitle = activeFramePrev && (activeFramePrev.get('title') || activeFramePrev.get('location')) || ''
    const win = remote.getCurrentWindow()
    if (activeFrameTitle !== activeFramePrevTitle && win) {
      win.setTitle(activeFrameTitle)
    }

    // If the tab changes or was closed, exit out of full screen to give a better
    // picture of what's happening.
    if (activeFramePrev && activeFrame &&
        activeFrame.get('key') !== activeFramePrev.get('key') && activeFramePrev.get('isFullScreen')) {
      windowActions.setFullScreen(activeFramePrev, false)
    }
  }

  componentDidMount () {
    this.registerSwipeListener()
    ipc.on(messages.SHORTCUT_NEW_FRAME, (event, url, options = {}) => {
      if (options.singleFrame) {
        const frameProps = self.props.windowState.get('frames').find(frame => frame.get('location') === url)
        if (frameProps) {
          windowActions.setActiveFrame(frameProps)
          return
        }
      }

      let openInForeground = getSetting(settings.SWITCH_TO_NEW_TABS) === true || options.openInForeground
      windowActions.newFrame({
        location: url || config.defaultUrl,
        isPrivate: !!options.isPrivate,
        isPartitioned: !!options.isPartitioned
      }, openInForeground)
    })

    ipc.on(messages.SHORTCUT_CLOSE_FRAME, (e, i) => typeof i !== 'undefined'
      ? windowActions.closeFrame(self.props.windowState.get('frames'), FrameStateUtil.getFrameByKey(self.props.windowState, i))
      : windowActions.closeFrame(self.props.windowState.get('frames'), FrameStateUtil.getActiveFrame(this.props.windowState)))
    ipc.on(messages.SHORTCUT_UNDO_CLOSED_FRAME, () => windowActions.undoClosedFrame())

    ipc.on(messages.SHORTCUT_CLOSE_OTHER_FRAMES, (e, key, isCloseRight, isCloseLeft) => {
      const currentIndex = FrameStateUtil.getFrameIndex(self.props.windowState, key)
      if (currentIndex === -1) {
        return
      }

      self.props.windowState.get('frames').forEach((frame, i) => {
        if (!frame.get('pinnedLocation') &&
            (i < currentIndex && isCloseLeft || i > currentIndex && isCloseRight)) {
          windowActions.closeFrame(self.props.windowState.get('frames'), frame)
        }
      })
    })

    const self = this
    ipc.on(messages.SHORTCUT_SET_ACTIVE_FRAME_BY_INDEX, (e, i) =>
      windowActions.setActiveFrame(FrameStateUtil.getFrameByIndex(self.props.windowState, i)))

    ipc.on(messages.SHORTCUT_SET_ACTIVE_FRAME_TO_LAST, () =>
      windowActions.setActiveFrame(self.props.windowState.getIn(['frames', self.props.windowState.get('frames').size - 1])))

    ipc.on(messages.BLOCKED_RESOURCE, (e, blockType, details) => {
      const filteredFrameProps = this.props.windowState.get('frames').filter(frame => frame.get('location') === details.firstPartyUrl)
      filteredFrameProps.forEach(frameProps =>
        windowActions.setBlockedBy(frameProps, blockType, details.url))
    })

    ipc.on(messages.HTTPSE_RULE_APPLIED, (e, ruleset, details) => {
      const filteredFrameProps = this.props.windowState.get('frames').filter(frame => frame.get('location') === details.firstPartyUrl)
      filteredFrameProps.forEach(frameProps =>
        windowActions.setRedirectedBy(frameProps, ruleset, details.url))
    })

    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_BACK, this.onBack.bind(this))
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_FORWARD, this.onForward.bind(this))

    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_LOAD_URL, (e, url) => {
      const activeFrame = FrameStateUtil.getActiveFrame(self.props.windowState)
      windowActions.loadUrl(activeFrame, url)
    })

    ipc.on(messages.CERT_ERROR, (e, details) => {
      const frames = self.props.windowState.get('frames').filter(frame => frame.get('location') === details.url)
      frames.forEach(frame => {
        windowActions.setSecurityState(frame, {
          certDetails: details
        })
        windowActions.loadUrl(frame, 'about:certerror')
      })
    })

    ipc.on(messages.SET_SECURITY_STATE, (e, frameKey, securityState) => {
      windowActions.setSecurityState(FrameStateUtil.getFrameByKey(self.props.windowState, frameKey),
                                     securityState)
    })

    ipc.on(messages.LOGIN_REQUIRED, (e, detail) => {
      const frames = self.props.windowState.get('frames').filter(frame => frame.get('location') === detail.url)
      frames.forEach(frame =>
        windowActions.setLoginRequiredDetail(frame, detail))
    })

    ipc.on(messages.CERT_ERROR_REJECTED, (e, previousLocation, frameKey) => {
      windowActions.loadUrl(FrameStateUtil.getFrameByKey(self.props.windowState, frameKey), previousLocation)
    })

    ipc.on(messages.SHOW_USERNAME_LIST, (e, usernames, origin, action, boundingRect) => {
      contextMenus.onShowUsernameMenu(usernames, origin, action, boundingRect)
    })

    ipc.on(messages.HIDE_CONTEXT_MENU, () => {
      windowActions.setContextMenuDetail()
    })

    this.loadOpenSearch()

    window.addEventListener('mousemove', (e) => {
      self.checkForTitleMode(e.pageY)
    })

    const activeFrame = FrameStateUtil.getActiveFrame(self.props.windowState)
    const win = remote.getCurrentWindow()
    if (activeFrame && win) {
      win.setTitle(activeFrame.get('title'))
    }
  }

  checkForTitleMode (pageY) {
    const navigator = document.querySelector('#navigator')
    // Uncaught TypeError: Cannot read property 'getBoundingClientRect' of null
    if (!navigator) {
      return
    }

    const height = navigator.getBoundingClientRect().bottom
    if (pageY <= height && this.props.windowState.getIn(['ui', 'mouseInTitlebar']) !== true) {
      windowActions.setMouseInTitlebar(true)
    } else if (pageY === undefined || pageY > height && this.props.windowState.getIn(['ui', 'mouseInTitlebar']) !== false) {
      windowActions.setMouseInTitlebar(false)
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
    Object.keys(appConfig.resourceNames).forEach((name) => {
      let value = appConfig.resourceNames[name]
      let enabled = this.props.appState.getIn([value, 'enabled'])
      braverySettings[value] = enabled === undefined ? appConfig[value].enabled : enabled
    })
    // whether the current page is bookmarked. needed to re-initialize the
    // application menu.
    braverySettings.bookmarked = this.navBar.bookmarked
    contextMenus.onHamburgerMenu(braverySettings, e)
  }

  onHideSiteInfo () {
    windowActions.setSiteInfoVisible(false)
  }

  onHideReleaseNotes () {
    windowActions.setReleaseNotesVisible(false)
  }

  get enableAds () {
    let enabled = this.props.appState.getIn(['adInsertion', 'enabled'])
    if (enabled === undefined) {
      enabled = appConfig.adInsertion.enabled
    }
    return enabled
  }

  onCloseFrame (activeFrameProps) {
    windowActions.closeFrame(this.props.windowState.get('frames'), this.props.frame)
  }

  onDragOver (e) {
    let intersection = e.dataTransfer.types.filter(x => ['Files'].includes(x))
    if (intersection.length > 0) {
      e.dataTransfer.dropEffect = 'copy'
      e.preventDefault()
    }
  }

  onDrop (e) {
    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.files).forEach(file =>
        windowActions.newFrame({location: file.path, title: file.name}))
    }
  }

  onDoubleClick (e) {
    const win = remote.getCurrentWindow()
    if (!e.target.className.includes('navigatorWrapper')) {
      return
    }
    if (win.isMaximized()) {
      win.maximize()
    } else {
      win.unmaximize()
    }
  }

  onMouseDown (e) {
    let node = e.target
    while (node) {
      if (node.classList && node.classList.contains('contextMenu')) {
        return
      }
      node = node.parentNode
    }
    windowActions.setContextMenuDetail()
  }

  onClickWindow (e) {
    // Check for an ancestor of urlbarForm or urlBarSuggestions and if none are found
    // then set the URL bar as non active (no autocomplete).
    let node = e.target
    while (node) {
      if (node.className === 'urlbarForm' || node.className === 'urlBarSuggestions') {
        return
      }
      node = node.parentNode
    }
    windowActions.setUrlBarActive(false)
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
    const tabsPerPage = getSetting(settings.TABS_PER_TAB_PAGE)
    const showBookmarksToolbar = getSetting(settings.SHOW_BOOKMARKS_TOOLBAR)
    const siteInfoIsVisible = this.props.windowState.getIn(['ui', 'siteInfo', 'isVisible'])
    const releaseNotesIsVisible = this.props.windowState.getIn(['ui', 'releaseNotes', 'isVisible'])
    const shouldAllowWindowDrag = !this.props.windowState.get('contextMenuDetail') &&
      !this.props.windowState.get('bookmarkDetail') &&
      !siteInfoIsVisible &&
      !releaseNotesIsVisible &&
      activeFrame && !activeFrame.getIn(['security', 'loginRequiredDetail'])

    return <div id='window'
        className={cx({
          isFullScreen: activeFrame && activeFrame.get('isFullScreen')
        })}
        ref={node => this.mainWindow = node}
        onMouseDown={this.onMouseDown.bind(this)}
        onClick={this.onClickWindow.bind(this)}>
      { this.props.windowState.get('contextMenuDetail')
        ? <ContextMenu
            contextMenuDetail={this.props.windowState.get('contextMenuDetail')}/> : null }
      <div className='top'>
        <div className='navigatorWrapper'
          onDoubleClick={this.onDoubleClick.bind(this)}
          onDragOver={this.onDragOver.bind(this)}
          onDrop={this.onDrop.bind(this)}>
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
          { siteInfoIsVisible
            ? <SiteInfo frameProps={activeFrame}
                siteInfo={this.props.windowState.getIn(['ui', 'siteInfo'])}
                onHide={this.onHideSiteInfo.bind(this)} /> : null
          }
          { activeFrame && activeFrame.getIn(['security', 'loginRequiredDetail'])
            ? <LoginRequired frameProps={activeFrame}/>
            : null
          }
          { this.props.windowState.get('bookmarkDetail')
            ? <AddEditBookmark sites={this.props.appState.get('sites')}
                currentDetail={this.props.windowState.getIn(['bookmarkDetail', 'currentDetail'])}
                originalDetail={this.props.windowState.getIn(['bookmarkDetail', 'originalDetail'])}
                destinationDetail={this.props.windowState.getIn(['bookmarkDetail', 'destinationDetail'])}
              />
            : null
          }
          { releaseNotesIsVisible
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
          ? <BookmarksToolbar
              draggingOverData={this.props.windowState.getIn(['ui', 'dragging', 'draggingOver', 'dragType']) === dragTypes.BOOKMARK && this.props.windowState.getIn(['ui', 'dragging', 'draggingOver'])}
              shouldAllowWindowDrag={shouldAllowWindowDrag}
              activeFrame={activeFrame}
              windowWidth={this.props.appState.get('defaultWindowWidth')}
              contextMenuDetail={this.props.windowState.get('contextMenuDetail')}
              bookmarks={this.props.appState.get('sites')
                .filter(site => site.get('tags').includes(siteTags.BOOKMARK) || site.get('tags').includes(siteTags.BOOKMARK_FOLDER))
              }/>
          : null }
        <div className={cx({
          tabPages: true,
          allowDragging: shouldAllowWindowDrag,
          singlePage: nonPinnedFrames.size <= tabsPerPage
        })}
          onContextMenu={contextMenus.onTabsToolbarContextMenu.bind(this, activeFrame, undefined)}>
          { nonPinnedFrames.size > tabsPerPage
            ? <TabPages frames={nonPinnedFrames}
                tabsPerTabPage={tabsPerPage}
                tabPageIndex={this.props.windowState.getIn(['ui', 'tabs', 'tabPageIndex'])}
              /> : null }
        </div>
        <TabsToolbar
          paintTabs={getSetting(settings.PAINT_TABS)}
          shouldAllowWindowDrag={shouldAllowWindowDrag}
          draggingOverData={this.props.windowState.getIn(['ui', 'dragging', 'draggingOver', 'dragType']) === dragTypes.TAB && this.props.windowState.getIn(['ui', 'dragging', 'draggingOver'])}
          previewTabs={getSetting(settings.SHOW_TAB_PREVIEWS)}
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
      <div className='mainContainer'>
        <div className='tabContainer'>
        {
          sortedFrames.map(frame =>
            <Frame
              ref={node => this.frames[frame.get('key')] = node}
              prefOpenInForeground={getSetting(settings.SWITCH_TO_NEW_TABS)}
              onCloseFrame={this.onCloseFrame}
              frame={frame}
              key={frame.get('key')}
              settings={frame.get('location') === 'about:preferences' ? settingsState || new Immutable.Map() : null}
              bookmarks={frame.get('location') === 'about:bookmarks'
                ? this.props.appState.get('sites')
                    .filter(site => site.get('tags')
                      .includes(siteTags.BOOKMARK)) || new Immutable.Map()
                : null}
              bookmarkFolders={frame.get('location') === 'about:bookmarks'
                ? this.props.appState.get('sites')
                    .filter(site => site.get('tags')
                      .includes(siteTags.BOOKMARK_FOLDER)) || new Immutable.Map()
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
