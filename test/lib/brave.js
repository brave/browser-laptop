/* globals devTools */
var Application = require('spectron').Application
var chai = require('chai')
const {activeWebview, navigator, titleBar} = require('./selectors')
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
    return
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
    UP: '\ue013'
  },

  defaultTimeout: 10000,

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
      return exports.stopApp.call(this)
    })
  },

  addCommands: function () {
    this.app.client.addCommand('ipcSend', function (message, ...param) {
      return this.execute(function (message, ...param) {
        return devTools('electron').remote.getCurrentWindow().webContents.send(message, ...param)
      }, message, ...param).then((response) => response.value)
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
            return this.window(handle).getUrl()
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
      })
    })

    this.app.client.addCommand('activateTitleMode', function () {
      return this
        .moveToObject(activeWebview, 2, 2)
        .moveToObject(activeWebview, 3, 3)
        .waitForVisible(titleBar)
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
      })
    })

    this.app.client.addCommand('waitForSelectedText', function (text) {
      return this.waitUntil(function () {
        return this.getSelectedText(text).then((value) => { return value === text })
      })
    })

    this.app.client.addCommand('waitForTextValue', function (selector, text) {
      return this
        .waitForVisible(selector)
        .waitUntil(function () {
          return this.getText(selector).then((value) => { return value === text })
        })
    })

    this.app.client.addCommand('waitForTabCount', function (tabCount) {
      logVerbose('waitForTabCount(' + tabCount + ')')
      return this.waitUntil(function () {
        return this.getTabCount().then((count) => {
          return count === tabCount
        })
      })
    })

    this.app.client.addCommand('waitForElementCount', function (selector, count) {
      logVerbose('waitForElementCount("' + selector + '", ' + count + ')')
      return this.waitUntil(function () {
        return this.elements(selector).then((res) => {
          logVerbose('waitForElementCount("' + selector + '", ' + count + ') => ' + res.value.length)
          return res.value.length === count
        })
      })
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
      })
    })

    this.app.client.addCommand('waitForSiteEntry', function (location, waitForTitle = true) {
      logVerbose('waitForSiteEntry("' + location + '", "' + waitForTitle + '")')
      return this.waitUntil(function () {
        return this.getAppState().then((val) => {
          const ret = val.value && val.value.sites && val.value.sites.find(
            (site) => site.location === location &&
              (!waitForTitle || waitForTitle && site.title))
          logVerbose('waitForSiteEntry("' + location + ', ' + waitForTitle + '") => ' + ret)
          return ret
        })
      })
    })

    this.app.client.addCommand('waitForBookmarkDetail', function (location, title) {
      logVerbose('waitForBookmarkDetail("' + location + '", "' + title + '")')
      return this.waitUntil(function () {
        return this.getWindowState().then((val) => {
          const bookmarkDetailLocation = val.value && val.value.bookmarkDetail &&
            val.value.bookmarkDetail.currentDetail && val.value.bookmarkDetail.currentDetail.location
          const bookmarkDetailTitle = val.value && val.value.bookmarkDetail && val.value.bookmarkDetail.currentDetail &&
            val.value.bookmarkDetail.currentDetail.customTitle || val.value.bookmarkDetail.currentDetail.title
          const ret = bookmarkDetailLocation === location && bookmarkDetailTitle === title
          logVerbose('waitForBookmarkDetail("' + location + '", "' + title + '") => ' + ret +
            ' (bookmarkDetailLocation = ' + bookmarkDetailLocation + ', bookmarkDetailTitle = ' + bookmarkDetailTitle + ')')
          return ret
        })
      })
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
            logVerbose('Current val: ' + val)
            logVerbose('waitForInputText("' + selector + '", "' + input + '") => ' + ret)
            return ret
          })
        })
    })

    this.app.client.addCommand('setInputText', function (selector, input) {
      return this
        .moveToObject(navigator)
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

    this.app.client.addCommand('openBraveMenu', function (braveMenu, braveryPanel) {
      logVerbose('openBraveMenu()')
      return this.windowByUrl(exports.browserWindowUrl)
        .waitForVisible(braveMenu)
        .click(braveMenu)
        .waitForVisible(braveryPanel)
    })

    this.app.client.addCommand('setPinned', function (location, isPinned, options = {}) {
      return this.execute(function (location, isPinned, options) {
        devTools('electron').testData.windowActions.setPinned(devTools('immutable').fromJS(Object.assign({
          location
        }, options)), isPinned)
      }, location, isPinned, options)
    })

    this.app.client.addCommand('ipcOn', function (message, fn) {
      return this.execute(function (message, fn) {
        return devTools('electron').remote.getCurrentWindow().webContents.on(message, fn)
      }, message, fn).then((response) => response.value)
    })

    this.app.client.addCommand('newWindowAction', function (frameOpts, browserOpts) {
      return this.execute(function () {
        return devTools('appActions').newWindow()
      }, frameOpts, browserOpts).then((response) => response.value)
    })

    /**
     * Adds a site to the sites list, such as a bookmarks.
     *
     * @param {object} siteDetail - Properties for the siteDetail to add
     * @param {string} tag - A site tag from js/constants/siteTags.js
     */
    this.app.client.addCommand('addSite', function (siteDetail, tag) {
      return this.execute(function (siteDetail, tag) {
        return devTools('appActions').addSite(siteDetail, tag)
      }, siteDetail, tag).then((response) => response.value)
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
    this.app.client.addCommand('clearAppData', function (clearDataDetail) {
      return this.execute(function (clearDataDetail) {
        return devTools('appActions').clearAppData(clearDataDetail)
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
      return this.windowHandles().then((response) => response.value).then(function (handles) {
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

    this.app.client.addCommand('waitForElementFocus', function (selector) {
      let activeElement
      return this.waitForVisible(selector)
        .element(selector)
          .then(function (el) { activeElement = el })
        .waitUntil(function () {
          return this.elementActive()
            .then(function (el) {
              return el.value.ELEMENT === activeElement.value.ELEMENT
            })
        })
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
  },

  startApp: function () {
    if (process.env.KEEP_BRAVE_USER_DATA_DIR) {
      console.log('BRAVE_USER_DATA_DIR=' + userDataDir)
    }
    let env = {
      NODE_ENV: 'test',
      BRAVE_USER_DATA_DIR: userDataDir
    }
    this.app = new Application({
      waitTimeout: exports.defaultTimeout,
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
    let stop = this.app.stop().then((app) => {
      if (cleanSessionStore) {
        if (!process.env.KEEP_BRAVE_USER_DATA_DIR) {
          userDataDir && rmDir(userDataDir)
        }
        userDataDir = generateUserDataDir()
      }
      return app
    })

    if (process.env.BRAVE_TEST_ALL_LOGS || process.env.BRAVE_TEST_BROWSER_LOGS) {
      this.app.client.getMainProcessLogs().then(function (logs) {
        logs.forEach(function (log) {
          console.log(log)
        })
      })
    }
    if (process.env.BRAVE_TEST_ALL_LOGS || process.env.BRAVE_TEST_RENDERER_LOGS) {
      this.app.client.getRenderProcessLogs().then(function (logs) {
        logs.forEach(function (log) {
          console.log(log)
        })
      })
    }
    return stop
  }
}

module.exports = exports
