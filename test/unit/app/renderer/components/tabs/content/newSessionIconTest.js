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
