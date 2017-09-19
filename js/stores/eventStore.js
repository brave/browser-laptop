/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appConstants = require('../constants/appConstants')
const appDispatcher = require('../dispatcher/appDispatcher')
const AppStore = require('./appStore')
const EventEmitter = require('events').EventEmitter
const Immutable = require('immutable')
const windowConstants = require('../constants/windowConstants')
const debounce = require('../lib/debounce')
const {getWebContents} = require('../../app/browser/webContentsCache')
const {isSourceAboutUrl} = require('../lib/appUrlUtil')
const {responseHasContent} = require('../../app/common/lib/httpUtil')

const electron = require('electron')
const BrowserWindow = electron.BrowserWindow

let eventState = Immutable.fromJS({
  page_load: [],
  page_view: [],
  page_info: []
})

const CHANGE_EVENT = 'change'

class EventStore extends EventEmitter {
  getState () {
    return eventState
  }

  emitChanges () {
    this.emit(CHANGE_EVENT)
  }

  addChangeListener (callback) {
    this.on(CHANGE_EVENT, callback)
  }

  removeChangeListener (callback) {
    this.removeListener(CHANGE_EVENT, callback)
  }
}

const eventStore = new EventStore()
const emitChanges = debounce(eventStore.emitChanges.bind(eventStore), 5)

let lastActivePageUrl = null
let lastActiveTabId = null

const addPageView = (url, tabId) => {
  const tab = getWebContents(tabId)
  const isPrivate = !tab ||
    tab.isDestroyed() ||
    !tab.session.partition.startsWith('persist:')

  if ((url && isSourceAboutUrl(url)) || isPrivate) {
    url = null
  }

  if (lastActivePageUrl === url) {
    return
  }

  let pageViewEvent = Immutable.fromJS({
    timestamp: new Date().getTime(),
    url,
    tabId
  })
  eventState = eventState.set('page_view', eventState.get('page_view').slice(-100).push(pageViewEvent))
  lastActivePageUrl = url
}

const windowBlurred = (windowId) => {
  let windowCount = BrowserWindow.getAllWindows().filter((win) => win.isFocused()).length
  if (windowCount === 0) {
    addPageView(null, null)
  }
}

const windowClosed = (windowId) => {
  let windowCount = BrowserWindow.getAllWindows().length
  let win = BrowserWindow.getFocusedWindow()
  // window may not be closed yet
  if (windowCount > 0 && win && win.id === windowId) {
    win.once('closed', () => {
      windowClosed(windowId)
    })
  }

  if (!win || windowCount === 0) {
    addPageView(null, null)
  }
}

// Register callback to handle all updates
const doAction = (action) => {
  switch (action.actionType) {
    case windowConstants.WINDOW_SET_FOCUSED_FRAME:
      lastActiveTabId = action.frameProps.get('tabId')
      addPageView(action.frameProps.get('location'), lastActiveTabId)
      break
    case appConstants.APP_WINDOW_BLURRED:
      windowBlurred(action.windowId)
      break
    case appConstants.APP_IDLE_STATE_CHANGED:
      if (action.idleState !== 'active') {
        addPageView(null, null)
      } else {
        addPageView(lastActivePageUrl, lastActiveTabId)
      }
      break
    case appConstants.APP_CLOSE_WINDOW:
      appDispatcher.waitFor([AppStore.dispatchToken], () => {
        windowClosed(action.windowId)
      })
      break
    case 'event-set-page-info':
      // retains all past pages, not really sure that's needed... [MTR]
      eventState = eventState.set('page_info', eventState.get('page_info').slice(-100).push(action.pageInfo))
      break
    case windowConstants.WINDOW_GOT_RESPONSE_DETAILS:
      // Only capture response for the page (not subresources, like images, JavaScript, etc)
      if (action.details && action.details.resourceType === 'mainFrame') {
        const pageUrl = action.details.newURL

        // create a page view event if this is a page load on the active tabId
        if (!lastActiveTabId || action.tabId === lastActiveTabId) {
          addPageView(pageUrl, action.tabId)
        }

        const responseCode = action.details.httpResponseCode
        if (isSourceAboutUrl(pageUrl) || !responseHasContent(responseCode)) {
          break
        }

        const pageLoadEvent = Immutable.fromJS({
          timestamp: new Date().getTime(),
          url: pageUrl,
          tabId: action.tabId,
          details: action.details
        })
        eventState = eventState.set('page_load', eventState.get('page_load').slice(-100).push(pageLoadEvent))
      }
      break
    default:
      return
  }

  emitChanges()
}

appDispatcher.register(doAction)

module.exports = eventStore
