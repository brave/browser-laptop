/* globals devTools */
var Application = require('spectron').Application
var chai = require('chai')
const {activeWebview, navigator, titleBar, urlInput} = require('./selectors')
require('./coMocha')

const path = require('path')
const fs = require('fs')
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
  return path.join(os.tmpdir(), 'brave-test', (new Date().getTime()) + Math.floor(Math.random() * 1000).toString())
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
    fs.rmdirSync(dirPath)
  } catch (e) {
    console.error(e)
  }
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
    DOWN: '\ue015',
    UP: '\ue013',
    PAGEDOWN: '\uE00F',
    END: '\uE010'
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
      Server.create(`${__dirname}/../fixtures/`, (err, _server) => {
        if (err) {
          console.log(err.stack)
        }
        exports.server = _server
        done()
      })
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

    exports.beforeAllServerSetup(context)

    context.beforeEach(function () {
      chaiAsPromised.transferPromiseness = this.app.client.transferPromiseness
    })

    context.afterAll(function () {
      exports.server.stop()
    })

    context.afterAll(function () {
      return exports.stopApp.call(this)
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
      return this.execute(function (message, ...param) {
        return devTools('electron').remote.getCurrentWindow().webContents.send(message, ...param)
      }, message, ...param).then((response) => response.value)
    })

    this.app.client.addCommand('maximize', function () {
      return this.execute(function () {
        return devTools('electron').remote.getCurrentWindow().maximize()
      }).then((response) => response.value)
    })

    this.app.client.addCommand('unmaximize', function () {
      return this.execute(function () {
        return devTools('electron').remote.getCurrentWindow().unmaximize()
      }).then((response) => response.value)
    })

    this.app.client.addCommand('ipcSendRenderer', function (message, ...param) {
      return this.execute(function (message, ...param) {
        return devTools('electron').ipcRenderer.send(message, ...param)
      }, message, ...param).then((response) => response.value)
    })

    this.app.client.addCommand('ipcSendRendererSync', function (message, ...param) {
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

    this.app.client.addCommand('tabHandles', function (index) {
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
      return this.tabHandles().then((response) => response.value).then(function (handles) {
        logVerbose('getTabCount() => ' + handles.length)
        return handles.length
      })
    })

    this.app.client.addCommand('waitForBrowserWindow', function () {
      return this.waitUntil(function () {
        logVerbose('waitForBrowserWindow()')
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
      return this
        .setMouseInTitlebar(false)
        .moveToObject(activeWebview)
        .waitForVisible(titleBar)
    })

    this.app.client.addCommand('activateURLMode', function () {
      return this
        .setMouseInTitlebar(true)
        .moveToObject(navigator)
        .waitForVisible(urlInput)
    })

    this.app.client.addCommand('waitForUrl', function (url) {
      return this.waitUntil(function () {
        logVerbose('waitForUrl("' + url + '")')
        return this.tabByUrl(url).then((response) => {
          logVerbose('tabByUrl("' + url + '") => ' + JSON.stringify(response))
          return response
        }, () => {
          logVerbose('tabByUrl("' + url + '") => false')
          return false
        })
      }, 5000, null, 100)
    })

    this.app.client.addCommand('waitForSelectedText', function (text) {
      return this.waitUntil(function () {
        return this.getSelectedText(text).then((value) => { return value === text })
      }, 5000, null, 100)
    })

    this.app.client.addCommand('waitForTextValue', function (selector, text) {
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
          return count === tabCount
        })
      }, 5000, null, 100)
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

    this.app.client.addCommand('waitForSiteEntry', function (location, waitForTitle = true) {
      logVerbose('waitForSiteEntry("' + location + '", "' + waitForTitle + '")')
      return this.waitUntil(function () {
        return this.getAppState().then((val) => {
          const ret = val.value && val.value.sites && Array.from(Object.values(val.value.sites)).find(
            (site) => site.location === location &&
              (!waitForTitle || (waitForTitle && site.title)))
          logVerbose('waitForSiteEntry("' + location + ', ' + waitForTitle + '") => ' + ret)
          return ret
        })
      }, 5000, null, 100)
    })

    this.app.client.addCommand('waitForAddressEntry', function (location, waitForTitle = true) {
      logVerbose('waitForAddressEntry("' + location + '", "' + waitForTitle + '")')
      return this.waitUntil(function () {
        return this.getAppState().then((val) => {
          const ret = val.value && val.value.sites && Array.from(Object.values(val.value.sites)).find(
            (site) => site.location === location &&
              (!waitForTitle || (waitForTitle && site.title)))
          logVerbose('sites:' + JSON.stringify(val.value.sites))
          logVerbose('waitForSiteEntry("' + location + '", ' + waitForTitle + ') => ' + ret)
          return ret
        })
      }, 5000, null, 100)
    })

    this.app.client.addCommand('waitForBookmarkDetail', function (location, title) {
      logVerbose('waitForBookmarkDetail("' + location + '", "' + title + '")')
      return this.waitUntil(function () {
        return this.getWindowState().then((val) => {
          const bookmarkDetailLocation = val.value && val.value.bookmarkDetail &&
            val.value.bookmarkDetail.currentDetail && val.value.bookmarkDetail.currentDetail.location
          const bookmarkDetailTitle = (val.value && val.value.bookmarkDetail && val.value.bookmarkDetail.currentDetail &&
            val.value.bookmarkDetail.currentDetail.customTitle) || val.value.bookmarkDetail.currentDetail.title
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
      return this.execute(function () {
        return devTools('electron').testData.appStoreRenderer.state.toJS()
      })
    })

    this.app.client.addCommand('getWindowState', function () {
      return this.execute(function () {
        return devTools('electron').testData.windowStore.state.toJS()
      })
    })

    this.app.client.addCommand('setContextMenuDetail', function () {
      return this.execute(function () {
        return devTools('electron').testData.windowActions.setContextMenuDetail()
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
      return this
        .activateURLMode()
        .setValue(selector, input)
        .waitForInputText(selector, input)
    })

    this.app.client.addCommand('showFindbar', function (show, key = 1) {
      return this.execute(function (show, key) {
        devTools('electron').testData.windowActions.setFindbarShown(Object.assign({
          key
        }), show !== false)
      }, show, key)
    })

    this.app.client.addCommand('setMouseInTitlebar', function (mouseInTitleBar) {
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
      return this.getWindowState().then((val) => {
        const tabId = val.value.frames[index].tabId
        return this.execute(function (tabId, isPinned) {
          devTools('appActions').tabPinned(tabId, isPinned)
        }, tabId, isPinned)
      })
    })

    this.app.client.addCommand('ipcOn', function (message, fn) {
      return this.execute(function (message, fn) {
        return devTools('electron').remote.getCurrentWindow().webContents.on(message, fn)
      }, message, fn).then((response) => response.value)
    })

    this.app.client.addCommand('ipcOnce', function (message, fn) {
      return this.execute(function (message, fn) {
        return devTools('electron').remote.getCurrentWindow().webContents.once(message, fn)
      }, message, fn).then((response) => response.value)
    })

    this.app.client.addCommand('newWindowAction', function (frameOpts, browserOpts) {
      return this.execute(function () {
        return devTools('appActions').newWindow()
      }, frameOpts, browserOpts).then((response) => response.value)
    })

    this.app.client.addCommand('quit', function () {
      return this.execute(function () {
        return devTools('appActions').shuttingDown()
      }).then((response) => response.value)
    })

    this.app.client.addCommand('newTab', function (createProperties = {}) {
      return this
        .execute(function (createProperties) {
          return devTools('appActions').createTabRequested(createProperties)
        }, createProperties)
    })

    /**
     * Adds a site to the sites list, such as a bookmarks.
     *
     * @param {object} siteDetail - Properties for the siteDetail to add
     * @param {string} tag - A site tag from js/constants/siteTags.js
     */
    this.app.client.addCommand('addSite', function (siteDetail, tag) {
      let waitUrl = siteDetail.location
      if (isSourceAboutUrl(waitUrl)) {
        waitUrl = getTargetAboutUrl(waitUrl)
      }
      return this.execute(function (siteDetail, tag) {
        return devTools('appActions').addSite(siteDetail, tag)
      }, siteDetail, tag).then((response) => response.value)
      .waitForSiteEntry(waitUrl, false)
    })

    /**
     * Adds a list sites to the sites list, including bookmark and foler.
     *
     * @param {object} siteDetail - Properties for the siteDetail to add
     */
    this.app.client.addCommand('addSiteList', function (siteDetail) {
      return this.execute(function (siteDetail) {
        return devTools('appActions').addSite(siteDetail)
      }, siteDetail).then((response) => response.value)
    })

    /**
     * Enables or disables the specified resource.
     *
     * @param {string} resourceName - The resource to enable or disable
     * @param {boolean} enabled - Whether to enable or disable the resource
     */
    this.app.client.addCommand('setResourceEnabled', function (resourceName, enabled) {
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
      return this.getWindowState().then((val) => {
        const tabId = val.value.frames[index].tabId
        return this.execute(function (tabId, options) {
          return devTools('appActions').tabCloned(tabId, options)
        }, tabId, options).then((response) => response.value)
      })
    })

    /**
     * Removes a site from the sites list, or removes a bookmark.
     *
     * @param {object} siteDetail - Properties for the frame to add
     * @param {string} tag - A site tag from js/constants/siteTags.js
     */
    this.app.client.addCommand('removeSite', function (siteDetail, tag) {
      return this.execute(function (siteDetail, tag) {
        return devTools('appActions').removeSite(siteDetail, tag)
      }, siteDetail, tag).then((response) => response.value)
    })

    /**
     * Changes a setting
     *
     * @param {string} key - the setting key to change
     * @param value - The setting value to change to
     */
    this.app.client.addCommand('changeSetting', function (key, value) {
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
      return this.execute(function (hostPattern, key, value) {
        return devTools('appActions').changeSiteSetting(hostPattern, key, value)
      }, hostPattern, key, value).then((response) => response.value)
    })

    /**
     * Clears application data
     *
     * @param {object} clearDataDetail - the options to use for clearing
     */
    this.app.client.addCommand('onClearBrowsingData', function (clearDataDetail) {
      return this.execute(function (clearDataDetail) {
        return devTools('appActions').onClearBrowsingData(clearDataDetail)
      }, clearDataDetail).then((response) => response.value)
    })

    this.app.client.addCommand('getDefaultWindowHeight', function () {
      return this.execute(function () {
        let screen = devTools('electron').remote.screen
        let primaryDisplay = screen.getPrimaryDisplay()
        return primaryDisplay.workAreaSize.height
      }).then((response) => response.value)
    })

    this.app.client.addCommand('getDefaultWindowWidth', function () {
      return this.execute(function () {
        let screen = devTools('electron').remote.screen
        let primaryDisplay = screen.getPrimaryDisplay()
        return primaryDisplay.workAreaSize.width
      }).then((response) => response.value)
    })

    this.app.client.addCommand('getPrimaryDisplayHeight', function () {
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
      return this.execute(function () {
        let screen = devTools('electron').remote.screen
        return screen.getPrimaryDisplay().bounds.width
      }).then((response) => response.value)
    })

    this.app.client.addCommand('resizeWindow', function (width, height) {
      return this.execute(function (width, height) {
        return devTools('electron').remote.getCurrentWindow().setSize(width, height)
      }, width, height).then((response) => response.value)
    })

    this.app.client.addCommand('windowParentByUrl', function (url, childSelector = 'webview') {
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
      var context = this
      logVerbose('windowByUrl("' + url + '")')
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
      return this.execute(function (frameKey, eventName, ...params) {
        const webview = document.querySelector('webview[data-frame-key="' + frameKey + '"]')
        // Get the internal view instance ID from the selected webview
        var v8Util = process.atomBinding('v8_util')
        var internal = v8Util.getHiddenValue(webview, 'internal')
        internal.viewInstanceId
        // This allows you to send more args than just the event itself like would only
        // be possible with dispatchEvent.
        devTools('electron').ipcRenderer.emit('ELECTRON_GUEST_VIEW_INTERNAL_DISPATCH_EVENT-' + internal.viewInstanceId, ...params)
      }, frameKey, eventName, ...params).then((response) => response.value)
    })

    this.app.client.addCommand('waitForElementFocus', function (selector, timeout) {
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
      return this.ipcSendRendererSync('translations')
    })
  },

  startApp: function () {
    if (process.env.KEEP_BRAVE_USER_DATA_DIR) {
      console.log('BRAVE_USER_DATA_DIR=' + userDataDir)
    }
    let env = {
      NODE_ENV: 'test',
      BRAVE_USER_DATA_DIR: userDataDir,
      SPECTRON: true
    }
    this.app = new Application({
      quitTimeout: 300,
      waitTimeout: exports.defaultTimeout,
      waitInterval: exports.defaultInterval,
      connectionRetryTimeout: exports.defaultTimeout,
      path: process.platform === 'win32'
        ? 'node_modules/electron-prebuilt/dist/brave.exe'
        : './node_modules/.bin/electron',
      env,
      args: ['./', '--debug=5858', '--enable-logging', '--v=1'],
      requireName: 'devTools'
    })
    return this.app.start()
  },

  stopApp: function (cleanSessionStore = true) {
    const promises = []

    if (process.env.BRAVE_TEST_ALL_LOGS || process.env.BRAVE_TEST_BROWSER_LOGS) {
      promises.push(this.app.client.getMainProcessLogs().then(function (logs) {
        logs.forEach(function (log) {
          console.log(log)
        })
      }))
    }
    if (process.env.BRAVE_TEST_ALL_LOGS || process.env.BRAVE_TEST_RENDERER_LOGS) {
      promises.push(this.app.client.getRenderProcessLogs().then(function (logs) {
        logs.forEach(function (log) {
          console.log(log)
        })
      }))
    }

    promises.push(this.app.stop().then((app) => {
      if (cleanSessionStore) {
        if (!process.env.KEEP_BRAVE_USER_DATA_DIR) {
          userDataDir && rmDir(userDataDir)
        }
        userDataDir = generateUserDataDir()
      }
    }))

    return Promise.all(promises)
  }
}

module.exports = exports
