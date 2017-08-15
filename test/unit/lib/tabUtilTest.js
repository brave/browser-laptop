/* global describe, it */
const tabUtil = require('../../../app/renderer/lib/tabUtil')
const tabBreakpoint = require('../../../app/renderer/components/styles/global').breakpoint.tab
const assert = require('assert')

require('../braveUnit')

describe('tabUtil', function () {
  describe('getTabBreakpoint', function () {
    let size

    it('returns `dynamic` if `dynamic` size matches', function () {
      size = Number.parseInt(tabBreakpoint.dynamic, 10)
      assert.equal(tabUtil.getTabBreakpoint(size), 'dynamic')
    })
    it('returns `default` if `default` size matches', function () {
      size = Number.parseInt(tabBreakpoint.default, 10)
      assert.equal(tabUtil.getTabBreakpoint(size), 'default')
    })
    it('returns `large` if `large` size matches', function () {
      size = Number.parseInt(tabBreakpoint.large, 10)
      assert.equal(tabUtil.getTabBreakpoint(size), 'large')
    })
    it('returns `largeMedium` if `largeMedium` size matches', function () {
      size = Number.parseInt(tabBreakpoint.largeMedium, 10)
      assert.equal(tabUtil.getTabBreakpoint(size), 'largeMedium')
    })
    it('returns `medium` if `medium` size matches', function () {
      size = Number.parseInt(tabBreakpoint.medium, 10)
      assert.equal(tabUtil.getTabBreakpoint(size), 'medium')
    })
    it('returns `mediumSmall` if `mediumSmall` size matches', function () {
      size = Number.parseInt(tabBreakpoint.mediumSmall, 10)
      assert.equal(tabUtil.getTabBreakpoint(size), 'mediumSmall')
    })
    it('returns `small` if `small` size matches', function () {
      size = Number.parseInt(tabBreakpoint.small, 10)
      assert.equal(tabUtil.getTabBreakpoint(size), 'small')
    })
    it('returns `extraSmall` if `extraSmall` size matches', function () {
      size = Number.parseInt(tabBreakpoint.extraSmall, 10)
      assert.equal(tabUtil.getTabBreakpoint(size), 'extraSmall')
    })
    it('returns `smallest` if `smallest` size matches', function () {
      size = Number.parseInt(tabBreakpoint.smallest, 10)
      assert.equal(tabUtil.getTabBreakpoint(size), 'smallest')
    })
  })
})
