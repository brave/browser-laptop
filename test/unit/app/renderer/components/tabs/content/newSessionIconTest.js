/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {shallow} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
const {tabs} = require('../../../../../../../js/constants/config')
let NewSessionIcon
require('../../../../../braveUnit')

describe('Tabs content - NewSessionIcon', function () {
  before(function () {
    mockery.registerMock('../../../../extensions/brave/img/tabs/new_session.svg')
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    NewSessionIcon = require('../../../../../../../app/renderer/components/tabs/content/newSessionIcon')
  })

  after(function () {
    mockery.disable()
  })

  it('should show new session icon if current tab is a new session tab', function () {
    const wrapper = shallow(
      <NewSessionIcon
        frame={
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
        frame={
          Immutable.Map({
            partitionNumber: false
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'newSessionIcon')
  })
  it('should not show new session icon if mouse is over tab and breakpoint is default', function () {
    const wrapper = shallow(
      <NewSessionIcon
        frame={
          Immutable.Map({
            partitionNumber: 1,
            hoverState: true,
            breakpoint: 'default'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'newSessionIcon')
  })
  it('should show new session icon if mouse is not over tab and breakpoint is default', function () {
    const wrapper = shallow(
      <NewSessionIcon
        frame={
          Immutable.Map({
            partitionNumber: 1,
            hoverState: false,
            breakpoint: 'default'
          })}
      />
    )
    assert.equal(wrapper.props()['data-test-id'], 'newSessionIcon')
  })
  it('should not show new session icon if mouse is over tab and breakpoint is large', function () {
    const wrapper = shallow(
      <NewSessionIcon
        frame={
          Immutable.Map({
            partitionNumber: 1,
            hoverState: true,
            breakpoint: 'large'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'newSessionIcon')
  })
  it('should show new session icon if mouse is not over tab and breakpoint is large', function () {
    const wrapper = shallow(
      <NewSessionIcon
        frame={
          Immutable.Map({
            partitionNumber: 1,
            hoverState: false,
            breakpoint: 'large'
          })}
      />
    )
    assert.equal(wrapper.props()['data-test-id'], 'newSessionIcon')
  })
  it('should not show new session icon if tab is active and breakpoint is largeMedium', function () {
    const wrapper = shallow(
      <NewSessionIcon isActive
        frame={
          Immutable.Map({
            partitionNumber: 1,
            hoverState: true,
            breakpoint: 'largeMedium'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'newSessionIcon')
  })
  it('should show new session icon if tab is not active and breakpoint is largeMedium', function () {
    const wrapper = shallow(
      <NewSessionIcon isActive={false}
        frame={
          Immutable.Map({
            partitionNumber: 1,
            hoverState: false,
            breakpoint: 'largeMedium'
          })}
      />
    )
    assert.equal(wrapper.props()['data-test-id'], 'newSessionIcon')
  })
  it('should not show new session icon if tab is active and breakpoint is medium', function () {
    const wrapper = shallow(
      <NewSessionIcon isActive
        frame={
          Immutable.Map({
            partitionNumber: 1,
            hoverState: true,
            breakpoint: 'medium'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'newSessionIcon')
  })
  it('should show new session icon if tab is not active and breakpoint is medium', function () {
    const wrapper = shallow(
      <NewSessionIcon isActive={false}
        frame={
          Immutable.Map({
            partitionNumber: 1,
            hoverState: false,
            breakpoint: 'medium'
          })}
      />
    )
    assert.equal(wrapper.props()['data-test-id'], 'newSessionIcon')
  })
  it('should not show new session icon if breakpoint is mediumSmall', function () {
    const wrapper = shallow(
      <NewSessionIcon isActive
        frame={
          Immutable.Map({
            partitionNumber: 1,
            hoverState: false,
            breakpoint: 'mediumSmall'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'newSessionIcon')
  })
  it('should not show new session icon if breakpoint is small', function () {
    const wrapper = shallow(
      <NewSessionIcon isActive
        frame={
          Immutable.Map({
            partitionNumber: 1,
            hoverState: true,
            breakpoint: 'small'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'newSessionIcon')
  })
  it('should not show new session icon if breakpoint is extraSmall', function () {
    const wrapper = shallow(
      <NewSessionIcon isActive
        frame={
          Immutable.Map({
            partitionNumber: 1,
            hoverState: true,
            breakpoint: 'extraSmall'
          })}
      />
    )
    assert.notEqual(wrapper.props()['data-test-id'], 'newSessionIcon')
  })
  it('should not show new session icon if breakpoint is the smallest', function () {
    const wrapper = shallow(
      <NewSessionIcon
        frame={
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
        frame={
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
        frame={
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
        frame={
          Immutable.Map({
            partitionNumber: 1000
          })}
      />
    )
    assert.equal(wrapper.props().symbolContent, tabs.maxAllowedNewSessions)
  })
})
