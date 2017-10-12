/* global describe, it, before, after */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')
const fakeElectron = require('../../../lib/fakeElectron')

const appConstants = require('../../../../../js/constants/appConstants')
require('../../../braveUnit')

describe('clipboardReducer', function () {
  let clipboardReducer
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    clipboardReducer = require('../../../../../app/browser/reducers/clipboardReducer')
  })

  after(function () {
    mockery.disable()
  })

  describe('APP_CLIPBOARD_TEXT_UPDATED', function () {
    before(function () {
      this.spy = sinon.spy(fakeElectron.clipboard, 'writeText')
      // Make sure clipboardReducer doesn't update state when text is updated
      this.text = 'Mn = 2n − 1'
      this.newState = clipboardReducer(Immutable.Map(), {actionType: appConstants.APP_CLIPBOARD_TEXT_UPDATED, text: this.text})
      fakeElectron.clipboard.writeText.restore()
    })
    it('Does not modify state', function () {
      assert(this.newState.isEmpty())
    })
    it('Copies text into electron.clipboard', function () {
      assert(this.spy.withArgs(this.text).calledOnce)
    })
  })
})
