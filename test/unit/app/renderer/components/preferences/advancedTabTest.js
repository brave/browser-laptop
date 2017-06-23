/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const fakeElectron = require('../../../../lib/fakeElectron')
let AdvancedTab
require('../../../../braveUnit')

describe('AdvancedTab component', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('../../less/switchControls.less', {})
    mockery.registerMock('../../less/about/preferences.less', {})
    mockery.registerMock('../../less/forms.less', {})
    mockery.registerMock('../../less/button.less', {})
    mockery.registerMock('../../node_modules/font-awesome/css/font-awesome.css', {})
    mockery.registerMock('../../../extensions/brave/img/caret_down_grey.svg')

    // default platformUtil to non-Linux
    mockery.registerMock('../../../common/lib/platformUtil', {isLinux: () => false})

    mockery.registerMock('electron', fakeElectron)
    window.chrome = fakeElectron

    AdvancedTab = require('../../../../../../app/renderer/components/preferences/advancedTab')
  })
  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('AdvancedTab', function () {
    describe('previewReleases', function () {
      describe('on macOS', function () {
        it('is shown', function () {
          const wrapper = mount(
            <AdvancedTab onChangeSetting={null} />
          )
          const instance = wrapper.instance()
          assert(instance.previewReleases())
        })
      })

      describe('on Linux', function () {
        before(function () {
          mockery.deregisterMock('../../../common/lib/platformUtil')
          mockery.registerMock('../../../common/lib/platformUtil', {isLinux: () => true})
          mockery.resetCache()
          AdvancedTab = require('../../../../../../app/renderer/components/preferences/advancedTab')
        })

        after(function () {
          mockery.deregisterMock('../../../common/lib/platformUtil')
          mockery.registerMock('../../../common/lib/platformUtil', {isLinux: () => false})
          mockery.resetCache()
          AdvancedTab = require('../../../../../../app/renderer/components/preferences/advancedTab')
        })

        it('is hidden', function () {
          const wrapper = mount(
            <AdvancedTab onChangeSetting={null} />
          )
          const instance = wrapper.instance()
          assert.equal(instance.previewReleases(), null)
        })
      })
    })
  })
})
