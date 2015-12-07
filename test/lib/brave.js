var Application = require('spectron').Application
var chai = require('chai')
require('./coMocha')

var chaiAsPromised = require('chai-as-promised')

chai.should()
chai.use(chaiAsPromised)

class Brave {
  constructor (context) {
    context.timeout(10000)

    context.beforeEach(function () {
      this.app = new Application({
        path: './node_modules/.bin/electron',
        args: ['./']
      })
      return this.app.start()
    })

    context.beforeEach(function () {
      chaiAsPromised.transferPromiseness = this.app.client.transferPromiseness
    })

    context.afterEach(function () {
      if (this.app && this.app.isRunning()) {
        return this.app.stop()
      }
    })
  }
}

module.exports = Brave
