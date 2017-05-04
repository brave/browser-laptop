/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {shallow} = require('enzyme')
const Immutable = require('immutable')
const assert = require('assert')
const globalStyles = require('../../../../../../../app/renderer/components/styles/global')
let Favicon
require('../../../../../braveUnit')

const url1 = 'https://brave.com'
const favicon1 = 'https://brave.com/favicon.ico'

describe('Tabs content - Favicon', function () {
  before(function () {
    mockery.registerMock('../../../../extensions/brave/img/tabs/loading.svg')
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    Favicon = require('../../../../../../../app/renderer/components/tabs/content/favIcon')
  })

  after(function () {
    mockery.disable()
  })

  it('should show favicon if page has one', function () {
    const wrapper = shallow(
      <Favicon
        frame={
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
        frame={
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
        frame={
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
        frame={
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
