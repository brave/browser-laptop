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
let Favicon, AudioTabIcon, PrivateIcon, NewSessionIcon, TabTitle, CloseTabIcon
require('../../braveUnit')

describe('tabContent components', function () {
  before(function () {
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
          tabProps={
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
          tabProps={
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
          tabProps={
            Immutable.Map({
              location: url1,
              icon: favicon1
            })}
          isLoading
        />
      )
      assert.equal(wrapper.props().symbol, globalStyles.appIcons.loading)
    })
    it('should not show favicon for new tab page', function () {
      const wrapper = shallow(
        <Favicon
          tabProps={
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
          tabProps={
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
          tabProps={
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
          tabProps={
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
          tabProps={
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
          tabProps={
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
          tabProps={
            Immutable.Map({
              isPrivate: true
            })}
        />
      )
      assert.equal(wrapper.props().symbol, globalStyles.appIcons.private)
    })
    it('should not show private icon if current tab is not private', function () {
      const wrapper = shallow(
        <PrivateIcon
          tabProps={
            Immutable.Map({
              isPrivate: false
            })}
        />
      )
      assert.notEqual(wrapper.props().symbol, globalStyles.appIcons.private)
    })
    it('should not show private icon if mouse is over tab (avoid icon overflow)', function () {
      const wrapper = shallow(
        <PrivateIcon
          tabProps={
            Immutable.Map({
              isPrivate: true,
              hoverState: true
            })}
        />
      )
      assert.notEqual(wrapper.props().symbol, globalStyles.appIcons.private)
    })
    it('should not show private icon if tab size is too small', function () {
      const wrapper = shallow(
        <PrivateIcon
          tabProps={
            Immutable.Map({
              isPrivate: true,
              hoverState: false,
              breakpoint: 'small'
            })}
        />
      )
      assert.notEqual(wrapper.props().symbol, globalStyles.appIcons.private)
    })
  })

  describe('NewSessionIcon', function () {
    it('should show new session icon if current tab is a new session tab', function () {
      const wrapper = shallow(
        <NewSessionIcon
          tabProps={
            Immutable.Map({
              partitionNumber: true
            })}
        />
      )
      assert.equal(wrapper.props().symbol, globalStyles.appIcons.newSession)
    })
    it('should not show new session icon if current tab is not private', function () {
      const wrapper = shallow(
        <NewSessionIcon
          tabProps={
            Immutable.Map({
              partitionNumber: false
            })}
        />
      )
      assert.notEqual(wrapper.props().symbol, globalStyles.appIcons.newSession)
    })
    it('should not show new session icon if mouse is over tab (avoid icon overflow)', function () {
      const wrapper = shallow(
        <NewSessionIcon
          tabProps={
            Immutable.Map({
              isPrivate: true,
              hoverState: true
            })}
        />
      )
      assert.notEqual(wrapper.props().symbol, globalStyles.appIcons.newSession)
    })
    it('should not show new session icon if tab size is too small', function () {
      const wrapper = shallow(
        <NewSessionIcon
          tabProps={
            Immutable.Map({
              isPrivate: true,
              hoverState: true,
              breakpoint: 'small'
            })}
        />
      )
      assert.notEqual(wrapper.props().symbol, globalStyles.appIcons.newSession)
    })
  })

  describe('Tab Title', function () {
    it('should show text if page has a title', function () {
      const wrapper = shallow(
        <TabTitle
          tabProps={
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
          tabProps={
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
    it('should not show text if size is largeMedium and location has audio and a secondary icon', function () {
      const wrapper = shallow(
        <TabTitle
          tabProps={
            Immutable.Map({
              location: url1,
              title: pageTitle1,
              breakpoint: 'largeMedium',
              audioPlaybackActive: true,
              isPrivate: true
            })}
          pageTitle={pageTitle1}
        />
      )
      assert.notEqual(wrapper.text(), pageTitle1)
    })
    it('should not show text if size is mediumSmall and location has a secondary icon', function () {
      const wrapper = shallow(
        <TabTitle
          tabProps={
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
          tabProps={
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
          tabProps={
            Immutable.Map({
              hoverState: true
            })}
        />
      )
      assert.equal(wrapper.props().symbol, globalStyles.appIcons.closeTab)
    })
    it('should not show closeTab icon if mouse is not over a tab', function () {
      const wrapper = shallow(
        <CloseTabIcon
          tabProps={
            Immutable.Map({
              hoverState: false
            })}
        />
      )
      assert.notEqual(wrapper.props().symbol, globalStyles.appIcons.closeTab)
    })
    it('should not show closeTab icon if tab is pinned', function () {
      const wrapper = shallow(
        <CloseTabIcon
          tabProps={
            Immutable.Map({
              hoverState: false,
              pinnedLocation: true
            })}
        />
      )
      assert.notEqual(wrapper.props().symbol, globalStyles.appIcons.closeTab)
    })
    it('should not show closeTab icon if tab size is too small', function () {
      const wrapper = shallow(
        <CloseTabIcon
          tabProps={
            Immutable.Map({
              hoverState: true,
              breakpoint: 'extraSmall'
            })}
        />
      )
      assert.notEqual(wrapper.props().symbol, globalStyles.appIcons.closeTab)
    })
  })
})
