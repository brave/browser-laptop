/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Serializer = require('./serializer')
const messages = require('../constants/messages')
const electron = process.type === 'renderer' ? global.require('electron') : require('electron')
const uuid = require('uuid').v4

'use strict'

const serializePayload = (payload, dispatchId = null) => {
  if (dispatchId && !payload.dispatchId) {
    payload.dispatchId = dispatchId
  }
  return Serializer.serialize(payload)
}

class AppDispatcher {

  constructor () {
    this.callbacks = {}
    this.promises = {}
    this.notifyOnDispatchCompleteFn = null
  }

  /**
   * Register a Store's callback so that it may be invoked by an action.
   * If the registrant is a renderer process the callback will be stored
   * locally and an `app-dispatcher-register` message will be sent to the
   * main process using IPC.
   * @param {function} callback The callback to be registered.
   * @return {number} The index of the callback within the _callbacks array.
   */
  register (callback, token = uuid()) {
    if (process.type === 'renderer') {
      const ipc = electron.ipcRenderer
      ipc.send('app-dispatcher-register', token)
    }
    this.callbacks[token] = callback
    return token
  }

  unregister (token) {
    if (process.type === 'renderer') {
      const ipc = electron.ipcRenderer
      ipc.send('app-dispatcher-unregister', token)
    }
    delete this.callbacks[token]
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

    // First create map of promises for callbacks to reference.
    const resolves = {}
    const rejects = {}
    for (var token in this.callbacks) {
      this.promises[token] = new Promise(function (resolve, reject) {
        resolves[token] = resolve
        rejects[token] = reject
      })
    }

    let dispatchId = uuid()

    if (this.notifyOnDispatchCompleteFn && process.type === 'renderer') {
      let cb = this.notifyOnDispatchCompleteFn
      const ipc = electron.ipcRenderer
      // wait for all the local handlers
      let dispatchedCallback = (evt, dispatchedActionId) => {
        // in the renderer process we only have to wait
        // for the main process
        if (dispatchId === dispatchedActionId) {
          this.waitFor(Object.keys(this.promises), cb)
          ipc.removeListener('app-dispatcher-action-dispatched', dispatchedCallback)
        }
      }
      ipc.on('app-dispatcher-action-dispatched', dispatchedCallback)
    }

    // Dispatch to callbacks and resolve/reject promises.
    for (token in this.callbacks) {
      let callback = this.callbacks[token]
      // Callback can return an obj, to resolve, or a promise, to chain.
      // See waitFor() for why this might be useful.
      Promise.resolve(callback(payload)).then(function () {
        resolves[token](payload)
      }, function () {
        rejects[token](new Error('Dispatcher callback unsuccessful'))
      })
    }

    if (process.type === 'renderer') {
      const ipc = electron.ipcRenderer
      ipc.send(messages.DISPATCH_ACTION, serializePayload(payload, dispatchId), !!this.notifyOnDispatchCompleteFn)
    }

    this.promises = {}

    return dispatchId
  }

  notifyOnDispatchComplete (fn, cb) {
    this.notifyOnDispatchCompleteFn = cb
    const returnVal = fn()
    this.notifyOnDispatchCompleteFn = null
    return returnVal
  }

  waitFor (promiseIndexes, callback) {
    var selectedPromises = promiseIndexes.map((index) => this.promises[index])
    return Promise.all(selectedPromises).then(callback)
  }
}

const appDispatcher = new AppDispatcher()

if (process.type === 'browser') {
  const electron = require('electron')
  const ipcMain = electron.ipcMain
  ipcMain.on('app-dispatcher-unregister', (event, token) => {
    appDispatcher.unregister(token)
  })
  ipcMain.on('app-dispatcher-register', (event, token) => {
    let registrant = event.sender
    const callback = function (payload) {
      try {
        if (registrant.isDestroyed()) {
          appDispatcher.unregister(token)
        } else {
          registrant.send(messages.DISPATCH_ACTION, serializePayload(payload))
        }
      } catch (e) {
        console.error('unregistering callback', e)
        appDispatcher.unregister(token)
      }
    }
    event.sender.on('crashed', () => {
      appDispatcher.unregister(token)
    })
    event.sender.on('destroyed', () => {
      appDispatcher.unregister(token)
    })
    appDispatcher.register(callback, token)
  })

  ipcMain.on(messages.DISPATCH_ACTION, (event, payload, notifyOnDispatchComplete) => {
    payload = Serializer.deserialize(payload)

    let queryInfo = payload.queryInfo || payload.frameProps || (payload.queryInfo = {})
    queryInfo = queryInfo.toJS ? queryInfo.toJS() : queryInfo
    let sender = event.sender
    if (event.sender.hostWebContents) {
      sender = event.sender.hostWebContents
      // received from an extension
      // only extension messages will have a hostWebContents
      let win = require('electron').BrowserWindow.fromWebContents(sender)
      // default to the windowId of the hostWebContents
      queryInfo.windowId = queryInfo.windowId || win.id
      // add queryInfo if we only had frameProps before
      payload.queryInfo = queryInfo

      appDispatcher.dispatch(payload, sender)
    } else {
      // received from a browser window
      if (event.sender.id !== queryInfo.windowId) {
        appDispatcher.dispatch(payload, sender)
      }
    }
    if (notifyOnDispatchComplete && payload.dispatchId) {
      sender.send('app-dispatcher-action-dispatched', payload.dispatchId)
    }
  })
}

module.exports = appDispatcher
