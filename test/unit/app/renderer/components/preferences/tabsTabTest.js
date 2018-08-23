/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount, shallow} = require('enzyme')
const {tabCloseAction, tabPreviewTiming} = require('../../../../../../app/common/constants/settingsEnums')
const {
  tabsPerTabPageActiveOption,
  tabCloseActionActiveOption,
  tabPreviewTimingActiveOption
} = require('../../../../../lib/selectors')
const assert = require('assert')
const fakeElectron = require('../../../../lib/fakeElectron')
require('../../../../braveUnit')

describe('TabsTab component', function () {
  let settingDefaultValue, TabsTab

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('../../../extensions/brave/img/caret_down_grey.svg', 'caret_down_grey.svg')
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../../js/settings', {
      getSetting: () => settingDefaultValue
    })
    TabsTab = require('../../../../../../app/renderer/components/preferences/tabsTab')
  })
  after(function () {
    mockery.disable()
  })

  describe('rendering', function () {
    it('component should render', function () {
      const wrapper = mount(<TabsTab />)
      assert.equal(wrapper.length, 1)
    })
  })

  describe('number of tabs per tab set', function () {
    it('can switch to 6 tabs', function () {
      settingDefaultValue = 6
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.equal(
        wrapper
          .find(tabsPerTabPageActiveOption)
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })
    it('can switch to 8 tabs', function () {
      settingDefaultValue = 8
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.equal(
        wrapper
          .find(tabsPerTabPageActiveOption)
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })
    it('can switch to 10 tabs', function () {
      settingDefaultValue = 10
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.equal(
        wrapper
          .find(tabsPerTabPageActiveOption)
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })
    it('defaults to 20 tabs', function () {
      settingDefaultValue = 20
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.equal(
        wrapper
          .find(tabsPerTabPageActiveOption)
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })
    it('can switch to 100 tabs', function () {
      settingDefaultValue = 100
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.equal(
        wrapper
          .find(tabsPerTabPageActiveOption)
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })
    it('can not switch to other values', function () {
      settingDefaultValue = 'what else?'
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.notEqual(
        wrapper
          .find(tabsPerTabPageActiveOption)
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })
  })

  describe('when closing an active tab', function () {
    it('can select its parent tab', function () {
      settingDefaultValue = tabCloseAction.PARENT
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.equal(
        wrapper
          .find(tabCloseActionActiveOption)
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })
    it('can select the last viewed tab', function () {
      settingDefaultValue = tabCloseAction.LAST_ACTIVE
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.equal(
        wrapper
          .find(tabCloseActionActiveOption)
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })
    it('can select the next tab', function () {
      settingDefaultValue = tabCloseAction.NEXT
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.equal(
        wrapper
          .find(tabCloseActionActiveOption)
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })
    it('can not select other value', function () {
      settingDefaultValue = tabCloseAction.I_HAVE_NO_IDEA_WHAT_IM_DOING
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.notEqual(
        wrapper
          .find(tabCloseActionActiveOption)
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })
  })

  describe('tab preview functionality', function () {
    it('can show tab previews on hover', function () {
      settingDefaultValue = true
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.notEqual(
        wrapper
          .find('[dataTestId="showTabPreviews"]')
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })
    it('show all 3 tab preview timing options if tab preview is on', function () {
      settingDefaultValue = true
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)
      assert.equal(wrapper.find(tabPreviewTimingActiveOption).length, 3)
    })
    it('does not show tab preview timing options if tab preview is off', function () {
      settingDefaultValue = false
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)
      assert.equal(wrapper.find(tabPreviewTimingActiveOption).length, 0)
    })
    it('can switch tab previews time to activate previews to LONG', function () {
      settingDefaultValue = tabPreviewTiming.LONG
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.equal(
        wrapper
          .find(tabPreviewTimingActiveOption)
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })
    it('can switch tab previews time to activate previews to NONE', function () {
      settingDefaultValue = tabPreviewTiming.NONE
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.equal(
        wrapper
          .find(tabPreviewTimingActiveOption)
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })
    it('can switch tab previews time to activate previews to SHORT', function () {
      settingDefaultValue = tabPreviewTiming.SHORT
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.equal(
        wrapper
          .find(tabPreviewTimingActiveOption)
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })
    it('can not switch to other values', function () {
      settingDefaultValue = tabPreviewTiming.ONLY_ONCE_IN_A_LIFETIME
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.notEqual(
        wrapper
          .find(tabPreviewTimingActiveOption)
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })
  })

  describe('basic functionality', function () {
    it('can switch to new tabs immediately', function () {
      settingDefaultValue = true
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.notEqual(
        wrapper
          .find('[dataTestId="switchToNewTabs"]')
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })
    it('can show tabs in page theme color', function () {
      settingDefaultValue = true
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.notEqual(
        wrapper
          .find('[dataTestId="paintTabs"]')
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })

    it('dashboard can show images', function () {
      settingDefaultValue = true
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.notEqual(
        wrapper.find('[dataTestId="dashboardShowImages"]')
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })

    it('dashboard shows a 12/24 hour clock', function () {
      settingDefaultValue = true
      const wrapper = shallow(<TabsTab settings={settingDefaultValue} />)

      assert.notEqual(
        wrapper.find('[dataTestId="clockDisplayTwentyFour"]')
          .map(option => option.props().value)
          .includes(settingDefaultValue),
        true
      )
    })
  })
})
