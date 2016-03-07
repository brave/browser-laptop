const Immutable = require('immutable')
const EventEmitter = require('events').EventEmitter
const debounce = require('../lib/debounce.js')

let lastEmittedState
const CHANGE_EVENT = 'app-state-change'

class AppStoreRenderer extends EventEmitter {
  constructor () {
    super()
    this.appState = new Immutable.Map()
  }
  emitChanges () {
    if (lastEmittedState !== this.appState) {
      lastEmittedState = this.appState
      this.emit(CHANGE_EVENT)
    }
  }
  set state (appState) {
    this.appState = appState
    emitChanges()
  }
  get state () {
    return this.appState
  }
  addChangeListener (callback) {
    this.on(CHANGE_EVENT, callback)
  }
  removeChangeListener (callback) {
    this.removeListener(CHANGE_EVENT, callback)
  }
}

const appStoreRenderer = new AppStoreRenderer()
const emitChanges = debounce(appStoreRenderer.emitChanges.bind(appStoreRenderer), 5)
module.exports = appStoreRenderer
