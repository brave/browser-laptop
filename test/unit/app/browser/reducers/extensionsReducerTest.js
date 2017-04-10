/* global describe, it, before, after */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')
const fakeElectron = require('../../../lib/fakeElectron')

const ExtensionConstants = require('../../../../../app/common/constants/extensionConstants')
require('../../../braveUnit')

const extensionState = (extensionId) => Immutable.fromJS({
  extensions: {
    [extensionId]: {
      'excluded': false,
      'enabled': true,
      'name': extensionId,
      'url': `chrome-extension://${extensionId}/`,
      'manifest': {
        'icons': {
          '128': ''
        }
      },
      base_path: '',
      version: '123.456',
      id: extensionId,
      description: 'automagically creates a cup of coffee after each test added'
    }
  }
})

describe('extensionsReducer', function () {
  let extensionsReducer
  const fakeRimraf = sinon.stub()

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('rimraf', fakeRimraf)
    extensionsReducer = require('../../../../../app/browser/reducers/extensionsReducer')
  })

  after(function () {
    mockery.disable()
  })

  describe('EXTENSION_UNINSTALLED', function () {
    before(function () {
      fakeRimraf.reset()
      this.extension = 'testableCoffeeId'
      this.newState = extensionsReducer(extensionState(this.extension), {
        actionType: ExtensionConstants.EXTENSION_UNINSTALLED,
        extensionId: this.extension
      })
    })
    it('calls rimraf to remove the folder', function () {
      assert.equal(fakeRimraf.calledOnce, true)
    })
    it('sets excluded state to true', function () {
      assert.equal(this.newState.getIn(['extensions', this.extension, 'excluded']), true)
    })
  })
})
