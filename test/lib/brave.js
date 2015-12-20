var Application = require('spectron').Application
var chai = require('chai')
require('./coMocha')

var chaiAsPromised = require('chai-as-promised')

chai.should()
chai.use(chaiAsPromised)

var exports = {
  beforeAll: function (context) {
    context.timeout(10000)

    context.beforeAll(function () {
      return exports.startApp.call(this)
    })

    // define ipc send/on
    context.beforeAll(function () {
      exports.addCommands.call(this)
    })

    context.beforeEach(function () {
      chaiAsPromised.transferPromiseness = this.app.client.transferPromiseness
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
    this.app.client.addCommand('ipcSend', function (message) {
      return this.execute(function (message) {
        return require('electron').remote.getCurrentWindow().webContents.send(message)
      }, message).then((response) => response.value)
    })

    this.app.client.addCommand('ipcOn', function (message) {
      return this.execute(function (message) {
        return require('electron').remote.getCurrentWindow().webContents.on(message)
      }, message).then((response) => response.value)
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
