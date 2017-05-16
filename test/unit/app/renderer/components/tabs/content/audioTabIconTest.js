/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, it */

const {shallow} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
const globalStyles = require('../../../../../../../app/renderer/components/styles/global')
let AudioTabIcon
require('../../../../../braveUnit')

describe('Tabs content - AudioTabIcon', function () {
  before(function () {
    AudioTabIcon = require('../../../../../../../app/renderer/components/tabs/content/audioTabIcon')
  })

  it('should not show any audio icon if page has audio disabled', function () {
    const wrapper = shallow(
      <AudioTabIcon
        frame={
          Immutable.Map({
            audioPlaybackActive: false,
            breakpoint: 'default'
          })}
      />
    )
    assert.notEqual(wrapper.props().symbol, globalStyles.appIcons.volumeOn)
    assert.notEqual(wrapper.props().symbol, globalStyles.appIcons.volumeOff)
  })
  it('should show play icon if page has audio enabled', function () {
    const wrapper = shallow(
      <AudioTabIcon
        frame={
          Immutable.Map({
            audioPlaybackActive: true,
            breakpoint: 'default'
          })}
      />
    )
    assert.equal(wrapper.props().symbol, globalStyles.appIcons.volumeOn)
  })
  it('should not show play audio icon if tab size is different than default', function () {
    const wrapper = shallow(
      <AudioTabIcon
        frame={
          Immutable.Map({
            audioPlaybackActive: true,
            audioMuted: false,
            breakpoint: 'small'
          })}
      />
    )
    assert.notEqual(wrapper.props().symbol, globalStyles.appIcons.volumeOn)
  })
  it('should show mute icon if page has audio muted', function () {
    const wrapper = shallow(
      <AudioTabIcon
        frame={
          Immutable.Map({
            audioPlaybackActive: true,
            audioMuted: true,
            breakpoint: 'default'
          })}
      />
    )
    assert.equal(wrapper.props().symbol, globalStyles.appIcons.volumeOff)
  })
  it('should not show mute icon if tab size is different than default', function () {
    const wrapper = shallow(
      <AudioTabIcon
        frame={
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
