/* global describe, it, before, after */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const fakeElectron = require('../../../lib/fakeElectron')

const windowConstants = require('../../../../../js/constants/windowConstants')
require('../../../braveUnit')

const windowState = Immutable.fromJS({
  activeFrameKey: 2,
  frames: [{
    key: 1
  }, {
    key: 2,
    title: 'test',
    adblock: {blocked: []},
    audioPlaybackActive: true,
    computedThemeColor: '#ff0000',
    httpsEverywhere: {a: '1'},
    icon: 'https://www.brave.com/favicon.ico',
    location: 'https://www.brave.com/2',
    noScript: {blocked: []},
    themeColor: '#ffffff',
    trackingProtection: {blocked: []},
    fingerprintingProtection: {blocked: []}
  }, {
    key: 3,
    location: 'about:newtab'
  }]
})

describe('urlBarReducer', function () {
  let urlBarReducer
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    urlBarReducer = require('../../../../../app/renderer/reducers/urlBarReducer')
  })

  after(function () {
    mockery.disable()
  })

  describe('WINDOW_SET_NAVBAR_INPUT', function () {
    before(function () {
      this.location = 'this test is brought to you by coffee.'
      this.newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_SET_NAVBAR_INPUT, location: this.location})
    })

    it('Changes urlbar state for active frame key', function () {
      assert.equal(this.newState.getIn(['frames', 1, 'navbar', 'urlbar', 'location']), this.location)
    })

    it('Does not change url bar state of non active frame key', function () {
      assert.equal(this.newState.getIn(['frames', 0, 'navbar', 'urlbar', 'location']), undefined)
    })
  })

  describe('WINDOW_SET_NAVIGATED', function () {
    describe('Basic', function () {
      it('updates navbar navbar for URL navigation', function () {
        this.location = 'https:/www.brave.com/3'
        this.newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_SET_NAVIGATED, location: this.location})
        assert.equal(this.newState.getIn(['frames', 1, 'navbar', 'urlbar', 'location']), this.location)
      })
      it('does not update navbar for about:newtab nav', function () {
        this.location = 'about:newtab'
        this.newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_SET_NAVIGATED, location: this.location, key: 3})
        assert.equal(this.newState.getIn(['frames', 2, 'navbar', 'urlbar', 'location']), undefined)
      })
    })
    describe('In page navigation', function () {
      before(function () {
        this.location = 'https://www.brave.com/'
        this.newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_SET_NAVIGATED, location: this.location, isNavigatedInPage: true})
      })
      it('does not reset values', function () {
        assert.equal(this.newState.getIn(['frames', 1, 'title']), 'test')
        assert.deepEqual(this.newState.getIn(['frames', 1, 'adblock']).toJS(), {blocked: []})
        assert.equal(this.newState.getIn(['frames', 1, 'audioPlaybackActive']), true)
        assert.equal(this.newState.getIn(['frames', 1, 'computedThemeColor']), '#ff0000')
        assert.deepEqual(this.newState.getIn(['frames', 1, 'httpsEverywhere']).toJS(), {a: '1'})
        assert.equal(this.newState.getIn(['frames', 1, 'icon']), 'https://www.brave.com/favicon.ico')
        assert.equal(this.newState.getIn(['frames', 1, 'location']), this.location)
        assert.deepEqual(this.newState.getIn(['frames', 1, 'noScript']).toJS(), {blocked: []})
        assert.equal(this.newState.getIn(['frames', 1, 'themeColor']), '#ffffff')
        assert.deepEqual(this.newState.getIn(['frames', 1, 'trackingProtection']).toJS(), {blocked: []})
        assert.deepEqual(this.newState.getIn(['frames', 1, 'fingerprintingProtection']).toJS(), {blocked: []})
      })
    })
    describe('Navigation', function () {
      before(function () {
        this.location = 'https://www.brave.com/'
        this.newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_SET_NAVIGATED, location: this.location})
      })
      it('resets values', function () {
        assert.equal(this.newState.getIn(['frames', 1, 'title']), '')
        assert.deepEqual(this.newState.getIn(['frames', 1, 'adblock']).toJS(), {})
        assert.equal(this.newState.getIn(['frames', 1, 'audioPlaybackActive']), false)
        assert.equal(this.newState.getIn(['frames', 1, 'computedThemeColor']), undefined)
        assert.deepEqual(this.newState.getIn(['frames', 1, 'httpsEverywhere']).toJS(), {})
        assert.equal(this.newState.getIn(['frames', 1, 'icon']), undefined)
        assert.equal(this.newState.getIn(['frames', 1, 'location']), this.location)
        assert.deepEqual(this.newState.getIn(['frames', 1, 'noScript']).toJS(), {})
        assert.equal(this.newState.getIn(['frames', 1, 'themeColor']), undefined)
        assert.deepEqual(this.newState.getIn(['frames', 1, 'trackingProtection']).toJS(), {})
        assert.deepEqual(this.newState.getIn(['frames', 1, 'fingerprintingProtection']).toJS(), {})
      })
    })
  })
})
