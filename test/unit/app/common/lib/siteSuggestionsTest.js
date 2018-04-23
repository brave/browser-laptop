/* global describe, before, after */

const runMuonCompatibleTests = require('../../../runMuonCompatibleTests')
const components = require('./siteSuggestionsTestComponents')
const fakeElectron = require('../../../lib/fakeElectron')
const mockery = require('mockery')

describe('siteSuggestions lib', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
  })
  after(function () {
    mockery.disable()
  })

  runMuonCompatibleTests('urlutil', components)
})
