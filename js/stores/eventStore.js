/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const AppDispatcher = require('../dispatcher/appDispatcher')
const EventEmitter = require('events').EventEmitter
const Immutable = require('immutable')
const WindowConstants = require('../constants/windowConstants')
const debounce = require('../lib/debounce.js')
const { isSourceAboutUrl } = require('../lib/appUrlUtil')

let eventState = Immutable.fromJS({
  page_load: [],
  page_view: []
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

// Register callback to handle all updates
const doAction = (action) => {
  switch (action.actionType) {
    case WindowConstants.WINDOW_WEBVIEW_LOAD_END:
      if (action.isError || isSourceAboutUrl(action.frameProps.get('src'))) {
        break
      }

      let pageLoadEvent = Immutable.fromJS({
        timestamp: new Date().getTime(),
        url: action.frameProps.get('src')
      })
      eventState = eventState.set('page_load', eventState.get('page_load').push(pageLoadEvent))
      break
    case WindowConstants.WINDOW_SET_FOCUSED_FRAME:
      if (isSourceAboutUrl(action.frameProps.get('src')) ||
          lastActivePageUrl === action.frameProps.get('src')) {
        break
      }

      let pageViewEvent = Immutable.fromJS({
        timestamp: new Date().getTime(),
        url: action.frameProps.get('src')
      })
      eventState = eventState.set('page_view', eventState.get('page_view').push(pageViewEvent))
      lastActivePageUrl = action.frameProps.get('src')
      break
    default:
  }

  emitChanges()
}

AppDispatcher.register(doAction)

module.exports = eventStore
