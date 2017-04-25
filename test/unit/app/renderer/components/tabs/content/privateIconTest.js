/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {shallow} = require('enzyme')
const Immutable = require('immutable')
const assert = require('assert')
let PrivateIcon
require('../../../../../braveUnit')

describe('Tabs content - PrivateIcon', function () {
  before(function () {
    mockery.registerMock('../../../../extensions/brave/img/tabs/private.svg')
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    PrivateIcon = require('../../../../../../../app/renderer/components/tabs/content/privateIcon')
  })

  after(function () {
    mockery.disable()
  })

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
  it('should not show private icon if mouse is over tab and breakpoint is default', function () {
    const wrapper = shallow(
      <PrivateIcon
        tab={
          Immutable.Map({
            isPrivate: true,
            hoverState: true,
            breakpoint: 'default'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'privateIcon')
  })
  it('should show private icon if mouse is not over tab and breakpoint is default', function () {
    const wrapper = shallow(
      <PrivateIcon
        tab={
          Immutable.Map({
            isPrivate: true,
            hoverState: false,
            breakpoint: 'default'
          })}
      />
    )
    assert.equal(wrapper.props()['data-test-id'], 'privateIcon')
  })
  it('should not show private icon if mouse is over tab and breakpoint is large', function () {
    const wrapper = shallow(
      <PrivateIcon
        tab={
          Immutable.Map({
            isPrivate: 1,
            hoverState: true,
            breakpoint: 'large'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'privateIcon')
  })
  it('should show private icon if mouse is not over tab and breakpoint is large', function () {
    const wrapper = shallow(
      <PrivateIcon
        tab={
          Immutable.Map({
            isPrivate: 1,
            hoverState: false,
            breakpoint: 'large'
          })}
      />
    )
    assert.equal(wrapper.props()['data-test-id'], 'privateIcon')
  })
  it('should not show private icon if tab is active and breakpoint is largeMedium', function () {
    const wrapper = shallow(
      <PrivateIcon isActive
        tab={
          Immutable.Map({
            isPrivate: 1,
            hoverState: true,
            breakpoint: 'largeMedium'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'privateIcon')
  })
  it('should show private icon if tab is not active and breakpoint is largeMedium', function () {
    const wrapper = shallow(
      <PrivateIcon isActive={false}
        tab={
          Immutable.Map({
            isPrivate: 1,
            hoverState: false,
            breakpoint: 'largeMedium'
          })}
      />
    )
    assert.equal(wrapper.props()['data-test-id'], 'privateIcon')
  })
  it('should not show private icon if tab is active and breakpoint is medium', function () {
    const wrapper = shallow(
      <PrivateIcon isActive
        tab={
          Immutable.Map({
            isPrivate: 1,
            hoverState: true,
            breakpoint: 'medium'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'privateIcon')
  })
  it('should show private icon if tab is not active and breakpoint is medium', function () {
    const wrapper = shallow(
      <PrivateIcon isActive={false}
        tab={
          Immutable.Map({
            isPrivate: 1,
            hoverState: false,
            breakpoint: 'medium'
          })}
      />
    )
    assert.equal(wrapper.props()['data-test-id'], 'privateIcon')
  })
  it('should not show private icon if breakpoint is mediumSmall', function () {
    const wrapper = shallow(
      <PrivateIcon isActive
        tab={
          Immutable.Map({
            isPrivate: 1,
            hoverState: false,
            breakpoint: 'mediumSmall'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'privateIcon')
  })
  it('should not show private icon if breakpoint is small', function () {
    const wrapper = shallow(
      <PrivateIcon isActive
        tab={
          Immutable.Map({
            isPrivate: 1,
            hoverState: true,
            breakpoint: 'small'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'privateIcon')
  })
  it('should not show private icon if breakpoint is extraSmall', function () {
    const wrapper = shallow(
      <PrivateIcon isActive
        tab={
          Immutable.Map({
            isPrivate: 1,
            hoverState: true,
            breakpoint: 'extraSmall'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'privateIcon')
  })
  it('should not show private icon if breakpoint is the smallest', function () {
    const wrapper = shallow(
      <PrivateIcon
        tab={
          Immutable.Map({
            isPrivate: 1,
            hoverState: true,
            breakpoint: 'smallest'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'privateIcon')
  })
})
