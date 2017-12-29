/* global describe, it, before, after, afterEach */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')
const fakeElectron = require('../../lib/fakeElectron')

require('../../braveUnit')

describe('share API', function () {
  let share
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)

    this.mockTabs = {
      create: sinon.stub()
    }
    mockery.registerMock('./tabs', this.mockTabs)
    share = require('../../../../app/browser/share')
  })

  after(function () {
    mockery.disable()
  })

  describe('simpleShareActiveTab', function () {
    before(function () {
      this.state = Immutable.fromJS({
        tabs: [{
          windowId: 2,
          tabId: 2,
          url: 'https://www.brave.com/2',
          title: 'title 2',
          active: true
        }, {
          windowId: 3,
          tabId: 3,
          url: 'https://www.brave.com/3',
          title: 'title 3'
        }, {
          windowId: 5,
          tabId: 5,
          url: 'https://www.brave.com/5',
          title: 'title 5',
          active: true
        }]
      })
      this.windowId = 2
      this.openExternalSpy = sinon.spy(fakeElectron.shell, 'openExternal')
    })
    afterEach(function () {
      this.openExternalSpy.reset()
      this.mockTabs.create.reset()
    })
    describe('email', function () {
      it('calls openExternal with the correct args', function () {
        share.simpleShareActiveTab(this.state, 2, 'email')
        const expectedUrl = 'mailto:?subject=title%202&body=https%3A%2F%2Fwww.brave.com%2F2'
        const callCount = this.openExternalSpy.withArgs(expectedUrl).callCount
        assert.equal(callCount, 1)
        assert.equal(this.mockTabs.create.withArgs(expectedUrl).callCount, 0)
      })
      it('takes active tab windowId into consideration', function () {
        share.simpleShareActiveTab(this.state, 5, 'email')
        const expectedUrl = 'mailto:?subject=title%205&body=https%3A%2F%2Fwww.brave.com%2F5'
        const callCount = this.openExternalSpy.withArgs(expectedUrl).callCount
        assert.equal(callCount, 1)
        assert.equal(this.mockTabs.create.withArgs(expectedUrl).callCount, 0)
      })
    })
    describe('other share page links', function () {
      it('calls createTabRequested with correct args', function () {
        Object.entries(share.templateUrls).forEach(([shareType, template]) => {
          if (shareType === 'email') {
            return
          }
          share.simpleShareActiveTab(this.state, 5, shareType)
          const expectedUrl = template
            .replace('{url}', 'https%3A%2F%2Fwww.brave.com%2F5')
            .replace('{title}', 'title%205')
          assert.equal(this.openExternalSpy.withArgs({url: expectedUrl}).callCount, 0)
          assert.equal(this.mockTabs.create.callCount, 1)
          assert.equal(this.mockTabs.create.args[0][0].url, expectedUrl)
          this.openExternalSpy.reset()
          this.mockTabs.create.reset()
        })
      })
    })
  })
})
