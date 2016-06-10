/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const Serializer = require('./serializer')
const messages = require('../constants/messages')
const electron = process.type === 'renderer' ? global.require('electron') : require('electron')
'use strict'

class AppDispatcher {

  constructor () {
    this.callbacks = []
    this.promises = []
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
      const ipc = electron.ipcRenderer
      ipc.send('app-dispatcher-register')
    }
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
   * @param  {object} caller The webContents that triggered the dispatch
   */
  dispatch (payload, caller) {
    if (payload.actionType === undefined) {
      throw new Error('Dispatcher: Undefined action for payload', payload)
    }
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
    this.callbacks.forEach(function (callback, i) {
      // Callback can return an obj, to resolve, or a promise, to chain.
      // See waitFor() for why this might be useful.
      Promise.resolve(callback(payload, caller)).then(function () {
        resolves[i](payload)
      }, function () {
        rejects[i](new Error('Dispatcher callback unsuccessful'))
      })
    })
    this.promises = []

    if (process.type === 'renderer') {
      const ipc = electron.ipcRenderer
      ipc.send(messages.DISPATCH_ACTION, Serializer.serialize(payload))
    }
  }
}

const appDispatcher = new AppDispatcher()

if (process.type !== 'renderer') {
  const electron = require('electron')
  const ipcMain = electron.ipcMain
  ipcMain.on('app-dispatcher-register', (event) => {
    let registrant = event.sender
    const callback = function (payload, caller) {
      try {
        registrant.send(messages.DISPATCH_ACTION, Serializer.serialize(payload), caller ? caller.getId() : -1)
      } catch (e) {
        console.error('unregistering callback', e)
        appDispatcher.unregister(callback)
      }
    }
    event.sender.on('crashed', () => {
      appDispatcher.unregister(callback)
    })
    event.sender.on('destroyed', () => {
      appDispatcher.unregister(callback)
    })
    appDispatcher.register(callback)
  })

  ipcMain.on(messages.DISPATCH_ACTION, (event, payload) => {
    payload = Serializer.deserialize(payload)
    let queryInfo = payload.queryInfo || payload.frameProps || (payload.queryInfo = {})
    queryInfo = queryInfo.toJS ? queryInfo.toJS() : queryInfo
    let sender = event.sender.hostWebContents || event.sender
    let win = require('electron').BrowserWindow.fromWebContents(sender)
    if (win) {
      queryInfo.windowId = queryInfo.windowId || win.id
      queryInfo = Immutable.fromJS(queryInfo)
    }
    if (payload.queryInfo) {
      payload.queryInfo = queryInfo
    } else {
      payload.frameProps = queryInfo
    }
    appDispatcher.dispatch(payload, sender)
  })
}

module.exports = appDispatcher
