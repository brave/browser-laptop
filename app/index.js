'use strict'
const electron = require('electron')
const ipcMain = electron.ipcMain
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const electronLocalshortcut = require('electron-localshortcut')
const Menu = require('./menu')

// Report crashes
electron.crashReporter.start()

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let windows = []

app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

const spawnWindow = () => {
  let mainWindow = new BrowserWindow({
    width: 1360,
    height: 800
    // Neither a frame nor a titlebar
    // frame: false,
    // A frame but no title bar and windows buttons in titlebar 10.10 OSX and up only?
    // 'title-bar-style': 'hidden'
  })
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('file://' + __dirname + '/index-dev.html')
  } else {
    mainWindow.loadURL('file://' + __dirname + '/index.html')
  }
  mainWindow.on('closed', function () {
    var index = windows.indexOf(mainWindow)
    if (index > -1) {
      windows.splice(index, 1)
    }
  })
  return mainWindow
}

app.on('ready', function () {
  windows.push(spawnWindow())

  ipcMain.on('quit-application', () => {
    app.quit()
  })

  ipcMain.on('new-window', () => windows.push(spawnWindow()))
  process.on('new-window', () => windows.push(spawnWindow()))

  ipcMain.on('close-window', () => BrowserWindow.getFocusedWindow().close())
  process.on('close-window', () => BrowserWindow.getFocusedWindow().close())

  // Most of these events will simply be listened to by the app store and acted
  // upon.  However sometimes there are no state changes, for example with focusing
  // the URL bar.  In those cases it's acceptable for the individual components to
  // listen to the events.
  const simpleWebContentEvents = [
    ['CmdOrCtrl+L', 'shortcut-focus-url'],
    ['Escape', 'shortcut-stop'],
    ['Ctrl+Tab', 'shortcut-next-tab'],
    ['Ctrl+Shift+Tab', 'shortcut-prev-tab'],
    ['CmdOrCtrl+R', 'shortcut-reload'],
    ['CmdOrCtrl+=', 'shortcut-zoom-in'],
    ['CmdOrCtrl+-', 'shortcut-zoom-out'],
    ['CmdOrCtrl+0', 'shortcut-zoom-reset'],
    ['CmdOrCtrl+Alt+I', 'shortcut-toggle-dev-tools']
  ]

  simpleWebContentEvents.forEach((shortcutEventName) =>
    electronLocalshortcut.register(shortcutEventName[0], () => {
      BrowserWindow.getFocusedWindow().webContents.send(shortcutEventName[1])
    }))

  electronLocalshortcut.register('CmdOrCtrl+Shift+J', () => {
    BrowserWindow.getFocusedWindow().toggleDevTools()
  })

  Menu.init()
})

