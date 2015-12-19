/* global describe, it */

const Brave = require('./lib/brave')

describe('application launch', function () {
  const brave = new Brave(this) // eslint-disable-line
  it('opens a window and loads the UI', function *() {
    yield this.app.client.waitUntilWindowLoaded()
      .isWindowMinimized().should.eventually.be.false
      .isWindowDevToolsOpened().should.eventually.be.false
      .isWindowVisible().should.eventually.be.true
      .isWindowFocused().should.eventually.be.true
      .getWindowWidth().should.eventually.be.above(0)
      .getWindowHeight().should.eventually.be.above(0)
      .waitForVisible('#browser')
  })
})
