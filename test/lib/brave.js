var Application = require('spectron').Application
var chai = require('chai')
require('./coMocha')

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

  beforeAll: function (context) {
    context.timeout(10000)

    context.beforeAll(function () {
      return exports.startApp.call(this)
    })

    // define ipc send/on
    context.beforeAll(function () {
      exports.addCommands.call(this)
    })

    context.beforeAll(function (done) {
      Server.create(`${__dirname}/../fixtures/`, (err, _server) => {
        if (err) {
          console.log(err.stack)
        }
        exports.server = _server
        done()
      })
    })

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
    context.timeout(10000)

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

    this.app.client.addCommand('getDefaultWindowHeight', function () {
      return this.execute(function () {
        let screen = require('electron').screen
        let primaryDisplay = screen.getPrimaryDisplay()
        return Math.floor(primaryDisplay.bounds.height / 2)
      }).then((response) => response.value)
    })

    this.app.client.addCommand('getDefaultWindowWidth', function () {
      return this.execute(function () {
        let screen = require('electron').screen
        let primaryDisplay = screen.getPrimaryDisplay()
        return Math.floor(primaryDisplay.bounds.width / 2)
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
  },

  startApp: function () {
    this.app = new Application({
      path: './node_modules/.bin/electron',
      args: ['./']
    })
    return this.app.start()
  },

  stopApp: function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop()
    }
  }
}

module.exports = exports
