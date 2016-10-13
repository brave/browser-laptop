const {app, BrowserWindow, session, webContents} = require('electron')
const extensions = process.atomBinding('extension')
const { getIndexHTML } = require('../../js/lib/appUrlUtil')

let currentWebContents = {}
let activeTab = null

const cleanupWebContents = (tabId) => {
  delete currentWebContents[tabId]
}

const tabs = {
  init: () => {
    app.on('web-contents-created', function (event, tab) {
      // TODO(bridiver) - also exclude extension action windows??
      if (extensions.isBackgroundPage(tab) || tab.getURL() === getIndexHTML()) {
        return
      }
      let tabId = tab.getId()
      tab.on('destroyed', cleanupWebContents.bind(null, tabId))
      tab.on('crashed', cleanupWebContents.bind(null, tabId))
      tab.on('close', cleanupWebContents.bind(null, tabId))
      tab.on('set-active', function (evt, active) {
        if (active) {
          activeTab = tab
        }
      })
      currentWebContents[tabId] = tab
    })
  },

  getWebContents: (tabId) => {
    return currentWebContents[tabId]
  },

  create: (createProperties) => {
    return new Promise((resolve, reject) => {
      // TODO(bridiver) - make this available from electron
      var payload = {}
      process.emit('ELECTRON_GUEST_VIEW_MANAGER_NEXT_INSTANCE_ID', payload)
      var guestInstanceId = payload.returnValue

      let win = BrowserWindow.getFocusedWindow()
      let windowId = createProperties.windowId
      if (windowId && windowId !== -2) {
        win = BrowserWindow.fromId(windowId) || win
      }
      if (!win) {
        reject('Could not find a window for new tab')
        return
      }
      let opener = null
      let newSession = session.defaultSession
      let openerTabId = createProperties.openerTabId
      if (openerTabId) {
        opener = tabs.getWebContents(openerTabId)
        if (!opener) {
          reject('Opener does not exist')
          return
        }
        // only use the opener if it is in the same window
        if (opener.webContents.hostWebContents !== win.webContents) {
          reject('Opener must be in the same window as new tab')
          return
        }
      }

      opener = opener || activeTab
      if (opener) {
        newSession = opener.session
      } else {
        reject('Could not find an opener for new tab')
        return
      }

      let webPreferences = {
        isGuest: true,
        embedder: win.webContents,
        session: newSession,
        guestInstanceId,
        delayedLoadUrl: createProperties.url || 'about:newtab'
      }
      webPreferences = Object.assign({}, opener.getWebPreferences(), webPreferences)
      let guest = webContents.create(webPreferences)
      process.emit('ELECTRON_GUEST_VIEW_MANAGER_REGISTER_GUEST', { sender: opener }, guest, guestInstanceId)

      guest.once('did-finish-load', () => {
        resolve(guest)
      })
      let active = createProperties.active !== false
      if (!active) {
        active = createProperties.selected !== false
      }
      let disposition = active ? 'foreground-tab' : 'background-tab'

      process.emit('ELECTRON_GUEST_VIEW_MANAGER_TAB_OPEN',
        { sender: opener }, // event
        'about:blank',
        '',
        disposition,
        { webPreferences: guest.getWebPreferences() })
    })
  }
}

module.exports = tabs
