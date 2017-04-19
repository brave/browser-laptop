/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, it */

const {shallow} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
let TabTitle
require('../../../../../braveUnit')

const url1 = 'https://brave.com'
const pageTitle1 = 'Brave Software'

describe('Tabs content - Title', function () {
  before(function () {
    TabTitle = require('../../../../../../../app/renderer/components/tabs/content/tabTitle')
  })

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
