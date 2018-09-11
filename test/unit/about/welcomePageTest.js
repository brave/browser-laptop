/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {shallow} = require('enzyme')
const assert = require('assert')
let AboutWelcome
require('../braveUnit')

describe('AboutWelcome component', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('../../../less/about/common.less', {})
    mockery.registerMock('../../extensions/brave/img/preferences/ads_welcome_BG.png')
    AboutWelcome = require('../../../app/renderer/about/welcome')
  })

  after(function () {
    mockery.disable()
  })

  describe('Rendering', function () {
    it('renders an iframe', function () {
      const wrapper = shallow(
        AboutWelcome
      )
      assert.equal(wrapper.find('[data-test-id="welcomeIframe"]').length, 1)
    })
  })
})
