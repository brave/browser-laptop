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
  it('should show text if breakpoint is default', function () {
    const wrapper = shallow(
      <TabTitle
        tab={
          Immutable.Map({
            location: url1,
            title: pageTitle1,
            breakpoint: 'default'
          })}
        pageTitle={pageTitle1}
      />
    )
    assert.equal(wrapper.text(), pageTitle1)
  })
  it('should show text if breakpoint is large', function () {
    const wrapper = shallow(
      <TabTitle
        tab={
          Immutable.Map({
            location: url1,
            title: pageTitle1,
            breakpoint: 'large'
          })}
        pageTitle={pageTitle1}
      />
    )
    assert.equal(wrapper.text(), pageTitle1)
  })
  it('should show text if breakpoint is medium', function () {
    const wrapper = shallow(
      <TabTitle
        tab={
          Immutable.Map({
            location: url1,
            title: pageTitle1,
            breakpoint: 'medium'
          })}
        pageTitle={pageTitle1}
      />
    )
    assert.equal(wrapper.text(), pageTitle1)
  })
  it('should show text if breakpoint is mediumSmall', function () {
    const wrapper = shallow(
      <TabTitle
        tab={
          Immutable.Map({
            location: url1,
            title: pageTitle1,
            breakpoint: 'mediumSmall'
          })}
        pageTitle={pageTitle1}
      />
    )
    assert.equal(wrapper.text(), pageTitle1)
  })
  it('should show text if breakpoint is small and tab is not active', function () {
    const wrapper = shallow(
      <TabTitle isActive={false}
        tab={
          Immutable.Map({
            location: url1,
            title: pageTitle1,
            breakpoint: 'small'
          })}
        pageTitle={pageTitle1}
      />
    )
    assert.equal(wrapper.text(), pageTitle1)
  })
  it('should not show text if breakpoint is small and tab is active', function () {
    const wrapper = shallow(
      <TabTitle isActive
        tab={
          Immutable.Map({
            location: url1,
            title: pageTitle1,
            breakpoint: 'small'
          })}
        pageTitle={pageTitle1}
      />
    )
    assert.notEqual(wrapper.text(), pageTitle1)
  })
  it('should not show text if breakpoint is extraSmall', function () {
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
  it('should not show text if breakpoint is the smallest', function () {
    const wrapper = shallow(
      <TabTitle
        tab={
          Immutable.Map({
            location: url1,
            title: pageTitle1,
            breakpoint: 'smallest'
          })}
        pageTitle={pageTitle1}
      />
    )
    assert.notEqual(wrapper.text(), pageTitle1)
  })
})
