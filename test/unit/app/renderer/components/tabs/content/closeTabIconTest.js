/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {shallow} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
let CloseTabIcon
require('../../../../../braveUnit')

describe('Tabs content - CloseTabIcon', function () {
  before(function () {
    mockery.registerMock('../../../../extensions/brave/img/tabs/close_btn_hover.svg')
    mockery.registerMock('../../../../extensions/brave/img/tabs/close_btn_normal.svg')
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    CloseTabIcon = require('../../../../../../../app/renderer/components/tabs/content/closeTabIcon')
  })

  after(function () {
    mockery.disable()
  })

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
