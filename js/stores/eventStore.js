/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const AppConstants = require('../constants/appConstants')
const AppDispatcher = require('../dispatcher/appDispatcher')
const AppStore = require('./appStore')
const EventEmitter = require('events').EventEmitter
const Immutable = require('immutable')
const WindowConstants = require('../constants/windowConstants')
const debounce = require('../lib/debounce.js')
const { isSourceAboutUrl } = require('../lib/appUrlUtil')

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

const addPageView = (url) => {
  if (url && isSourceAboutUrl(url)) {
    url = null
  }

  if (lastActivePageUrl === url) {
    return
  }

  let pageViewEvent = Immutable.fromJS({
    timestamp: new Date().getTime(),
    url
  })
  eventState = eventState.set('page_view', eventState.get('page_view').push(pageViewEvent))
  lastActivePageUrl = url
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
    addPageView(null)
  }
}

// Register callback to handle all updates
const doAction = (action) => {
  switch (action.actionType) {
    case WindowConstants.WINDOW_WEBVIEW_LOAD_END:
      // create a page view event if this is a page load on the active tabId
      if (!lastActiveTabId || action.frameProps.get('tabId') === lastActiveTabId) {
        addPageView(action.frameProps.get('location'))
      }

      if (action.isError || isSourceAboutUrl(action.frameProps.get('location'))) {
        break
      }

      let pageLoadEvent = Immutable.fromJS({
        timestamp: new Date().getTime(),
        url: action.frameProps.get('location')
      })
      eventState = eventState.set('page_load', eventState.get('page_load').push(pageLoadEvent))
      break
    case WindowConstants.WINDOW_SET_FOCUSED_FRAME:
      addPageView(action.frameProps.get('location'))
      lastActiveTabId = action.frameProps.get('tabId')
      break
    case AppConstants.APP_CLOSE_WINDOW:
      AppDispatcher.waitFor([AppStore.dispatchToken], () => {
        windowClosed(action.appWindowId)
      })
      break
    case 'event-set-page-info':
      // retains all past pages, not really sure that's needed... [MTR]
      eventState = eventState.set('page_info', eventState.get('page_info').push(action.pageInfo))
      break
    default:
  }

  emitChanges()
}

AppDispatcher.register(doAction)

module.exports = eventStore
