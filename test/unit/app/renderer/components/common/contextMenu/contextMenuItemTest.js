/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const Immutable = require('immutable')
const mockery = require('mockery')
const assert = require('assert')
require('../../../../../braveUnit')
const {mount} = require('enzyme')

describe('ContextMenuItem unit test', function () {
  let ContextMenuItem

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    ContextMenuItem = require('../../../../../../../app/renderer/components/common/contextMenu/contextMenuItem')
  })

  after(function () {
    mockery.disable()
  })

  describe('getYAxis', function () {
    let nodeTop, parentTop

    it('target is contextMenuItem and parentNode is contextMenu', function () {
      const event = {
        target: {
          dataset: {
            contextMenuItem: true
          },
          getBoundingClientRect: () => {
            return {
              top: nodeTop
            }
          },
          parentNode: {
            dataset: {
              contextMenu: true
            },
            scrollTop: 1,
            getBoundingClientRect: () => {
              return {
                top: parentTop
              }
            }
          }
        }
      }

      const wrapper = mount(
        <ContextMenuItem contextMenuItem={Immutable.fromJS({
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => {}
        })} />
      )
      const instance = wrapper.instance()
      nodeTop = 1
      parentTop = 0
      assert.equal(instance.getYAxis(event), 1)
    })

    it('target is contextMenuItem and parentNode is second contextMenu', function () {
      const event = {
        target: {
          dataset: {
            contextMenuItem: true
          },
          getBoundingClientRect: () => {
            return {
              top: nodeTop
            }
          },
          parentNode: {
            dataset: {
              class: true
            },
            scrollTop: 1,
            getBoundingClientRect: () => {
              return {
                top: 0
              }
            },
            parentNode: {
              dataset: {
                contextMenu: true
              },
              scrollTop: 50,
              getBoundingClientRect: () => {
                return {
                  top: parentTop
                }
              }
            }
          }
        }
      }

      const wrapper = mount(
        <ContextMenuItem contextMenuItem={Immutable.fromJS({
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => {}
        })} />
      )
      const instance = wrapper.instance()
      nodeTop = 1
      parentTop = 10
      assert.equal(instance.getYAxis(event), 40)
    })

    it('target is second contextMenuItem and parentNode is second contextMenu', function () {
      const event = {
        target: {
          dataset: {
            class: true
          },
          getBoundingClientRect: () => {
            return {
              top: 0
            }
          },
          parentNode: {
            dataset: {
              contextMenuItem: true
            },
            scrollTop: 1,
            getBoundingClientRect: () => {
              return {
                top: nodeTop
              }
            },
            parentNode: {
              dataset: {
                contextMenu: true
              },
              scrollTop: 50,
              getBoundingClientRect: () => {
                return {
                  top: parentTop
                }
              }
            }
          }
        }
      }

      const wrapper = mount(
        <ContextMenuItem contextMenuItem={Immutable.fromJS({
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => {}
        })} />
      )
      const instance = wrapper.instance()
      nodeTop = 20
      parentTop = 10
      assert.equal(instance.getYAxis(event), 59)
    })
  })
})
