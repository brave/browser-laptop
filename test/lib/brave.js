/* globals devTools */
var Application = require('spectron').Application
var chai = require('chai')
const Immutable = require('immutable')
const {activeWebview, navigator, titleBar, urlInput} = require('./selectors')
require('./coMocha')
const series = require('async/series')

const path = require('path')
const fs = require('fs-extra')
const os = require('os')
const {getTargetAboutUrl, isSourceAboutUrl, getBraveExtIndexHTML} = require('../../js/lib/appUrlUtil')

var chaiAsPromised = require('chai-as-promised')
chai.should()
chai.use(chaiAsPromised)

const Server = require('./server')

// toggle me for more verbose logs! :)
const logVerboseEnabled = process.env.BRAVE_TEST_ALL_LOGS || process.env.BRAVE_TEST_COMMAND_LOGS
const logVerbose = (string, ...rest) => {
  if (logVerboseEnabled) {
    console.log(string, ...rest)
  }
}

const generateUserDataDir = () => {
  return process.env.BRAVE_USER_DATA_DIR || path.join(os.tmpdir(), 'brave-test', (new Date().getTime()) + Math.floor(Math.random() * 1000).toString())
}

const rmDir = (dirPath) => {
  try {
    var files = fs.readdirSync(dirPath)
  } catch (e) {
    console.error(e)
    return
  }
  if (files.length > 0) {
    for (var i = 0; i < files.length; i++) {
      var filePath = path.join(dirPath, files[i])
      try {
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath)
        } else {
          rmDir(filePath)
        }
      } catch (e) {
        console.warn(e)
      }
    }
  }
  try {
    fs.removeSync(dirPath)
  } catch (e) {
    console.error(e)
  }
}

const handleTypedText = (prevValue, text) => {
  if (typeof text === 'string') {
    return `${prevValue}${text}`
  } else {
    for (let val of text) {
      prevValue = executeType(prevValue, val)
    }

    return prevValue
  }
}

const executeType = (current, next) => {
  switch (next) {
    case exports.keys.BACKSPACE:
      current = current.slice(0, -1)
      break
    case exports.keys.END:
      break
    default:
      current += next
      break
  }

  return current
}

var promiseMapSeries = function (array, iterator) {
  var length = array.length
  var current = Promise.resolve()
  var results = new Array(length)

  for (var i = 0; i < length; ++i) {
    current = results[i] = current.then(function (i) {
      return iterator(array[i])
    }.bind(undefined, i))
  }
  return Promise.all(results)
}

let userDataDir = generateUserDataDir()
var exports = {
  keys: {
    COMMAND: '\ue03d',
    CONTROL: '\ue009',
    ESCAPE: '\ue00c',
    RETURN: '\ue006',
    ENTER: '\ue007',
    SHIFT: '\ue008',
    BACKSPACE: '\ue003',
    DELETE: '\ue017',
    LEFT: '\ue012',
    RIGHT: '\ue014',
    DOWN: '\ue015',
    UP: '\ue013',
    PAGEDOWN: '\uE00F',
    END: '\uE010',
    TAB: '\ue004',
    NULL: '\uE000'
  },

  defaultTimeout: 10000,
  defaultInterval: 100,

  browserWindowUrl: getBraveExtIndexHTML(),
  newTabUrl: 'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/about-newtab.html',
  fixtureUrl: function (filename) {
    return 'file://' + path.resolve(__dirname, '..', 'fixtures', filename)
  },

  beforeAllServerSetup: function (context) {
    context.beforeAll(function (done) {
      if (exports.server) {
        return
      }

      Server.create(`${__dirname}/../fixtures/`, (err, _server) => {
        if (err) {
          console.error(err.stack)
        }
        exports.server = _server
        done()
      })
    })

    context.afterAll(function () {
      if (!exports.server) {
        return
      }

      exports.server.stop()
      exports.server = null
    })
  },

  beforeAll: function (context) {
    context.timeout(30000)
    context.beforeAll(function () {
      return exports.startApp.call(this)
    })

    // define ipc send/on
    context.beforeAll(function () {
      exports.addCommands.call(this)
    })

    context.afterAll(function () {
      return exports.stopApp.call(this)
    })

    exports.beforeAllServerSetup(context)

    context.beforeEach(function () {
      chaiAsPromised.transferPromiseness = this.app.client.transferPromiseness
    })
  },

  beforeEach: function (context) {
    context.timeout(30000)

    exports.beforeAllServerSetup(context)

    context.beforeEach(function () {
      return exports.startApp.call(this)
    })

    // define ipc send/on
    context.beforeEach(function () {
      exports.addCommands.call(this)
    })

    context.beforeEach(function () {
      chaiAsPromised.transferPromiseness = this.app.client.transferPromiseness
    })

    context.afterEach(function () {
      return exports.stopApp.call(this, context.cleanSessionStoreAfterEach)
    })
  },

  addCommands: function () {
    const app = this.app
    const initialized = []

    this.app.client.addCommand('ipcSend', function (message, ...param) {
      logVerbose('ipcSend(' + message + ', "' + param + '")')
      return this.execute(function (message, ...param) {
        return devTools('electron').remote.getCurrentWindow().webContents.send(message, ...param)
      }, message, ...param).then((response) => response.value)
    })

    this.app.client.addCommand('maximize', function () {
      logVerbose('maximize()')
      return this.execute(function () {
        return devTools('electron').remote.getCurrentWindow().maximize()
      }).then((response) => response.value)
    })

    this.app.client.addCommand('unmaximize', function () {
      logVerbose('unmaximize()')
      return this.execute(function () {
        return devTools('electron').remote.getCurrentWindow().unmaximize()
      }).then((response) => response.value)
    })

    this.app.client.addCommand('ipcSendRenderer', function (message, ...param) {
      logVerbose('ipcSendRenderer(' + message + ')')
      return this.execute(function (message, ...param) {
        return devTools('electron').ipcRenderer.send(message, ...param)
      }, message, ...param).then((response) => response.value)
    })

    this.app.client.addCommand('ipcSendRendererSync', function (message, ...param) {
      logVerbose('ipcSendRenderer(' + message + ')')
      return this.execute(function (message, ...param) {
        return devTools('electron').ipcRenderer.sendSync(message, ...param)
      }, message, ...param)
    })

    var windowOrig = this.app.client.window
    Object.getPrototypeOf(this.app.client).window = function (handle) {
      if (!initialized.includes(handle)) {
        initialized.push(handle)
        return windowOrig.apply(this, [handle]).call(() => {
          return app.api.initialize().then(() => true, () => true)
        }).then(() => windowOrig.apply(this, [handle]))
      } else {
        return windowOrig.apply(this, [handle])
      }
    }

    var windowHandlesOrig = this.app.client.windowHandles
    Object.getPrototypeOf(this.app.client).windowHandles = function () {
      return windowHandlesOrig.apply(this)
        .then(function (response) {
          var handles = response.value
          return promiseMapSeries(handles, (handle) => {
            return this.window(handle).getUrl().catch((err) => {
              console.error('Error retreiving window handle ' + handle, err)
              return ''
            })
          }).then((urls) => {
            var newHandles = []
            for (var i = 0; i < urls.length; i++) {
              // ignore extension urls unless they are "about" pages
              // if (!(urls[i].startsWith('chrome-extension') && !urls[i].match(/about-.*\.html$/))) {
              if (urls[i].startsWith(exports.browserWindowUrl)) {
                newHandles.push(handles[i])
              }
            }
            response.value = newHandles
            return response
          })
        })
    }

    this.app.client.addCommand('tabHandles', function () {
      logVerbose('tabHandles()')
      return windowHandlesOrig.apply(this)
        .then(function (response) {
          var handles = response.value
          return promiseMapSeries(handles, (handle) => {
            return this.window(handle).getUrl().catch((err) => {
              console.error('Error retrieving window handle ' + handle, err)
              return ''
            })
          }).then((urls) => {
            var newHandles = []
            for (var i = 0; i < urls.length; i++) {
              // ignore extension urls unless they are "about" pages
              if (!(urls[i].startsWith('chrome-extension') && !urls[i].match(/about-.*\.html(#.*)?$/)) &&
                  // ignore window urls
                  !urls[i].startsWith('chrome://brave')) {
                newHandles.push(handles[i])
              }
            }
            response.value = newHandles
            return response
          })
        })
    })

    this.app.client.addCommand('tabByIndex', function (index) {
      logVerbose('tabByIndex(' + index + ')')
      return this.tabHandles().then((response) => response.value).then(function (handles) {
        logVerbose('tabHandles() => handles.length = ' + handles.length + '; handles[' + index + '] = "' + handles[index] + '";')
        return this.window(handles[index])
      })
    })

    this.app.client.addCommand('getTabCount', function () {
      logVerbose('getTabCount()')
      return this.tabHandles().then((response) => response.value).then(function (handles) {
        logVerbose('getTabCount() => ' + handles.length)
        return handles.length
      })
    })

    this.app.client.addCommand('waitForBrowserWindow', function () {
      logVerbose('waitForBrowserWindow()')
      return this.waitUntil(function () {
        return this.windowByUrl(exports.browserWindowUrl).then((response) => {
          logVerbose('waitForBrowserWindow() => ' + JSON.stringify(response))
          return response
        }, () => {
          logVerbose('waitForBrowserWindow() => false')
          return false
        })
      }, 5000, null, 100)
    })

    this.app.client.addCommand('activateTitleMode', function () {
      logVerbose('activateTitleMode()')
      return this
        .setMouseInTitlebar(false)
        .moveToObject(activeWebview)
        .waitForVisible(titleBar)
    })

    this.app.client.addCommand('activateURLMode', function () {
      logVerbose('activateURLMode()')
      return this
        .setMouseInTitlebar(true)
        .moveToObject(navigator)
        .waitForVisible(urlInput)
    })

    this.app.client.addCommand('waitForUrl', function (url, timeout = 5000, interval = 100) {
      logVerbose('waitForUrl("' + url + '")')
      return this.waitUntil(function () {
        return this.tabByUrl(url).then((response) => {
          logVerbose('tabByUrl("' + url + '") => ' + JSON.stringify(response))
          return response
        }, () => {
          logVerbose('tabByUrl("' + url + '") => false')
          return false
        })
      }, timeout, null, interval)
    })

    this.app.client.addCommand('waitForSelectedText', function (text) {
      logVerbose('waitForSelectedText("' + text + '")')
      return this.waitUntil(function () {
        return this.getSelectedText(text).then((value) => { return value === text })
      }, 5000, null, 100)
    })

    this.app.client.addCommand('waitForTextValue', function (selector, text) {
      logVerbose('waitForSelectedText("' + selector + '", "' + text + '")')
      return this
        .waitForVisible(selector)
        .waitUntil(function () {
          return this.getText(selector).then((value) => {
            logVerbose('waitForTextValue("' + selector + '", ' + text + ') => ' + value)
            return value === text
          })
        }, 5000, null, 100)
    })

    this.app.client.addCommand('waitForTabCount', function (tabCount) {
      logVerbose('waitForTabCount(' + tabCount + ')')
      return this.waitUntil(function () {
        return this.getTabCount().then((count) => {
          logVerbose(`waitForTabCount(${tabCount}) => ${count}`)
          return count === tabCount
        })
      }, 5000, null, 100)
    })

    this.app.client.addCommand('waitForWindowCount', function (windowCount) {
      logVerbose('waitForWindowCount(' + windowCount + ')')
      return this.waitUntil(function () {
        return this.getWindowCount().then((count) => {
          return count === windowCount
        })
      })
    })

    this.app.client.addCommand('waitForAddressCount', function (addressCount) {
      logVerbose('waitForAddressCount(' + addressCount + ')')
      return this.waitUntil(function () {
        return this.getAppState().then((val) => {
          const ret = (val.value && val.value && val.value.autofill &&
            val.value.autofill.addresses && val.value.autofill.addresses.guid.length) || 0
          logVerbose('waitForAddressCount(' + addressCount + ') => ' + ret)
          return ret
        })
      }, 5000, null, 100)
    })

    this.app.client.addCommand('waitForTab', function (props) {
      logVerbose('waitForTab(' + JSON.stringify(props) + ')')
      return this.waitUntil(function () {
        return this.getAppState().then((val) => {
          const tabs = val && val.value && val.value.tabs
          if (!tabs) {
            return false
          }
          return tabs.reduce((tabAcc, tab) =>
            tabAcc || Object.keys(props).reduce((acc, prop) =>
              acc && tab[prop] === props[prop], true), false)
        })
      }, 5000, null, 100)
    })

    this.app.client.addCommand('waitForElementCount', function (selector, count) {
      logVerbose('waitForElementCount("' + selector + '", ' + count + ')')
      return this.waitUntil(function () {
        return this.elements(selector).then((res) => {
          logVerbose('waitForElementCount("' + selector + '", ' + count + ') => ' + res.value.length)
          return res.value.length === count
        })
      }, 5000, null, 100)
    })

    this.app.client.addCommand('waitForResourceReady', function (resourceName) {
      logVerbose('waitForResourceReady(' + resourceName + ')')
      return this.waitUntil(function () {
        return this.getAppState().then((val) => {
          logVerbose('waitForResourceReady("' + resourceName + '") => ' + JSON.stringify(val.value[resourceName]))
          return val.value[resourceName] && val.value[resourceName].ready
        })
      }, 20000)
    })

    this.app.client.addCommand('waitForSettingValue', function (setting, value) {
      logVerbose('waitForSettingValue(' + setting + ', ' + value + ')')
      return this.waitUntil(function () {
        return this.getAppState().then((val) => {
          logVerbose('waitForSettingValue("' + setting + ', ' + value + '") => ' + val.value && val.value.settings && val.value.settings[setting])
          return val.value && val.value.settings && val.value.settings[setting] === value
        })
      }, 5000, null, 100)
    })

    this.app.client.addCommand('waitForBookmarkDetail', function (location, title) {
      logVerbose('waitForBookmarkDetail("' + location + '", "' + title + '")')
      return this.waitUntil(function () {
        return this.getWindowState().then((val) => {
          const bookmarkDetailLocation = val.value && val.value.bookmarkDetail &&
            val.value.bookmarkDetail.siteDetail && val.value.bookmarkDetail.siteDetail.location
          const bookmarkDetailTitle = val.value && val.value.bookmarkDetail && val.value.bookmarkDetail.siteDetail &&
            val.value.bookmarkDetail.siteDetail.title
          const ret = bookmarkDetailLocation === location && bookmarkDetailTitle === title
          logVerbose('waitForBookmarkDetail("' + location + '", "' + title + '") => ' + ret +
            ' (bookmarkDetailLocation = ' + bookmarkDetailLocation + ', bookmarkDetailTitle = ' + bookmarkDetailTitle + ')')
          return ret
        })
      }, 5000, null, 100)
    })

    this.app.client.addCommand('loadUrl', function (url) {
      if (isSourceAboutUrl(url)) {
        url = getTargetAboutUrl(url)
      }
      logVerbose('loadUrl("' + url + '")')

      return this.url(url).then((response) => {
        logVerbose('loadUrl.url() => ' + JSON.stringify(response))
      }, (error) => {
        logVerbose('loadUrl.url() => ERROR: ' + JSON.stringify(error))
      }).waitForUrl(url)
    })

    this.app.client.addCommand('getAppState', function () {
      logVerbose('getAppState()')
      return this.execute(function () {
        return devTools('electron').testData.appStoreRenderer.state.toJS()
      })
    })

    this.app.client.addCommand('getTabIdByIndex', function (index) {
      logVerbose('getTabIdByIndex()')
      return this.waitForTab({index})
        .getAppState().then((val) => val.value.tabs[index].tabId)
    })

    this.app.client.addCommand('getWindowState', function () {
      logVerbose('getWindowState()')
      return this.execute(function () {
        return devTools('electron').testData.windowStore.state.toJS()
      })
    })

    this.app.client.addCommand('setContextMenuDetail', function () {
      logVerbose('setContextMenuDetail()')
      return this.execute(function () {
        return devTools('electron').testData.windowActions.setContextMenuDetail()
      })
    })

    this.app.client.addCommand('closeTabWithMouse', function () {
      logVerbose('closeTabWithMouse()')
      return this.execute(function () {
        return devTools('electron').testData.windowActions.onTabClosedWithMouse()
      })
    })

    this.app.client.addCommand('waitForInputText', function (selector, input) {
      logVerbose('waitForInputText("' + selector + '", "' + input + '")')
      return this
        .waitUntil(function () {
          return this.getValue(selector).then(function (val) {
            let ret
            if (input.constructor === RegExp) {
              ret = val && val.match(input)
            } else {
              ret = val === input
            }
            logVerbose('Current val (in quotes): "' + val + '"')
            logVerbose('waitForInputText("' + selector + '", "' + input + '") => ' + ret)
            return ret
          })
        }, 5000, null, 100)
    })

    this.app.client.addCommand('setInputText', function (selector, input) {
      logVerbose('setInputText("' + selector + '", "' + input + '")')
      return this
        .activateURLMode()
        .setValue(selector, input)
        .waitForInputText(selector, input)
    })

    this.app.client.addCommand('showFindbar', function (show, key = 1) {
      logVerbose('showFindbar("' + show + '", "' + key + '")')
      return this.execute(function (show, key) {
        devTools('electron').testData.windowActions.setFindbarShown(Object.assign({
          key
        }), show !== false)
      }, show, key)
    })

    this.app.client.addCommand('setMouseInTitlebar', function (mouseInTitleBar) {
      logVerbose('showFindbar("' + mouseInTitleBar + '")')
      return this.execute(function (mouseInTitleBar) {
        devTools('electron').testData.windowActions.setMouseInTitlebar(mouseInTitleBar)
      }, mouseInTitleBar)
    })

    this.app.client.addCommand('openBraveMenu', function (braveMenu, braveryPanel) {
      logVerbose('openBraveMenu()')
      return this
        .waitForBrowserWindow()
        .waitForVisible(braveMenu)
        .click(braveMenu)
        .waitForVisible(braveryPanel)
    })

    this.app.client.addCommand('pinTabByIndex', function (index, isPinned) {
      return this.waitForTab({index}).getAppState().then((val) => {
        const tab = val.value.tabs.find((tab) => tab.index === index)
        return this.execute(function (tabId, isPinned) {
          devTools('appActions').tabPinned(tabId, isPinned)
        }, tab.tabId, isPinned)
      })
    })

    this.app.client.addCommand('stopReportingStateUpdates', function () {
      return this.execute(function () {
        devTools('electron').ipcRenderer.removeAllListeners('request-window-state')
      })
    })

    this.app.client.addCommand('detachTabByIndex', function (index, windowId = -1) {
      return this.waitForTab({index}).getWindowState().then((val) => {
        const frame = val.value.frames[index]
        return this.execute(function (tabId, windowId, frame) {
          const browserOpts = { positionByMouseCursor: true }
          devTools('appActions').tabDetachMenuItemClicked(tabId, frame, browserOpts, windowId)
        }, frame.tabId, windowId, frame)
      })
    })

    this.app.client.addCommand('closeTabPageByIndex', function (tabPageIndex, windowId = -1) {
      logVerbose('closeTabPageByIndex("' + windowId + '", "' + tabPageIndex + '")')
      return this.execute(function (windowId, tabPageIndex) {
        return devTools('appActions').tabPageCloseMenuItemClicked(windowId, tabPageIndex)
      }, windowId, tabPageIndex).then((response) => response.value)
    })

    this.app.client.addCommand('closeTabsToLeft', function (index) {
      logVerbose('closeTabsToLeft(' + index + ')')
      return this.waitForTab({index}).getAppState().then((val) => {
        const tab = val.value.tabs.find((tab) => tab.index === index)
        return this.execute(function (tabId) {
          devTools('appActions').closeTabsToLeftMenuItemClicked(tabId)
        }, tab.tabId)
      })
    })

    this.app.client.addCommand('closeTabsToRight', function (index) {
      logVerbose('closeTabsToRight(' + index + ')')
      return this.waitForTab({index}).getAppState().then((val) => {
        const tab = val.value.tabs.find((tab) => tab.index === index)
        return this.execute(function (tabId) {
          devTools('appActions').closeTabsToRightMenuItemClicked(tabId)
        }, tab.tabId)
      })
    })

    this.app.client.addCommand('closeOtherTabs', function (index) {
      logVerbose('closeOtherTabs(' + index + ')')
      return this.waitForTab({index}).getAppState().then((val) => {
        const tab = val.value.tabs.find((tab) => tab.index === index)
        return this.execute(function (tabId) {
          devTools('appActions').closeOtherTabsMenuItemClicked(tabId)
        }, tab.tabId)
      })
    })

    this.app.client.addCommand('closeTabByIndex', function (index) {
      return this.waitForTab({index}).getAppState().then((val) => {
        const tab = val.value.tabs.find((tab) => tab.index === index)
        return this.execute(function (tabId) {
          devTools('appActions').tabCloseRequested(tabId)
        }, tab.tabId)
      })
    })

    this.app.client.addCommand('moveTabByFrameKey', function (sourceKey, destinationKey, prepend) {
      logVerbose(`moveTabByFrameKey(${sourceKey}, ${destinationKey}, ${prepend})`)
      return this.execute(function (sourceKey, destinationKey, prepend) {
        return devTools('electron').testData.windowActions.moveTab(sourceKey, destinationKey, prepend)
      }, sourceKey, destinationKey, prepend)
    })

    this.app.client.addCommand('moveTabIncrementally', function (moveNext, windowId = 1) {
      logVerbose(`moveTabIncrementally(${moveNext}, ${windowId}`)
      return this.execute(function (moveNext, windowId) {
        return devTools('electron').testData.windowActions.tabMoveIncrementalRequested(windowId, moveNext)
      }, moveNext, windowId)
    })

    this.app.client.addCommand('ipcOn', function (message, fn) {
      logVerbose('ipcOn("' + message + '")')
      return this.execute(function (message, fn) {
        return devTools('electron').remote.getCurrentWindow().webContents.on(message, fn)
      }, message, fn).then((response) => response.value)
    })

    this.app.client.addCommand('ipcOnce', function (message, fn) {
      logVerbose('ipcOnce("' + message + '")')
      return this.execute(function (message, fn) {
        return devTools('electron').remote.getCurrentWindow().webContents.once(message, fn)
      }, message, fn).then((response) => response.value)
    })

    this.app.client.addCommand('newWindowAction', function (frameOpts, browserOpts) {
      logVerbose('newWindowAction("' + frameOpts + '", "' + browserOpts + '")')
      return this.execute(function () {
        return devTools('appActions').newWindow()
      }, frameOpts, browserOpts).then((response) => response.value)
    })

    this.app.client.addCommand('quit', function () {
      logVerbose('quit()')
      return this.execute(function () {
        return devTools('appActions').shuttingDown()
      }).then((response) => response.value)
    })

    this.app.client.addCommand('newTab', function (createProperties = {}, activateIfOpen = false, isRestore = false) {
      return this
        .execute(function (createProperties) {
          return devTools('appActions').createTabRequested(createProperties)
        }, createProperties)
    })

    this.app.client.addCommand('activateTabByIndex', function (index) {
      return this.waitForTab({index}).getAppState().then((val) => {
        const tab = val.value.tabs.find((tab) => tab.index === index)
        return this.execute(function (tabId) {
          devTools('appActions').tabActivateRequested(tabId)
        }, tab.tabId)
      })
    })

    this.app.client.addCommand('activateTabByFrameKey', function (key) {
      return this.getAppState().then((val) => {
        const tab = val.value.tabs.find((tab) => tab.frame.key === key)
        return this.execute(function (tabId) {
          devTools('appActions').tabActivateRequested(tabId)
        }, tab.tabId)
      })
    })

    /**
     * Adds a bookmark
     *
     * @param {object} siteDetail - Properties for the siteDetail to add
     */
    this.app.client.addCommand('addBookmark', function (siteDetail) {
      logVerbose('addBookmark("' + siteDetail + '")')
      let waitUrl = siteDetail.location
      if (isSourceAboutUrl(waitUrl)) {
        waitUrl = getTargetAboutUrl(waitUrl)
      }
      return this.execute(function (siteDetail) {
        return devTools('appActions').addBookmark(siteDetail)
      }, siteDetail).then((response) => response.value)
      .waitForBookmarkEntry(waitUrl)
    })

    this.app.client.addCommand('waitForBookmarkEntry', function (location) {
      logVerbose('waitForBookmarkEntry("' + location + '")')
      return this.waitUntil(function () {
        return this.getAppState().then((val) => {
          const ret = val.value.cache.bookmarkLocation.hasOwnProperty(location)
          logVerbose('waitForBookmarkEntry("' + location + '") => ' + ret)
          return ret
        })
      }, 10000, null, 100)
    })

    /**
     * Adds a history site
     *
     * @param {object} siteDetail - Properties for the siteDetail to add
     */
    this.app.client.addCommand('addHistorySite', function (siteDetail) {
      logVerbose('addHistorySite("' + siteDetail + '")')
      let waitUrl = siteDetail.location
      if (isSourceAboutUrl(waitUrl)) {
        waitUrl = getTargetAboutUrl(waitUrl)
      }
      return this.execute(function (siteDetail) {
        return devTools('appActions').addHistorySite(siteDetail)
      }, siteDetail).then((response) => response.value)
        .waitForHistoryEntry(waitUrl, false)
    })

    this.app.client.addCommand('waitForHistoryEntry', function (location, waitForTitle = true) {
      logVerbose('waitForHistoryEntry("' + location + '", "' + waitForTitle + '")')
      return this.waitUntil(function () {
        return this.getAppState().then((val) => {
          const ret = val.value && val.value.historySites && Array.from(Object.values(val.value.historySites)).find(
              (site) => site.location === location &&
              (!waitForTitle || (waitForTitle && site.title)))
          logVerbose('waitForHistoryEntry("' + location + ', ' + waitForTitle + '") => ' + ret)
          return ret
        })
      }, 5000, null, 100)
    })

    /**
     * Adds a bookmark folder
     *
     * @param {object} siteDetail - Properties for the siteDetail to add
     */
    this.app.client.addCommand('addBookmarkFolder', function (siteDetail) {
      logVerbose('addBookmarkFolder("' + JSON.stringify(siteDetail) + '")')
      return this.execute(function (siteDetail) {
        return devTools('appActions').addBookmarkFolder(siteDetail)
      }, siteDetail).then((response) => response.value)
      .waitForBookmarkFolderEntry(siteDetail.folderId, false)
    })

    this.app.client.addCommand('waitForBookmarkFolderEntry', function (folderId, waitForTitle = true) {
      logVerbose('waitForBookmarkFolderEntry("' + folderId + '", "' + waitForTitle + '")')
      return this.waitUntil(function () {
        return this.getAppState().then((val) => {
          const ret = val.value && val.value.bookmarkFolders && Array.from(Object.values(val.value.bookmarkFolders)).find(
              (folder) => folder.folderId === folderId &&
              (!waitForTitle || (waitForTitle && folder.title)))
          logVerbose('waitForBookmarkFolderEntry("' + folderId + ', ' + waitForTitle + '") => ' + ret)
          return ret
        })
      }, 5000, null, 100)
    })

    /**
     * Adds a list of bookmarks
     *
     * @param {object} bookmarkList - List of bookmarks to add
     */
    this.app.client.addCommand('addBookmarks', function (bookmarkList) {
      logVerbose('addBookmarks("' + bookmarkList + '")')
      return this.execute(function (bookmarkList) {
        return devTools('appActions').addBookmark(bookmarkList)
      }, bookmarkList).then((response) => response.value)
    })

    /**
     * Adds a list of history sites
     *
     * @param {object} historyList - List of history sites to add
     */
    this.app.client.addCommand('addHistorySites', function (historyList) {
      logVerbose('addHistorySites("' + historyList + '")')
      return this.execute(function (historyList) {
        return devTools('appActions').addHistorySite(historyList)
      }, historyList).then((response) => response.value)
    })

    /**
     * Enables or disables the specified resource.
     *
     * @param {string} resourceName - The resource to enable or disable
     * @param {boolean} enabled - Whether to enable or disable the resource
     */
    this.app.client.addCommand('setResourceEnabled', function (resourceName, enabled) {
      logVerbose('setResourceEnabled("' + resourceName + '", "' + enabled + '")')
      return this.execute(function (resourceName, enabled) {
        return devTools('appActions').setResourceEnabled(resourceName, enabled)
      }, resourceName, enabled).then((response) => response.value)
    })

    /**
     * Clones the specified tab
     *
     * @param {number} index - The index of the tabId to clone
     * @param {Object} options - options to pass to clone
     */
    this.app.client.addCommand('cloneTabByIndex', function (index, options) {
      logVerbose('cloneTabByIndex("' + index + '", "' + options + '")')
      return this.getWindowState().then((val) => {
        const tabId = val.value.frames[index].tabId
        return this.execute(function (tabId, options) {
          return devTools('appActions').tabCloned(tabId, options)
        }, tabId, options).then((response) => response.value)
      })
    })

    /**
     * Removes a bookmark.
     *
     * @param bookmarkKey {string|Immutable.List} - Bookmark key that we want to remove. This could also be list of keys
     */
    this.app.client.addCommand('removeBookmark', function (bookmarkKey) {
      logVerbose('removeBookmark("' + bookmarkKey + '")')
      return this.execute(function (bookmarkKey) {
        return devTools('appActions').removeBookmark(bookmarkKey)
      }, bookmarkKey).then((response) => response.value)
    })

    /**
     * Removes a bookmark folder.
     *
     * @param {object} folderKey folder key to remove
     */
    this.app.client.addCommand('removeBookmarkFolder', function (folderKey) {
      logVerbose('removeBookmarkFolder("' + folderKey + '")')
      return this.execute(function (folderKey) {
        return devTools('appActions').removeBookmarkFolder(folderKey)
      }, folderKey).then((response) => response.value)
    })

    /**
     * Changes a setting
     *
     * @param {string} key - the setting key to change
     * @param value - The setting value to change to
     */
    this.app.client.addCommand('changeSetting', function (key, value) {
      logVerbose('changeSetting("' + key + '", "' + value + '")')
      return this
        .execute(function (key, value) {
          return devTools('appActions').changeSetting(key, value)
        }, key, value).then((response) => response.value)
        .waitForSettingValue(key, value)
    })

    /**
     * Sets the sync init data
     */
    this.app.client.addCommand('saveSyncInitData', function (seed, deviceId, lastFetchTimestamp, qr) {
      logVerbose('saveSyncInitData("' + seed + '", "' + deviceId + '", "' + lastFetchTimestamp + '")')
      return this
        .execute(function (seed, deviceId, lastFetchTimestamp, qr) {
          return devTools('appActions').saveSyncInitData(seed, deviceId, lastFetchTimestamp, qr)
        }, seed, deviceId, lastFetchTimestamp, qr).then((response) => response.value)
    })

    /**
     * Changes a site setting
     *
     * @param {string} key - the setting key to change
     * @param value - The setting value to change to
     */
    this.app.client.addCommand('changeSiteSetting', function (hostPattern, key, value) {
      logVerbose('changeSiteSetting("' + hostPattern + '", "' + key + '", "' + value + '")')
      return this.execute(function (hostPattern, key, value) {
        return devTools('appActions').changeSiteSetting(hostPattern, key, value)
      }, hostPattern, key, value).then((response) => response.value)
    })

    /**
     * Clears application data
     *
     * @param {object} clearDataDetail - the options to use for clearing
     */
    this.app.client.addCommand('onClearBrowsingData', function (key, value) {
      logVerbose('onClearBrowsingData("' + key + ': ' + value + '")')
      return this.execute(function (key, value) {
        devTools('appActions').onToggleBrowsingData(key, value)
        return devTools('appActions').onClearBrowsingData()
      }, key, value).then((response) => response.value)
    })

    this.app.client.addCommand('getDefaultWindowHeight', function () {
      logVerbose('getDefaultWindowHeight()')
      return this.execute(function () {
        let screen = devTools('electron').remote.screen
        let primaryDisplay = screen.getPrimaryDisplay()
        return primaryDisplay.workAreaSize.height
      }).then((response) => response.value)
    })

    this.app.client.addCommand('getDefaultWindowWidth', function () {
      logVerbose('getDefaultWindowWidth()')
      return this.execute(function () {
        let screen = devTools('electron').remote.screen
        let primaryDisplay = screen.getPrimaryDisplay()
        return primaryDisplay.workAreaSize.width
      }).then((response) => response.value)
    })

    this.app.client.addCommand('getPrimaryDisplayHeight', function () {
      logVerbose('getPrimaryDisplayHeight()')
      return this.execute(function () {
        let screen = devTools('electron').remote.screen
        return screen.getPrimaryDisplay().bounds.height
      }).then((response) => response.value)
    })

    this.app.client.addCommand('isDarwin', function () {
      return this.execute(function () {
        return navigator.platform === 'MacIntel'
      }).then((response) => response.value)
    })

    this.app.client.addCommand('getPrimaryDisplayWidth', function () {
      logVerbose('getPrimaryDisplayWidth()')
      return this.execute(function () {
        let screen = devTools('electron').remote.screen
        return screen.getPrimaryDisplay().bounds.width
      }).then((response) => response.value)
    })

    this.app.client.addCommand('resizeWindow', function (width, height) {
      logVerbose('resizeWindow("' + width + '", "' + height + '")')
      return this.execute(function (width, height) {
        return devTools('electron').remote.getCurrentWindow().setSize(width, height)
      }, width, height).then((response) => response.value)
    })

    this.app.client.addCommand('setWindowPosition', function (x, y) {
      logVerbose('setWindowPosition("' + x + '", "' + y + '")')
      return this.execute(function (x, y) {
        return devTools('electron').remote.getCurrentWindow().setPosition(x, y)
      }, x, y).then((response) => response.value)
    })

    this.app.client.addCommand('windowParentByUrl', function (url, childSelector = 'webview') {
      logVerbose('windowParentByUrl("' + url + '", "' + childSelector + '")')
      var context = this
      return this.windowHandles().then((response) => response.value).then(function (handles) {
        return promiseMapSeries(handles, function (handle) {
          return context.window(handle).getAttribute(childSelector, 'src').catch(() => '')
        })
      }).then(function (response) {
        let index = response.indexOf(url)
        if (index !== -1) {
          return context.windowByIndex(index)
        } else {
          return undefined
        }
      })
    })

    this.app.client.addCommand('windowByUrl', function (url) {
      logVerbose('windowByUrl("' + url + '")')
      var context = this
      return this.windowHandles().then((response) => response.value).then(function (handles) {
        return promiseMapSeries(handles, function (handle) {
          return context.window(handle).getUrl()
        }).then(function (response) {
          logVerbose('windowByUrl("' + url + '") => ' + JSON.stringify(response))
          let index = response.indexOf(url)
          if (index !== -1) {
            return context.window(handles[index])
          } else {
            return undefined
          }
        })
      })
    })

    this.app.client.addCommand('tabByUrl', function (url) {
      logVerbose('tabByUrl("' + url + '")')
      var context = this
      return this.tabHandles().then((response) => response.value).then(function (handles) {
        return promiseMapSeries(handles, function (handle) {
          return context.window(handle).getUrl()
        }).then(function (response) {
          let index = response.indexOf(url)
          if (index !== -1) {
            return context.window(handles[index])
          } else {
            return undefined
          }
        })
      })
    })

    this.app.client.addCommand('sendWebviewEvent', function (frameKey, eventName, ...params) {
      logVerbose('sendWebviewEvent("' + frameKey + '", "' + eventName + '")')
      return this.execute(function (frameKey, eventName, ...params) {
        const webview = document.querySelector('webview[data-frame-key="' + frameKey + '"]')
        // Get the internal view instance ID from the selected webview
        var v8Util = process.atomBinding('v8_util')
        var internal = v8Util.getHiddenValue(webview, 'internal')

        // This allows you to send more args than just the event itself like would only
        // be possible with dispatchEvent.
        devTools('electron').ipcRenderer.emit('ELECTRON_GUEST_VIEW_INTERNAL_DISPATCH_EVENT-' + internal.viewInstanceId, ...params)
      }, frameKey, eventName, ...params).then((response) => response.value)
    })

    this.app.client.addCommand('waitForElementFocus', function (selector, timeout) {
      logVerbose('waitForElementFocus("' + selector + '", "' + timeout + '")')
      let activeElement
      return this.waitForVisible(selector, timeout)
        .element(selector)
          .then(function (el) { activeElement = el })
        .waitUntil(function () {
          return this.elementActive()
            .then(function (el) {
              return el.value.ELEMENT === activeElement.value.ELEMENT
            })
        }, timeout, null, 100)
    })

    this.app.client.addCommand('waitForDataFile', function (dataFile) {
      logVerbose('waitForDataFile("' + dataFile + '")')
      return this.waitUntil(function () {
        return this.getAppState().then((val) => {
          logVerbose('waitForDataFile("' + dataFile + '") => ' + JSON.stringify(val.value[dataFile]))
          return val.value[dataFile] && val.value[dataFile].etag && val.value[dataFile].etag.length > 0
        })
      }, 10000)
    })

    // retrieve a map of all the translations per existing IPC message 'translations'
    this.app.client.addCommand('translations', function () {
      logVerbose('translations()')
      return this.ipcSendRendererSync('translations')
    })

    // get synopsis from the store
    this.app.client.addCommand('waitUntilSynopsis', function (cb) {
      logVerbose(`waitUntilSynopsis()`)
      return this.waitUntil(function () {
        return this.getAppState().then((val) => {
          val = Immutable.fromJS(val)
          let synopsis = val.getIn(['value', 'ledger', 'synopsis'])
          if (synopsis !== undefined) {
            return cb(synopsis)
          }
          return false
        })
      }, 5000, null, 100)
    })

    this.app.client.addCommand('typeText', function (selector, text, prevValue) {
      logVerbose(`typeText(${selector}, ${text}, ${prevValue})`)
      prevValue = (prevValue === undefined) ? '' : prevValue
      let current = prevValue
      let finalValue = handleTypedText(prevValue, text)
      let i = 0

      return this.waitUntil(function () {
        current = executeType(current, text[i])

        return this.keys(text[i])
          .waitUntil(function () {
            return this.elements(selector).then((res) => {
              if (!res.value || res.value.length === 0) {
                logVerbose(`Element not found for the selector ${selector}`)
                return false
              }

              let elementIdAttributeCommands = []
              for (let elem of res.value) {
                elementIdAttributeCommands.push(this.elementIdAttribute(elem.ELEMENT, 'value'))
              }

              return Promise.all(elementIdAttributeCommands).then((result) => {
                if (!Array.isArray(result)) {
                  return result
                }

                return result.map(res => res.value)
              })
            }).then(function (val) {
              return val.toString() === current
            })
          }).then(function (valid) {
            if (valid) {
              i++
            }

            if (current === finalValue) {
              return this.getValue(selector).then(function (val) {
                return val === finalValue
              })
            } else {
              return false
            }
          })
      }, 10000)
    })
  },

  /**
   * @param {Array=} extraArgs
   */
  startApp: function (extraArgs) {
    if (process.env.KEEP_BRAVE_USER_DATA_DIR) {
      console.log('BRAVE_USER_DATA_DIR=' + userDataDir)
    }
    let env = {
      NODE_ENV: 'test',
      CHROME_USER_DATA_DIR: userDataDir,
      SPECTRON: true
    }
    let args = ['./', '--enable-logging', '--v=1']
    if (extraArgs) { args = args.concat(extraArgs) }
    this.app = new Application({
      quitTimeout: 0,
      waitTimeout: exports.defaultTimeout,
      waitInterval: exports.defaultInterval,
      connectionRetryTimeout: exports.defaultTimeout,
      path: process.platform === 'win32'
        ? 'node_modules/electron-prebuilt/dist/brave.exe'
        : './node_modules/.bin/electron',
      env,
      args,
      requireName: 'devTools'
    })
    return this.app.start()
  },

  stopApp: function (cleanSessionStore = true, timeout = 100) {
    const promises = []

    if (process.env.BRAVE_TEST_ALL_LOGS || process.env.BRAVE_TEST_BROWSER_LOGS) {
      promises.push((callback) => {
        this.app.client.getMainProcessLogs().then(function (logs) {
          logs.forEach(function (log) {
            console.log(log)
          })
          callback()
        })
      })
    }

    if (process.env.BRAVE_TEST_ALL_LOGS || process.env.BRAVE_TEST_RENDERER_LOGS) {
      promises.push((callback) => {
        this.app.client.getRenderProcessLogs().then(function (logs) {
          logs.forEach(function (log) {
            console.log(log)
          })
          callback()
        })
      })
    }

    const cleanup = (callback) => {
      if (cleanSessionStore) {
        if (!process.env.KEEP_BRAVE_USER_DATA_DIR) {
          userDataDir && rmDir(userDataDir)
        }
        userDataDir = generateUserDataDir()
      }
      callback()
    }

    promises.push((callback) => {
      callback = setTimeout(cleanup.bind(this, callback), timeout)
      this.app.client.waitForBrowserWindow().quit()
        .then(callback)
        .catch((err) => {
          console.error('Quit failed: ', err)
          this.app.stop.then(callback)
        })
    })

    return new Promise((resolve, reject) => {
      series(promises, (err) => {
        if (err) {
          console.log(err)
          reject(new Error(err))
        }
        resolve()
      })
    })
  }
}

module.exports = exports
