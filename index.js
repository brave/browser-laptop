const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

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
  mainWindow = new BrowserWindow({width: 1360, height: 800})
  mainWindow.loadURL('file://' + __dirname + '/public/index.html')
  mainWindow.openDevTools()
  mainWindow.on('closed', function () {
    mainWindow = null
  })
})
