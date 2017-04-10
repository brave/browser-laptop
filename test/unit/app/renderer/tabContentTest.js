/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {shallow} = require('enzyme')
const Immutable = require('immutable')
const assert = require('assert')
const fakeElectron = require('../../lib/fakeElectron')
const globalStyles = require('../../../../app/renderer/components/styles/global')
const {tabs} = require('../../../../js/constants/config')
let Favicon, AudioTabIcon, PrivateIcon, NewSessionIcon, TabTitle, CloseTabIcon
require('../../braveUnit')

describe('tabContent components', function () {
  before(function () {
    mockery.registerMock('../../extensions/brave/img/tabs/loading.svg')
    mockery.registerMock('../../extensions/brave/img/tabs/new_session.svg')
    mockery.registerMock('../../extensions/brave/img/tabs/close_btn_normal.svg')
    mockery.registerMock('../../extensions/brave/img/tabs/close_btn_hover.svg')
    mockery.registerMock('../../extensions/brave/img/tabs/private.svg')
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    Favicon = require('../../../../app/renderer/components/tabContent').Favicon
    AudioTabIcon = require('../../../../app/renderer/components/tabContent').AudioTabIcon
    PrivateIcon = require('../../../../app/renderer/components/tabContent').PrivateIcon
    NewSessionIcon = require('../../../../app/renderer/components/tabContent').NewSessionIcon
    TabTitle = require('../../../../app/renderer/components/tabContent').TabTitle
    CloseTabIcon = require('../../../../app/renderer/components/tabContent').CloseTabIcon
  })
  after(function () {
    mockery.disable()
  })

  const url1 = 'https://brave.com'
  const favicon1 = 'https://brave.com/favicon.ico'
  const pageTitle1 = 'Brave Software'

  describe('Favicon', function () {
    it('should show favicon if page has one', function () {
      const wrapper = shallow(
        <Favicon
          tab={
            Immutable.Map({
              location: url1,
              icon: favicon1
            })}
        />
      )
      assert.equal(wrapper.props()['data-test-favicon'], favicon1)
    })
    it('should show a placeholder icon if page has no favicon', function () {
      const wrapper = shallow(
        <Favicon
          tab={
            Immutable.Map({
              location: url1,
              icon: null
            })}
          isLoading={false}
        />
      )
      assert.equal(wrapper.props().symbol, globalStyles.appIcons.defaultIcon)
    })
    it('should show a loading icon if page is still loading', function () {
      const wrapper = shallow(
        <Favicon
          tab={
            Immutable.Map({
              location: url1,
              icon: favicon1
            })}
          isLoading
        />
      )
      assert.equal(wrapper.props()['data-test-id'], 'loading')
    })
    it('should not show favicon for new tab page', function () {
      const wrapper = shallow(
        <Favicon
          tab={
            Immutable.Map({
              location: 'about:newtab'
            })}
        />
      )
      assert.notEqual(wrapper.props().favicon, favicon1, 'does not show favicon')
      assert.notEqual(wrapper.props().symbol, globalStyles.appIcons.loading, 'does not show loading icon')
      assert.notEqual(wrapper.props().symbol, globalStyles.appIcons.defaultIcon, 'does not show default icon')
    })
  })

  describe('AudioTabIcon', function () {
    it('should not show any audio icon if page has audio disabled', function () {
      const wrapper = shallow(
        <AudioTabIcon
          tab={
            Immutable.Map({
              audioPlaybackActive: false
            })}
        />
      )
      assert.notEqual(wrapper.props().symbol, globalStyles.appIcons.volumeOn)
      assert.notEqual(wrapper.props().symbol, globalStyles.appIcons.volumeOff)
    })
    it('should show play icon if page has audio enabled', function () {
      const wrapper = shallow(
        <AudioTabIcon
          tab={
            Immutable.Map({
              audioPlaybackActive: true
            })}
        />
      )
      assert.equal(wrapper.props().symbol, globalStyles.appIcons.volumeOn)
    })
    it('should not show play audio icon if tab size is too narrow', function () {
      const wrapper = shallow(
        <AudioTabIcon
          tab={
            Immutable.Map({
              audioPlaybackActive: true,
              breakpoint: 'small'
            })}
        />
      )
      assert.notEqual(wrapper.props().symbol, globalStyles.appIcons.volumeOn)
    })
    it('should show mute icon if page has audio muted', function () {
      const wrapper = shallow(
        <AudioTabIcon
          tab={
            Immutable.Map({
              audioPlaybackActive: true,
              audioMuted: true
            })}
        />
      )
      assert.equal(wrapper.props().symbol, globalStyles.appIcons.volumeOff)
    })
    it('should not show mute icon if tab size is too narrow', function () {
      const wrapper = shallow(
        <AudioTabIcon
          tab={
            Immutable.Map({
              audioPlaybackActive: true,
              audioMuted: true,
              breakpoint: 'small'
            })}

        />
      )
      assert.notEqual(wrapper.props().symbol, globalStyles.appIcons.volumeOff)
    })
  })

  describe('PrivateIcon', function () {
    it('should show private icon if current tab is private', function () {
      const wrapper = shallow(
        <PrivateIcon
          tab={
            Immutable.Map({
              isPrivate: true
            })}
        />
      )
      assert.equal(wrapper.props()['data-test-id'], 'privateIcon')
    })
    it('should not show private icon if current tab is not private', function () {
      const wrapper = shallow(
        <PrivateIcon
          tab={
            Immutable.Map({
              isPrivate: false
            })}
        />
      )
      assert.notEqual(wrapper.props()['data-test-id'], 'privateIcon')
    })
    it('should not show private icon if mouse is over tab (avoid icon overflow)', function () {
      const wrapper = shallow(
        <PrivateIcon
          tab={
            Immutable.Map({
              isPrivate: true,
              hoverState: true
            })}
        />
      )
      assert.notEqual(wrapper.props()['data-test-id'], 'privateIcon')
    })
    it('should not show private icon if tab size is small', function () {
      const wrapper = shallow(
        <PrivateIcon
          tab={
            Immutable.Map({
              isPrivate: true,
              hoverState: false,
              breakpoint: 'small'
            })}
        />
      )
      assert.notEqual(wrapper.props()['data-test-id'], 'privateIcon')
    })
    it('should not show private icon if tab size is extraSmall', function () {
      const wrapper = shallow(
        <PrivateIcon
          tab={
            Immutable.Map({
              isPrivate: true,
              hoverState: false,
              breakpoint: 'extraSmall'
            })}
        />
      )
      assert.notEqual(wrapper.props()['data-test-id'], 'privateIcon')
    })
    it('should not show private icon if tab size is the smallest', function () {
      const wrapper = shallow(
        <PrivateIcon
          tab={
            Immutable.Map({
              isPrivate: true,
              hoverState: false,
              breakpoint: 'smallest'
            })}
        />
      )
      assert.notEqual(wrapper.props()['data-test-id'], 'privateIcon')
    })
  })

  describe('NewSessionIcon', function () {
    it('should show new session icon if current tab is a new session tab', function () {
      const wrapper = shallow(
        <NewSessionIcon
          tab={
            Immutable.Map({
              partitionNumber: 1
            })}
        />
      )
      assert.equal(wrapper.props()['data-test-id'], 'newSessionIcon')
    })
    it('should not show new session icon if current tab is not private', function () {
      const wrapper = shallow(
        <NewSessionIcon
          tab={
            Immutable.Map({
              partitionNumber: false
            })}
        />
      )
      assert.notEqual(wrapper.props()['data-test-id'], 'newSessionIcon')
    })
    it('should not show new session icon if mouse is over tab (avoid icon overflow)', function () {
      const wrapper = shallow(
        <NewSessionIcon
          tab={
            Immutable.Map({
              partitionNumber: 1,
              hoverState: true
            })}
        />
      )
      assert.notEqual(wrapper.props()['data-test-id'], 'newSessionIcon')
    })
    it('should not show new session icon if tab size is small', function () {
      const wrapper = shallow(
        <NewSessionIcon
          tab={
            Immutable.Map({
              partitionNumber: 1,
              hoverState: true,
              breakpoint: 'small'
            })}
        />
      )
      assert.notEqual(wrapper.props()['data-test-id'], 'newSessionIcon')
    })
    it('should not show new session icon if tab size is extraSmall', function () {
      const wrapper = shallow(
        <NewSessionIcon
          tab={
            Immutable.Map({
              partitionNumber: 1,
              hoverState: true,
              breakpoint: 'extraSmall'
            })}
        />
      )
      assert.notEqual(wrapper.props()['data-test-id'], 'newSessionIcon')
    })
    it('should not show new session icon if tab size is the smallest', function () {
      const wrapper = shallow(
        <NewSessionIcon
          tab={
            Immutable.Map({
              partitionNumber: 1,
              hoverState: true,
              breakpoint: 'smallest'
            })}
        />
      )
      assert.notEqual(wrapper.props()['data-test-id'], 'newSessionIcon')
    })
    it('should show partition number for new sessions', function () {
      const wrapper = shallow(
        <NewSessionIcon
          tab={
            Immutable.Map({
              partitionNumber: 3
            })}
        />
      )
      assert.equal(wrapper.props().symbolContent, 3)
    })
    it('should read and show partition number for sessions with number set by opener (ex: clicking target=_blank)', function () {
      const wrapper = shallow(
        <NewSessionIcon
          tab={
            Immutable.Map({
              partitionNumber: 'partition-3'
            })}
        />
      )
      assert.equal(wrapper.props().symbolContent, 3)
    })
    it('should show max partition number even if session is bigger', function () {
      const wrapper = shallow(
        <NewSessionIcon
          tab={
            Immutable.Map({
              partitionNumber: 1000
            })}
        />
      )
      assert.equal(wrapper.props().symbolContent, tabs.maxAllowedNewSessions)
    })
  })

  describe('Tab Title', function () {
    it('should show text if page has a title', function () {
      const wrapper = shallow(
        <TabTitle
          tab={
            Immutable.Map({
              location: url1,
              title: pageTitle1
            })}
          pageTitle={pageTitle1}
        />
      )
      assert.equal(wrapper.text(), pageTitle1)
    })
    it('should not show text if tab is pinned', function () {
      const wrapper = shallow(
        <TabTitle
          tab={
            Immutable.Map({
              location: url1,
              title: pageTitle1,
              pinnedLocation: true
            })}
          pageTitle={pageTitle1}
        />
      )
      assert.notEqual(wrapper.text(), pageTitle1)
    })
    it('should not show text if size is mediumSmall and location has a secondary icon', function () {
      const wrapper = shallow(
        <TabTitle
          tab={
            Immutable.Map({
              location: url1,
              title: pageTitle1,
              breakpoint: 'mediumSmall',
              audioPlaybackActive: false,
              isPrivate: true
            })}
          pageTitle={pageTitle1}
        />
      )
      assert.notEqual(wrapper.text(), pageTitle1)
    })
    it('should not show text if size is too small', function () {
      const wrapper = shallow(
        <TabTitle
          tab={
            Immutable.Map({
              location: url1,
              title: pageTitle1,
              breakpoint: 'extraSmall'
            })}
          pageTitle={pageTitle1}
        />
      )
      assert.notEqual(wrapper.text(), pageTitle1)
    })
  })

  describe('CloseTabIcon', function () {
    it('should show closeTab icon if mouse is over tab', function () {
      const wrapper = shallow(
        <CloseTabIcon
          tab={
            Immutable.Map({
              hoverState: true
            })}
        />
      )
      assert.equal(wrapper.props()['data-test-id'], 'closeTabIcon')
    })
    it('should not show closeTab icon if mouse is not over a tab', function () {
      const wrapper = shallow(
        <CloseTabIcon
          tab={
            Immutable.Map({
              hoverState: false
            })}
        />
      )
      assert.notEqual(wrapper.props()['data-test-id'], 'closeTabIcon')
    })
    it('should not show closeTab icon if tab is pinned', function () {
      const wrapper = shallow(
        <CloseTabIcon
          tab={
            Immutable.Map({
              hoverState: true,
              pinnedLocation: true
            })}
        />
      )
      assert.notEqual(wrapper.props()['data-test-id'], 'closeTabIcon')
    })
    it('should show closeTab icon if tab size is small and tab is active', function () {
      const wrapper = shallow(
        <CloseTabIcon isActive
          tab={
            Immutable.Map({
              hoverState: false,
              breakpoint: 'small'
            })}
        />
      )
      assert.equal(wrapper.props()['data-test-id'], 'closeTabIcon')
    })
    it('should not show closeTab icon if tab size is small and tab is not active', function () {
      const wrapper = shallow(
        <CloseTabIcon isActive={false}
          tab={
            Immutable.Map({
              hoverState: true,
              breakpoint: 'small'
            })}
        />
      )
      assert.notEqual(wrapper.props()['data-test-id'], 'closeTabIcon')
    })
    it('should show closeTab icon if tab size is extraSmall and tab is active', function () {
      const wrapper = shallow(
        <CloseTabIcon isActive
          tab={
            Immutable.Map({
              hoverState: false,
              breakpoint: 'extraSmall'
            })}
        />
      )
      assert.equal(wrapper.props()['data-test-id'], 'closeTabIcon')
    })
    it('should not show closeTab icon if tab size is extraSmall and tab is not active', function () {
      const wrapper = shallow(
        <CloseTabIcon isActive={false}
          tab={
            Immutable.Map({
              hoverState: true,
              breakpoint: 'extraSmall'
            })}
        />
      )
      assert.notEqual(wrapper.props()['data-test-id'], 'closeTabIcon')
    })
    it('should not show closeTab icon if tab size is the smallest size', function () {
      const wrapper = shallow(
        <CloseTabIcon
          tab={
            Immutable.Map({
              hoverState: true,
              breakpoint: 'extraSmall'
            })}
        />
      )
      assert.notEqual(wrapper.props()['data-test-id'], 'closeTabIcon')
    })
  })
})
