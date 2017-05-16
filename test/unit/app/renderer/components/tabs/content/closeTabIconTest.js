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

  it('should show closeTab icon if mouse is over tab and breakpoint is default', function () {
    const wrapper = shallow(
      <CloseTabIcon
        frame={
          Immutable.Map({
            hoverState: true,
            breakpoint: 'default'
          })}
      />
    )
    assert.equal(wrapper.props()['data-test-id'], 'closeTabIcon')
  })
  it('should show closeTab icon if mouse is over tab and breakpoint is large', function () {
    const wrapper = shallow(
      <CloseTabIcon
        frame={
          Immutable.Map({
            hoverState: true,
            breakpoint: 'large'
          })}
      />
    )
    assert.equal(wrapper.props()['data-test-id'], 'closeTabIcon')
  })
  it('should not show closeTab icon if tab is pinned', function () {
    const wrapper = shallow(
      <CloseTabIcon
        frame={
          Immutable.Map({
            hoverState: true,
            pinnedLocation: true
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'closeTabIcon')
  })
  it('should show closeTab icon if tab size is largeMedium and tab is active', function () {
    const wrapper = shallow(
      <CloseTabIcon isActive
        frame={
          Immutable.Map({
            hoverState: false,
            breakpoint: 'largeMedium'
          })}
      />
    )
    assert.equal(wrapper.props()['data-test-id'], 'closeTabIcon')
  })
  it('should not show closeTab icon if tab size is largeMedium and tab is not active', function () {
    const wrapper = shallow(
      <CloseTabIcon isActive={false}
        frame={
          Immutable.Map({
            hoverState: true,
            breakpoint: 'largeMedium'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'closeTabIcon')
  })

  it('should show closeTab icon if tab size is medium and tab is active', function () {
    const wrapper = shallow(
      <CloseTabIcon isActive
        frame={
          Immutable.Map({
            hoverState: false,
            breakpoint: 'medium'
          })}
      />
    )
    assert.equal(wrapper.props()['data-test-id'], 'closeTabIcon')
  })
  it('should not show closeTab icon if tab size is medium and tab is not active', function () {
    const wrapper = shallow(
      <CloseTabIcon isActive={false}
        frame={
          Immutable.Map({
            hoverState: true,
            breakpoint: 'medium'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'closeTabIcon')
  })

  it('should show closeTab icon if tab size is mediumSmall and tab is active', function () {
    const wrapper = shallow(
      <CloseTabIcon isActive
        frame={
          Immutable.Map({
            hoverState: false,
            breakpoint: 'mediumSmall'
          })}
      />
    )
    assert.equal(wrapper.props()['data-test-id'], 'closeTabIcon')
  })
  it('should not show closeTab icon if tab size is mediumSmall and tab is not active', function () {
    const wrapper = shallow(
      <CloseTabIcon isActive={false}
        frame={
          Immutable.Map({
            hoverState: true,
            breakpoint: 'mediumSmall'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'closeTabIcon')
  })
  it('should show closeTab icon if tab size is small and tab is active', function () {
    const wrapper = shallow(
      <CloseTabIcon isActive
        frame={
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
        frame={
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
        frame={
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
        frame={
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
        frame={
          Immutable.Map({
            hoverState: true,
            breakpoint: 'extraSmall'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'closeTabIcon')
  })
})
