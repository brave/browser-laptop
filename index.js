'use strict'
const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const electronLocalshortcut = require('electron-localshortcut')

// Report crashes
electron.crashReporter.start()

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null

require('crash-reporter').start()
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
app.on('ready', function () {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 800,
    // Neither a frame nor a titlebar
    // frame: false,
    // A frame but no title bar and windows buttons in titlebar 10.10 OSX and up only?
    //'title-bar-style': 'hidden'
  })
  mainWindow.loadURL('file://' + __dirname + '/public/index.html')
  if (!process.env.PRODUCTION) {
    mainWindow.openDevTools()
  }
  mainWindow.on('closed', function () {
    mainWindow = null
  })

  electronLocalshortcut.register('CmdOrCtrl+L', function () {
    mainWindow.webContents.send('shortcut-focus-url', 1);
  });
})
