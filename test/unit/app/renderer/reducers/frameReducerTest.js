/* global describe, it, before, after */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const fakeElectron = require('../../../lib/fakeElectron')

const windowConstants = require('../../../../../js/constants/windowConstants')
require('../../../braveUnit')

const windowState = Immutable.fromJS({
  activeFrameKey: 2,
  searchDetail: {},
  frames: [{
    key: 1,
    tabId: 1,
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
    key: 2,
    tabId: 2,
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
  }],
  framesInternal: {
    index: {
      1: 0,
      2: 1
    },
    tabIndex: {
      1: 0,
      2: 1
    }
  }
})

describe('frameReducer', function () {
  let frameReducer
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    frameReducer = require('../../../../../app/renderer/reducers/frameReducer')
  })
  after(function () {
    mockery.disable()
  })

  describe('WINDOW_SET_NAVIGATED', function () {
    describe('In page navigation', function () {
      before(function () {
        this.location = 'https://www.brave.com/'
        this.newState = frameReducer(windowState, {
          actionType: windowConstants.WINDOW_SET_NAVIGATED,
          location: this.location,
          isNavigatedInPage: true,
          key: 2
        })
      })
      it('sets the location for the specified `key`', function () {
        assert.equal(this.newState.getIn(['frames', 1, 'location']), this.location)
      })
      it('does not reset values', function () {
        assert.equal(this.newState.getIn(['frames', 1, 'title']), 'test')
        assert.deepEqual(this.newState.getIn(['frames', 1, 'adblock']).toJS(), {blocked: []})
        assert.equal(this.newState.getIn(['frames', 1, 'audioPlaybackActive']), true)
        assert.equal(this.newState.getIn(['frames', 1, 'computedThemeColor']), '#ff0000')
        assert.deepEqual(this.newState.getIn(['frames', 1, 'httpsEverywhere']).toJS(), {a: '1'})
        assert.equal(this.newState.getIn(['frames', 1, 'icon']), 'https://www.brave.com/favicon.ico')
        assert.deepEqual(this.newState.getIn(['frames', 1, 'noScript']).toJS(), {blocked: []})
        assert.equal(this.newState.getIn(['frames', 1, 'themeColor']), '#ffffff')
        assert.deepEqual(this.newState.getIn(['frames', 1, 'trackingProtection']).toJS(), {blocked: []})
        assert.deepEqual(this.newState.getIn(['frames', 1, 'fingerprintingProtection']).toJS(), {blocked: []})
        assert.equal(this.newState.getIn(['frames', 0, 'title']), 'test')
        assert.deepEqual(this.newState.getIn(['frames', 0, 'adblock']).toJS(), {blocked: []})
        assert.equal(this.newState.getIn(['frames', 0, 'audioPlaybackActive']), true)
        assert.equal(this.newState.getIn(['frames', 0, 'computedThemeColor']), '#ff0000')
        assert.deepEqual(this.newState.getIn(['frames', 0, 'httpsEverywhere']).toJS(), {a: '1'})
        assert.equal(this.newState.getIn(['frames', 0, 'icon']), 'https://www.brave.com/favicon.ico')
        assert.equal(this.newState.getIn(['frames', 0, 'location']), 'https://www.brave.com/2')
        assert.deepEqual(this.newState.getIn(['frames', 0, 'noScript']).toJS(), {blocked: []})
        assert.equal(this.newState.getIn(['frames', 0, 'themeColor']), '#ffffff')
        assert.deepEqual(this.newState.getIn(['frames', 0, 'trackingProtection']).toJS(), {blocked: []})
        assert.deepEqual(this.newState.getIn(['frames', 0, 'fingerprintingProtection']).toJS(), {blocked: []})
      })
    })
    describe('Navigation', function () {
      before(function () {
        this.location = 'https://www.brave.com/'
        this.newState = frameReducer(windowState, {
          actionType: windowConstants.WINDOW_SET_NAVIGATED,
          location: this.location,
          key: 2
        })
      })
      it('sets the location for the specified `key`', function () {
        assert.equal(this.newState.getIn(['frames', 1, 'location']), this.location)
      })
      it('resets values for the active frame key', function () {
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
      it('does not reset values for other frames', function () {
        assert.equal(this.newState.getIn(['frames', 0, 'title']), 'test')
        assert.deepEqual(this.newState.getIn(['frames', 0, 'adblock']).toJS(), {blocked: []})
        assert.equal(this.newState.getIn(['frames', 0, 'audioPlaybackActive']), true)
        assert.equal(this.newState.getIn(['frames', 0, 'computedThemeColor']), '#ff0000')
        assert.deepEqual(this.newState.getIn(['frames', 0, 'httpsEverywhere']).toJS(), {a: '1'})
        assert.equal(this.newState.getIn(['frames', 0, 'icon']), 'https://www.brave.com/favicon.ico')
        assert.equal(this.newState.getIn(['frames', 0, 'location']), 'https://www.brave.com/2')
        assert.deepEqual(this.newState.getIn(['frames', 0, 'noScript']).toJS(), {blocked: []})
        assert.equal(this.newState.getIn(['frames', 0, 'themeColor']), '#ffffff')
        assert.deepEqual(this.newState.getIn(['frames', 0, 'trackingProtection']).toJS(), {blocked: []})
        assert.deepEqual(this.newState.getIn(['frames', 0, 'fingerprintingProtection']).toJS(), {blocked: []})
      })
    })
  })
})
