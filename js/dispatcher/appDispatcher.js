/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const async = require('async')
const Serializer = require('./serializer')
const messages = require('../constants/messages')
let ipc
let processType
let currentWindow
let BrowserWindow

if (typeof window !== 'undefined' && window.location.protocol === 'chrome-extension:' && typeof chrome !== 'undefined' && typeof chrome.ipcRenderer === 'object') {
  processType = 'extension-page'
  ipc = chrome.ipcRenderer // eslint-disable-line
} else if (typeof process !== 'undefined') {
  if (process.type === 'renderer') {
    processType = 'renderer'
    ipc = require('electron').ipcRenderer
    currentWindow = require('../../app/renderer/currentWindow')
  } else if (process.type === 'browser') {
    processType = 'browser'
    BrowserWindow = require('electron').BrowserWindow
    ipc = require('electron').ipcMain
  }
} else if (typeof chrome !== 'undefined' && typeof chrome.ipcRenderer === 'object') {
  throw new Error('No ipc available in context')
}

class AppDispatcher {
  constructor () {
    this.callbacks = []
    this.promises = []
    this.dispatching = false
    this.dispatch = this.dispatch.bind(this)
  }

  /**
   * Register a Store's callback so that it may be invoked by an action.
   * If the registrant is a renderer process the callback will be stored
   * locally and an `app-dispatcher-register` message will be sent to the
   * main process using IPC.
   * @param {function} callback The callback to be registered.
   * @return {number} The index of the callback within the _callbacks array.
   */
  register (callback) {
    if (process.type === 'renderer') {
      ipc.send('app-dispatcher-register')
    }
    return this.registerLocalCallback(callback)
  }

  /**
   * Same as above, but registers the specified callback
   * locally only.  This is used by the windowStore since
   * the store process is registered as soon as the window
   * is created.
   */
  registerLocalCallback (callback) {
    this.callbacks.push(callback)
    return this.callbacks.length - 1 // index
  }

  unregister (callback) {
    const index = this.callbacks.indexOf(callback)
    if (index !== -1) {
      this.callbacks.splice(index, 1)
    }
  }

  /**
   * dispatch
   * Dispatches registered callbacks. If `dispatch` is called from the main process
   * it will run all the registered callbacks. If `dispatch` is called from a renderer
   * process it will run any local registered callbacks and then send messages.DISPATCH_ACTION
   * to the main process where the all other registered callbacks will be run. The main
   * process will not run any callbacks for the renderer process that send messages.DISPATCH_ACTION
   * @param  {object} payload The data from the action.
   */
  dispatch (payload) {
    if (payload.actionType === undefined) {
      throw new Error('Dispatcher: Undefined action for payload', payload)
    }

    if (this.dispatching) {
      dispatchCargo.push(payload)
    } else {
      this.dispatching = true
      setImmediate(this.dispatchInternal.bind(this, payload, doneDispatching))
    }
  }

  dispatchToOwnRegisteredCallbacks (payload) {
    // First create array of promises for callbacks to reference.
    const resolves = []
    const rejects = []
    this.promises = this.callbacks.map(function (_, i) {
      return new Promise(function (resolve, reject) {
        resolves[i] = resolve
        rejects[i] = reject
      })
    })
    // Dispatch to callbacks and resolve/reject promises.
    this.callbacks.forEach((callback, i) => {
      callback(payload)
      resolves[i](payload)
    })
    this.promises = []
  }

  dispatchInternal (payload, cb) {
    if (processType === 'extension-page') {
      cb()
      ipcCargo.push(payload)
      return
    }
    if (processType === 'renderer') {
      // only handle actions that are for this window
      if (!payload.queryInfo || payload.queryInfo.windowId == null || payload.queryInfo.windowId === currentWindow.getCurrentWindowId()) {
        this.dispatchToOwnRegisteredCallbacks(payload)
      }
      // only forward actions that have not been relayed through the browser process
      if (!payload.sentFromBrowser) {
        cb()
        ipcCargo.push(payload)
      }
      return
    }

    this.dispatchToOwnRegisteredCallbacks(payload)
    cb()
  }

  waitFor (promiseIndexes, callback) {
    const selectedPromises = promiseIndexes.map((index) => this.promises[index])
    return Promise.all(selectedPromises).then(callback)
  }

  shutdown () {
    appDispatcher.dispatch = (payload) => {}
  }

  registerWindow (registrant, hostWebContents) {
    const win = BrowserWindow.fromWebContents(hostWebContents)
    const windowId = win.id

    const registrantCargo = async.cargo((tasks, callback) => {
      if (!registrant.isDestroyed()) {
        registrant.send(messages.DISPATCH_ACTION, Serializer.serialize(tasks))
      }
      callback()
    }, 20)

    // If the window isn't ready yet then wait until it is ready before delivering
    // messages to it.
    if (!win.__ready) {
      registrantCargo.pause()
      win.on(messages.WINDOW_RENDERER_READY, () => {
        registrantCargo.resume()
      })
    }

    const callback = function (payload) {
      try {
        if (registrant.isDestroyed()) {
          appDispatcher.unregister(callback)
        } else {
          // don't forward to windows unless queryInfo exists
          if (!payload.queryInfo) {
            return
          }

          // don't forward messages from other windows unless they have a windowId
          if (payload.queryInfo.windowId == null && payload.senderWindowId != null) {
            return
          }

          // only forward to the destination windowId and only if it wasn't the sender
          if (payload.queryInfo.windowId != null) {
            if (payload.queryInfo.windowId !== windowId || payload.senderWindowId === windowId) {
              return
            }
          }
          payload.sentFromBrowser = true
          registrantCargo.push(payload)
        }
      } catch (e) {
        appDispatcher.unregister(callback)
      }
    }
    registrant.on('crashed', () => {
      appDispatcher.unregister(callback)
    })
    registrant.on('destroyed', () => {
      appDispatcher.unregister(callback)
    })
    appDispatcher.register(callback)
  }
}

const appDispatcher = new AppDispatcher()

const doneDispatching = () => {
  if (dispatchCargo.idle()) {
    appDispatcher.dispatching = false
  }
}

const dispatchCargo = async.cargo((task, callback) => {
  for (let i = 0; i < task.length; i++) {
    appDispatcher.dispatchInternal(task[i], () => {})
  }
  callback()
  doneDispatching()
}, 200)

const ipcCargo = async.cargo((tasks, callback) => {
  ipc.send(messages.DISPATCH_ACTION, Serializer.serialize(tasks))
  callback()
}, 200)

if (processType === 'browser') {
  ipc.on('app-dispatcher-register', (event) => {
    const registrant = event.sender
    const hostWebContents = event.sender.hostWebContents || event.sender
    appDispatcher.registerWindow(registrant, hostWebContents)
  })

  const dispatchEventPayload = (event, payload) => {
    let queryInfo = payload.queryInfo || payload.frameProps || (payload.queryInfo = {})
    queryInfo = queryInfo.toJS ? queryInfo.toJS() : queryInfo
    let sender = event.sender
    if (!sender.isDestroyed()) {
      const hostWebContents = sender.hostWebContents
      sender = hostWebContents || sender
      const win = BrowserWindow.fromWebContents(sender)

      if (hostWebContents) {
        // received from an extension
        // only extension messages will have a hostWebContents
        // because other messages come from the main window

        // default to the windowId of the hostWebContents
        if (queryInfo.windowId == null && win) {
          queryInfo.windowId = win.id
        }
      } else if (win) {
        // don't set the senderWindowId for tabs because it will prevent them
        // from being routed back to the window process
        payload.senderWindowId = win.id
      }
      payload.queryInfo = queryInfo
      payload.tabId = payload.tabId == null ? event.sender.getId() : payload.tabId

      if (queryInfo.windowId === -2) {
        const activeWindow = BrowserWindow.getActiveWindow()
        queryInfo.windowId = activeWindow ? activeWindow.id : undefined
      }
    }
    appDispatcher.dispatch(payload)
  }

  process.on(messages.DISPATCH_ACTION, (action) => {
    appDispatcher.dispatch(action)
  })

  ipc.on(messages.DISPATCH_ACTION, (event, payload) => {
    payload = Serializer.deserialize(payload)

    if (payload.forEach === undefined) {
      dispatchEventPayload(event, payload)
    }

    for (let i = 0; i < payload.length; i++) {
      dispatchEventPayload(event, payload[i])
    }
  })
} else if (processType === 'renderer') {
  ipc.on(messages.DISPATCH_ACTION, (e, serializedPayload) => {
    let payload = Serializer.deserialize(serializedPayload)
    for (let i = 0; i < payload.length; i++) {
      appDispatcher.dispatch(payload[i])
    }
  })
}

module.exports = appDispatcher
