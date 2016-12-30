/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount, shallow} = require('enzyme')
const assert = require('assert')
const sinon = require('sinon')
const fakeElectron = require('../../lib/fakeElectron')
let TabIcon, AudioTabIcon
require('../../braveUnit')

describe('tabIcon component', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    TabIcon = require('../../../../app/renderer/components/tabIcon').TabIcon
    AudioTabIcon = require('../../../../app/renderer/components/tabIcon').AudioTabIcon
  })
  after(function () {
    mockery.disable()
  })

  describe('TabIcon', function () {
    it('should call onClick callback', function () {
      const onClick = sinon.spy()
      const wrapper = shallow(<TabIcon onClick={onClick} />)
      wrapper.find('div').simulate('click')
      assert(onClick.calledOnce)
    })
  })

  describe('AudioTabIcon', function () {
    it('should call onClick callback', function () {
      const onClick = sinon.spy()
      const wrapper = mount(<AudioTabIcon onClick={onClick} />)
      wrapper.find('div').simulate('click')
      assert(onClick.calledOnce)
    })
    it('should render a TabIcon with withBlueIcon prop', function () {
      const wrapper = mount(<AudioTabIcon />)
      assert.ok(wrapper.find(TabIcon).props().withBlueIcon)
    })
  })
})
