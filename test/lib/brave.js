var Application = require('spectron').Application
var chai = require('chai')
require('./coMocha')
const path = require('path')
const fs = require('fs')

var chaiAsPromised = require('chai-as-promised')
chai.should()
chai.use(chaiAsPromised)

const Server = require('./server')

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

var exports = {
  keys: {
    COMMAND: '\ue03d',
    CONTROL: '\ue009',
    ESCAPE: '\ue00c',
    RETURN: '\ue006',
    SHIFT: '\ue008'
  },

  browserWindowUrl: 'file://' + path.resolve(__dirname, '..', '..') + '/app/extensions/brave/index.html',
  newTabUrl: 'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/about-newtab.html',

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
        return require('electron').remote.getCurrentWindow().webContents.send(message, ...param)
      }, message, ...param).then((response) => response.value)
    })

    var windowHandlesOrig = this.app.client.windowHandles
    Object.getPrototypeOf(this.app.client).windowHandles = function () {
      return windowHandlesOrig.apply(this)
        .then(function (response) {
          var handles = response.value
          return promiseMapSeries(handles, (handle) => {
            return this.window(handle).getUrl()
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
              if (!(urls[i].startsWith('chrome-extension') && !urls[i].match(/about-.*\.html$/)) &&
                  // ignore window urls
                  !urls[i].startsWith('file:')) {
                newHandles.push(handles[i])
              }
            }
            response.value = newHandles
            return response
          })
        })
    })

    this.app.client.addCommand('tabByIndex', function (index) {
      return this.tabHandles().then((response) => response.value).then(function (handles) {
        return this.window(handles[index])
      })
    })

    this.app.client.addCommand('getTabCount', function () {
      return this.tabHandles().then((response) => response.value).then(function (handles) {
        return handles.length
      })
    })

    this.app.client.addCommand('waitForBrowserWindow', function () {
      return this.waitUntil(function () {
        return this.windowByUrl(exports.browserWindowUrl).then((response) => response, () => false)
      })
    })

    this.app.client.addCommand('waitForUrl', function (url) {
      return this.waitUntil(function () {
        return this.tabByUrl(url).then((response) => response, () => false)
      })
    })

    this.app.client.addCommand('loadUrl', function (url) {
      return this.execute(function (url) {
        var Immutable = require('immutable')
        var windowActions = require('../../../js/actions/windowActions')
        windowActions.dispatchViaIPC()
        windowActions.loadUrl(Immutable.fromJS({
          isPinned: false
        }), url)
      }, url).then((response) => response.value)
    })

    this.app.client.addCommand('showFindbar', function () {
      return this.execute(function () {
        var Immutable = require('immutable')
        var windowActions = require('../../../js/actions/windowActions')
        windowActions.dispatchViaIPC()
        windowActions.setFindbarShown(Immutable.fromJS({
          key: 1
        }), true)
      })
    })

    this.app.client.addCommand('setPinned', function (location, isPinned) {
      return this.execute(function (location, isPinned) {
        var Immutable = require('immutable')
        var windowActions = require('../../../js/actions/windowActions')
        windowActions.dispatchViaIPC()
        windowActions.setPinned(Immutable.fromJS({
          location
        }), isPinned)
      }, location, isPinned)
    })

    this.app.client.addCommand('ipcOn', function (message, fn) {
      return this.execute(function (message, fn) {
        return require('electron').remote.getCurrentWindow().webContents.on(message, fn)
      }, message, fn).then((response) => response.value)
    })

    this.app.client.addCommand('newWindowAction', function (frameOpts, browserOpts) {
      return this.execute(function () {
        return require('../../../js/actions/appActions').newWindow()
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
        return require('../../../js/actions/appActions').addSite(siteDetail, tag)
      }, siteDetail, tag).then((response) => response.value)
    })

    /**
     * Removes a site from the sites list, or removes a bookmark.
     *
     * @param {object} siteDetail - Properties for the frame to add
     * @param {string} tag - A site tag from js/constants/siteTags.js
     */
    this.app.client.addCommand('removeSite', function (siteDetail, tag) {
      return this.execute(function (siteDetail, tag) {
        return require('../../../js/actions/appActions').removeSite(siteDetail, tag)
      }, siteDetail, tag).then((response) => response.value)
    })

    /**
     * Changes a setting
     *
     * @param {string} key - the setting key to change
     * @param value - The setting value to change to
     */
    this.app.client.addCommand('changeSetting', function (key, value) {
      return this.execute(function (key, value) {
        return require('../../../js/actions/appActions').changeSetting(key, value)
      }, key, value).then((response) => response.value)
    })

    this.app.client.addCommand('getDefaultWindowHeight', function () {
      return this.execute(function () {
        let screen = require('electron').screen
        let primaryDisplay = screen.getPrimaryDisplay()
        return primaryDisplay.workAreaSize.height
      }).then((response) => response.value)
    })

    this.app.client.addCommand('getDefaultWindowWidth', function () {
      return this.execute(function () {
        let screen = require('electron').screen
        let primaryDisplay = screen.getPrimaryDisplay()
        return primaryDisplay.workAreaSize.width
      }).then((response) => response.value)
    })

    this.app.client.addCommand('getPrimaryDisplayHeight', function () {
      return this.execute(function () {
        let screen = require('electron').screen
        return screen.getPrimaryDisplay().bounds.height
      }).then((response) => response.value)
    })

    this.app.client.addCommand('getPrimaryDisplayWidth', function () {
      return this.execute(function () {
        let screen = require('electron').screen
        return screen.getPrimaryDisplay().bounds.width
      }).then((response) => response.value)
    })

    this.app.client.addCommand('resizeWindow', function (width, height) {
      return this.execute(function (width, height) {
        return require('electron').remote.getCurrentWindow().setSize(width, height)
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
        require('electron').ipcRenderer.emit('ELECTRON_GUEST_VIEW_INTERNAL_DISPATCH_EVENT-' + internal.viewInstanceId, ...params)
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

    this.app.client.waitUntilWindowLoaded().windowByUrl(exports.browserWindowUrl)
  },

  startApp: function (cleanSessionStore = true) {
    if (cleanSessionStore) {
      try {
        fs.unlinkSync(path.join(process.env.HOME, '.brave-test-session-store-1'))
      } catch (e) {
      }
    }
    this.app = new Application({
      path: './node_modules/.bin/electron',
      env: {
        NODE_ENV: 'test'
      },
      args: ['./', 'debug=5858']
    })
    return this.app.start()
  },

  stopApp: function () {
    return this.app.stop()
  }
}

module.exports = exports
