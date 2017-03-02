/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount, shallow} = require('enzyme')
const sinon = require('sinon')
const assert = require('assert')
const Immutable = require('immutable')
const config = require('../../../../../js/constants/config')
let MessageBox, appActions
require('../../../braveUnit')

describe('MessageBox component unit tests', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', require('../../../lib/fakeElectron'))
    MessageBox = require('../../../../../app/renderer/components/messageBox')
    appActions = require('../../../../../js/actions/appActions')
  })
  after(function () {
    mockery.disable()
  })

  const tabId = 1
  const detail1 = {
    title: 'An embedded page at brave.com says:',
    message: 'Example message',
    buttons: ['OK', 'Cancel'],
    cancelId: 1,
    suppress: true,
    showSuppress: true
  }

  describe('Object properties', function () {
    describe('tabId', function () {
      it('binds the text from the detail object', function () {
        const wrapper = shallow(
          <MessageBox
            tabId={tabId}
            detail={Immutable.fromJS(detail1)}
          />
        )
        const instance = wrapper.instance()
        assert.equal(instance.tabId, tabId)
      })

      it('defaults to "" if detail has falsey value', function () {
        const wrapper = shallow(
          <MessageBox
            detail={Immutable.fromJS(detail1)}
          />
        )
        const instance = wrapper.instance()
        assert.equal(instance.tabId, '')
      })
    })

    describe('title', function () {
      it('binds the text from the detail object', function () {
        const detail2 = Object.assign({}, detail1)
        detail2.title = 'example title'
        const wrapper = shallow(
          <MessageBox
            tabId={tabId}
            detail={Immutable.fromJS(detail2)}
          />
        )
        const instance = wrapper.instance()
        assert.equal(instance.title, detail2.title)
      })

      it('defaults to "" if detail has falsey value', function () {
        const detail2 = Object.assign({}, detail1)
        detail2.title = undefined
        const wrapper = shallow(
          <MessageBox
            tabId={tabId}
            detail={Immutable.fromJS(detail2)}
          />
        )
        const instance = wrapper.instance()
        assert.equal(instance.title, '')
      })

      it('replaces the Brave extensionId with "Brave"', function () {
        const detail2 = Object.assign({}, detail1)
        detail2.title = config.braveExtensionId + ' says:'
        const wrapper = shallow(
          <MessageBox
            tabId={tabId}
            detail={Immutable.fromJS(detail2)}
          />
        )
        const instance = wrapper.instance()
        assert.equal(instance.title, 'Brave says:')
      })
    })

    describe('message', function () {
      it('binds the text from the detail object', function () {
        const wrapper = shallow(
          <MessageBox
            tabId={tabId}
            detail={Immutable.fromJS(detail1)}
          />
        )
        const instance = wrapper.instance()
        assert.equal(instance.message, detail1.message)
      })

      it('defaults to "" if detail has falsey value', function () {
        const detail2 = Object.assign({}, detail1)
        detail2.message = undefined
        const wrapper = shallow(
          <MessageBox
            tabId={tabId}
            detail={Immutable.fromJS(detail2)}
          />
        )
        const instance = wrapper.instance()
        assert.equal(instance.message, '')
      })
    })

    describe('buttons', function () {
      it('binds the buttons from the detail object', function () {
        const wrapper = shallow(
          <MessageBox
            tabId={tabId}
            detail={Immutable.fromJS(detail1)}
          />
        )
        const instance = wrapper.instance()
        assert.deepEqual(instance.buttons.toJS(), detail1.buttons)
      })

      it('defaults to "[OK]" if detail has falsey value', function () {
        const detail2 = Object.assign({}, detail1)
        detail2.buttons = undefined
        const wrapper = shallow(
          <MessageBox
            tabId={tabId}
            detail={Immutable.fromJS(detail2)}
          />
        )
        const instance = wrapper.instance()
        assert.deepEqual(instance.buttons.toJS(), ['ok'])
      })
    })

    describe('cancelId', function () {
      it('binds the cancelId from the detail object', function () {
        const wrapper = shallow(
          <MessageBox
            tabId={tabId}
            detail={Immutable.fromJS(detail1)}
          />
        )
        const instance = wrapper.instance()
        assert.equal(instance.cancelId, detail1.cancelId)
      })

      it('does not have a default if value is falsey', function () {
        const detail2 = Object.assign({}, detail1)
        detail2.cancelId = undefined
        const wrapper = shallow(
          <MessageBox
            tabId={tabId}
            detail={Immutable.fromJS(detail2)}
          />
        )
        const instance = wrapper.instance()
        assert.equal(instance.cancelId, undefined)
      })
    })

    describe('suppress', function () {
      it('binds the suppress from the detail object', function () {
        const wrapper = shallow(
          <MessageBox
            tabId={tabId}
            detail={Immutable.fromJS(detail1)}
          />
        )
        const instance = wrapper.instance()
        assert.equal(instance.suppress, detail1.suppress)
      })

      it('defaults to false if detail has falsey value', function () {
        const detail2 = Object.assign({}, detail1)
        detail2.suppress = undefined
        const wrapper = shallow(
          <MessageBox
            tabId={tabId}
            detail={Immutable.fromJS(detail2)}
          />
        )
        const instance = wrapper.instance()
        assert.equal(instance.suppress, false)
      })
    })

    describe('showSuppress', function () {
      it('binds the showSuppress from the detail object', function () {
        const wrapper = shallow(
          <MessageBox
            tabId={tabId}
            detail={Immutable.fromJS(detail1)}
          />
        )
        const instance = wrapper.instance()
        assert.equal(instance.showSuppress, detail1.showSuppress)
      })

      it('defaults to false if detail has falsey value', function () {
        const detail2 = Object.assign({}, detail1)
        detail2.showSuppress = undefined
        const wrapper = shallow(
          <MessageBox
            tabId={tabId}
            detail={Immutable.fromJS(detail2)}
          />
        )
        const instance = wrapper.instance()
        assert.equal(instance.showSuppress, false)
      })
    })
  })

  describe('Rendering', function () {
    it('renders itself inside a dialog component', function () {
      const wrapper = mount(
        <MessageBox
          tabId={tabId}
          detail={Immutable.fromJS(detail1)}
        />
      )
      assert.equal(wrapper.find('div.dialog').length, 1)
    })

    it('renders the suppress checkbox if showSuppress is true', function () {
      const wrapper = mount(
        <MessageBox
          tabId={tabId}
          detail={Immutable.fromJS(detail1)}
        />
      )
      assert.equal(wrapper.find('div.switchControl').length, 1)
    })

    it('hides the suppress checkbox if showSuppress is false', function () {
      const detail2 = Object.assign({}, detail1)
      detail2.showSuppress = false
      const wrapper = mount(
        <MessageBox
          tabId={tabId}
          detail={Immutable.fromJS(detail2)}
        />
      )
      assert.equal(wrapper.find('div.switchControl').length, 0)
    })

    it('renders the button index 0 as primaryButton', function () {
      const wrapper = mount(
        <MessageBox
          tabId={tabId}
          detail={Immutable.fromJS(detail1)}
        />
      )
      assert.equal(wrapper.find('button[data-l10n-id="OK"].primaryButton').length, 1)
    })

    it('renders the button index 1 as whiteButton', function () {
      const wrapper = mount(
        <MessageBox
          tabId={tabId}
          detail={Immutable.fromJS(detail1)}
        />
      )
      assert.equal(wrapper.find('button[data-l10n-id="Cancel"].whiteButton').length, 1)
    })
  })

  describe('Events', function () {
    it('calls appActions.tabMessageBoxUpdated when SwitchControl is toggled', function () {
      const spy = sinon.spy(appActions, 'tabMessageBoxUpdated')
      const wrapper = mount(
        <MessageBox
          tabId={tabId}
          detail={Immutable.fromJS(detail1)}
        />
      )
      wrapper.find('.switchBackground').simulate('click')
      assert.equal(spy.calledOnce, true)
      appActions.tabMessageBoxUpdated.restore()
    })

    it('calls appActions.tabMessageBoxDismissed with result=true when OK is clicked', function () {
      const spy = sinon.spy(appActions, 'tabMessageBoxDismissed')
      const wrapper = mount(
        <MessageBox
          tabId={tabId}
          detail={Immutable.fromJS(detail1)}
        />
      )
      const response = {
        suppress: detail1.suppress,
        result: true
      }
      wrapper.find('button[data-l10n-id="OK"].primaryButton').simulate('click')
      assert.equal(spy.withArgs(tabId, response).calledOnce, true)
      appActions.tabMessageBoxDismissed.restore()
    })

    it('calls appActions.tabMessageBoxDismissed with result=false when cancel is clicked', function () {
      const spy = sinon.spy(appActions, 'tabMessageBoxDismissed')
      const wrapper = mount(
        <MessageBox
          tabId={tabId}
          detail={Immutable.fromJS(detail1)}
        />
      )
      const response = {
        suppress: detail1.suppress,
        result: false
      }
      wrapper.find('button[data-l10n-id="Cancel"].whiteButton').simulate('click')
      assert.equal(spy.withArgs(tabId, response).calledOnce, true)
      appActions.tabMessageBoxDismissed.restore()
    })
  })
})
