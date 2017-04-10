/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
const fakeElectron = require('../../lib/fakeElectron')
const {passwordManagers} = require('../../../../js/constants/passwordManagers')
const config = require('../../../../js/constants/config')
let ExtensionsTab
require('../../braveUnit')

describe('ExtensionsTab component', function () {
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

    mockery.registerMock('../../../../extensions/brave/img/extensions/1password-128.png')
    mockery.registerMock('../../../../extensions/brave/img/extensions/bitwarden-128.png')
    mockery.registerMock('../../../../extensions/brave/img/extensions/dashlane-128.png')
    mockery.registerMock('../../../../extensions/brave/img/extensions/lastpass-128.png')
    mockery.registerMock('../../../../extensions/brave/img/extensions/pdfjs-128.png')
    mockery.registerMock('../../../../extensions/brave/img/extensions/pocket-128.png')
    mockery.registerMock('../../../../extensions/brave/img/sync-128.png')
    mockery.registerMock('../../../../extensions/torrent/img/extensions/webtorrent-128.png')

    mockery.registerMock('electron', fakeElectron)
    window.chrome = fakeElectron
    ExtensionsTab = require('../../../../app/renderer/components/preferences/extensionsTab')
  })
  after(function () {
    mockery.disable()
  })

  describe('extensionsTab', function () {
    const extensions = (extensionId, isEnabled, isExcluded) => Immutable.fromJS({
      [extensionId]: {
        'enabled': isEnabled,
        'excluded': isExcluded,
        'name': 'coffee extension',
        'url': '',
        'manifest': {},
        base_path: '',
        version: '123456',
        id: extensionId,
        description: 'gives you a free cup of coffee every time a test passes'
      }
    })

    describe('password managers extensions', function () {
      describe('onepassword', function () {
        it('shows on UI by default', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(passwordManagers.ONE_PASSWORD, false, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find(`[data-extension-id="${passwordManagers.ONE_PASSWORD}"]`).length, 1)
        })
        it('can be excluded', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(passwordManagers.ONE_PASSWORD, false, true)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find(`[data-extension-id="${passwordManagers.ONE_PASSWORD}"]`).length, 0)
        })
        it('can be enabled', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(passwordManagers.ONE_PASSWORD, true, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find('[data-extension-enabled=true]').length, 1)
        })
        it('can be disabled', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(passwordManagers.ONE_PASSWORD, false, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find('[data-extension-enabled=false]').length, 1)
        })
      })
      describe('lastpass', function () {
        it('shows on UI by default', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(passwordManagers.LAST_PASS, false, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find(`[data-extension-id="${passwordManagers.LAST_PASS}"]`).length, 1)
        })
        it('can be excluded', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(passwordManagers.LAST_PASS, false, true)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find(`[data-extension-id="${passwordManagers.LAST_PASS}"]`).length, 0)
        })
        it('can be enabled', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(passwordManagers.LAST_PASS, true, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find('[data-extension-enabled=true]').length, 1)
        })
        it('can be disabled', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(passwordManagers.LAST_PASS, false, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find('[data-extension-enabled=false]').length, 1)
        })
      })
      describe('dashlane', function () {
        it('shows on UI by default', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(passwordManagers.DASHLANE, false, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find(`[data-extension-id="${passwordManagers.DASHLANE}"]`).length, 1)
        })
        it('can be excluded', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(passwordManagers.DASHLANE, false, true)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find(`[data-extension-id="${passwordManagers.DASHLANE}"]`).length, 0)
        })
        it('can be enabled', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(passwordManagers.DASHLANE, true, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find('[data-extension-enabled=true]').length, 1)
        })
        it('can be disabled', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(passwordManagers.DASHLANE, false, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find('[data-extension-enabled=false]').length, 1)
        })
      })
    })
    describe('common extensions', function () {
      describe('brave', function () {
        it('do not show Brave extension', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(config.braveExtensionId, false, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find(`[data-extension-id="${config.braveExtensionId}"]`).length, 0)
        })
      })
      describe('pdfjs', function () {
        it('shows on UI by default', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(config.PDFJSExtensionId, false, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find(`[data-extension-id="${config.PDFJSExtensionId}"]`).length, 1)
        })
        it('does not show if excluded', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(config.PDFJSExtensionId, false, true)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find(`[data-extension-id="${config.PDFJSExtensionId}"]`).length, 0)
        })
        it('can be enabled', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(config.PDFJSExtensionId, true, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find('[data-extension-enabled=true]').length, 1)
        })
        it('can be disabled', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(config.PDFJSExtensionId, false, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find('[data-extension-enabled=false]').length, 1)
        })
      })
      describe('pocket', function () {
        it('shows on UI by default', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(config.PocketExtensionId, false, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find(`[data-extension-id="${config.PocketExtensionId}"]`).length, 1)
        })
        it('does not show if excluded', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(config.PocketExtensionId, false, true)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find(`[data-extension-id="${config.PocketExtensionId}"]`).length, 0)
        })
        it('can be enabled', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(config.PocketExtensionId, true, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find('[data-extension-enabled=true]').length, 1)
        })
        it('can be disabled', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(config.PocketExtensionId, false, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find('[data-extension-enabled=false]').length, 1)
        })
      })
      describe('torrent', function () {
        it('shows on UI by default', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(config.torrentExtensionId, false, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find(`[data-extension-id="${config.torrentExtensionId}"]`).length, 1)
        })
        it('can not be excluded', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(config.torrentExtensionId, false, true)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find(`[data-extension-id="${config.torrentExtensionId}"]`).length, 1)
        })
        it('can be enabled', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(config.torrentExtensionId, true, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find('[data-extension-enabled=true]').length, 1)
        })
        it('can be disabled', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(config.torrentExtensionId, false, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find('[data-extension-enabled=false]').length, 1)
        })
      })
      describe('sync', function () {
        it('do not show sync extension', function () {
          const wrapper = mount(
            <ExtensionsTab
              extensions={extensions(config.syncExtensionId, false, false)}
              settings={Immutable.Map()}
              onChangeSetting={null} />
          )
          assert.equal(wrapper.find(`[data-extension-id="${config.syncExtensionId}"]`).length, 0)
        })
      })
    })
  })
})
