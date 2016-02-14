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
    CONTROL: '\ue009',
    ESCAPE: '\ue00c',
    RETURN: '\ue006',
    SHIFT: '\ue008'
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

  beforeEach: function *(context) {
    context.timeout(30000)
    yield this.app.client.timeouts('implicit', 5000)

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

    this.app.client.addCommand('loadUrl', function (url) {
      return this.execute(function (url) {
        var Immutable = require('immutable')
        var windowActions = require('../js/actions/windowActions')
        windowActions.dispatchViaIPC()
        windowActions.loadUrl(Immutable.fromJS({
          isPinned: false
        }), url)
      }, url).then((response) => response.value)
    })

    this.app.client.addCommand('ipcOn', function (message, fn) {
      return this.execute(function (message, fn) {
        return require('electron').remote.getCurrentWindow().webContents.on(message, fn)
      }, message, fn).then((response) => response.value)
    })

    this.app.client.addCommand('newWindowAction', function (frameOpts, browserOpts) {
      return this.execute(function () {
        return require('../js/actions/appActions').newWindow()
      }, frameOpts, browserOpts).then((response) => response.value)
    })

    /**
     * Adds a site to the sites list, such as a bookmarks.
     *
     * @param {string} siteTag - A site tag from js/constants/siteTags.js
     * @param {object} frameProps - Properties for the frame to add
     *   - location
     *   - title
     *   - isPrivate
     */
    this.app.client.addCommand('addSite', function (frameProps, siteTag) {
      return this.execute(function (frameProps, siteTag) {
        return require('../js/actions/appActions').addSite(frameProps, siteTag)
      }, frameProps, siteTag).then((response) => response.value)
    })

    /**
     * Changes a setting
     *
     * @param {string} key - the setting key to change
     * @param value - The setting value to change to
     */
    this.app.client.addCommand('changeSetting', function (key, value) {
      return this.execute(function (key, value) {
        return require('../js/actions/appActions').changeSetting(key, value)
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
      return this.windowHandles().then(response => response.value).then(function (handles) {
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
      return this.windowHandles().then(response => response.value).then(function (handles) {
        return promiseMapSeries(handles, function (handle) {
          return context.window(handle).getUrl()
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

    this.app.client.addCommand('sendWebviewEvent', function (frameKey, eventName, ...params) {
      return this.execute(function (frameKey, eventName, ...params) {
        const webview = document.querySelector('webview[data-frame-key="' + frameKey + '"]')
        // Get the internal view instance ID from the selected webview
        var v8Util = process.atomBinding('v8_util')
        var internal = v8Util.getHiddenValue(webview, 'internal')
        internal.viewInstanceId
        // This allows you to send more args than just the event itself like would only
        // be possible with dispatchEvent.
        require('electron').ipcRenderer.emit('ATOM_SHELL_GUEST_VIEW_INTERNAL_DISPATCH_EVENT-' + internal.viewInstanceId, ...params)
      }, frameKey, eventName, ...params).then((response) => response.value)
    })

    this.app.client.addCommand('waitForElementFocus', function (selector) {
      let activeElement
      return this.waitUntil(function () {
        return this.elementActive()
          .then(function (el) {
            activeElement = el
            return this.element(selector)
          })
          .then(queryElement => queryElement.value.ELEMENT === activeElement.value.ELEMENT)
      })
    })
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
