/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput} = require('../lib/selectors')

describe('ContextMenu', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForEnabled(urlInput)
  }

  describe('navigation', function () {
    Brave.beforeAll(this)

    before(function *() {
      yield setup(this.app.client)
      this.formfill = Brave.server.url('formfill.html')
      this.input = '[name="01___title"]'
      this.values = ['Value 1', 'Value 2', 'Value 3', 'Value 4']

      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.formfill)
        .waitForVisible('<form>')

      for (let i = 0; i < this.values.length; i++) {
        yield this.app.client
          .click(this.input)
          .keys(this.values[i])
          .click('#submit')
          .waitForVisible('<form>')
      }
    })

    it('check if context menu exists', function *() {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.formfill)
        .waitForVisible('<form>')
        .click(this.input)
        .click(this.input)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
    })

    it('check if enter is prevented', function *() {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.formfill)
        .waitForVisible('<form>')
        .click('[name="02frstname"]')
        .keys('Test value')
        .click(this.input)
        .click(this.input)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenu')
        .keys('\uE015')
        .pause(10)
        .keys('\uE015')
        .pause(10)
        .keys('\uE007')
        .pause(10)
        .tabByUrl(this.formfill)
        .getValue('[name="02frstname"]').should.eventually.be.equal('Test value')
        .getValue(this.input).should.eventually.be.equal(this.values[2])
    })

    it('click on item', function *() {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.formfill)
        .waitForVisible('<form>')
        .click(this.input)
        .click(this.input)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenu')
        .click('.contextMenuItem')
        .tabByUrl(this.formfill)
        .getValue(this.input).should.eventually.be.equal(this.values[0])
    })

    it('select item via click and keys', function *() {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.formfill)
        .waitForVisible('<form>')
        .click(this.input)
        .click(this.input)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenu')
        .keys('\uE015')
        .pause(10)
        .keys('\uE015')
        .pause(10)
        .keys('\uE007')
        .pause(10)
        .tabByUrl(this.formfill)
        .getValue(this.input).should.eventually.be.equal(this.values[2])
    })

    it('select item via keys only', function *() {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.formfill)
        .waitForVisible('<form>')
        .click(this.input)
        .windowByUrl(Brave.browserWindowUrl)
        .keys('\uE015')
        .waitForVisible('.contextMenu')
        .keys('\uE015')
        .pause(10)
        .keys('\uE015')
        .pause(10)
        .keys('\uE015')
        .pause(10)
        .keys('\uE015')
        .pause(10)
        .keys('\uE013')
        .pause(10)
        .keys('\uE007')
        .pause(10)
        .tabByUrl(this.formfill)
        .getValue(this.input).should.eventually.be.equal(this.values[3])
    })

    it('check left/right on non sub menu item', function *() {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.formfill)
        .waitForVisible('<form>')
        .click(this.input)
        .windowByUrl(Brave.browserWindowUrl)
        .keys('\uE015')
        .waitForVisible('.contextMenu')
        .keys('\uE012') // left
        .pause(10)
        .keys('\uE014') // right
        .pause(10)
        .keys('\uE014') // right
        .pause(10)
        .keys('\uE012') // left
        .pause(10)
        .keys('\uE015')
        .pause(10)
        .keys('\uE015')
        .pause(10)
        .keys('\uE007')
        .pause(10)
        .tabByUrl(this.formfill)
        .getValue(this.input).should.eventually.be.equal(this.values[2])
    })
  })
})
