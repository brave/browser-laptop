/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it */

const assert = require('assert')
const uuid = require('uuid')
const Immutable = require('immutable')
const downloadUtil = require('../../../../js/state/downloadUtil')
const downloadStates = require('../../../../js/constants/downloadStates')
require('../../braveUnit')

describe('downloadUtil unit tests', function () {
  const state = Immutable.fromJS({
    downloads: {}
  })

  describe('getActiveDownloads', function () {
    it('null scenario', function () {
      const result = downloadUtil.getActiveDownloads(state)
      assert.deepEqual(result, Immutable.Map())
    })

    it('state has only completed downloads', function () {
      const newState = state.set('downloads', Immutable.fromJS({
        [uuid.v4()]: {
          filename: '1.jpg',
          state: downloadStates.CANCELLED
        },
        [uuid.v4()]: {
          filename: '2.jpg',
          state: downloadStates.COMPLETED
        },
        [uuid.v4()]: {
          filename: '3.jpg',
          state: downloadStates.PAUSED
        }
      }))
      const result = downloadUtil.getActiveDownloads(newState)
      assert.deepEqual(result, Immutable.Map())
    })

    it('state has two in progress downloads', function () {
      const id1 = uuid.v4()
      const id2 = uuid.v4()

      const newState = state.set('downloads', Immutable.fromJS({
        [uuid.v4()]: {
          filename: '1.jpg',
          state: downloadStates.CANCELLED
        },
        [uuid.v4()]: {
          filename: '2.jpg',
          state: downloadStates.COMPLETED
        },
        [id1]: {
          filename: '3.jpg',
          state: downloadStates.IN_PROGRESS
        },
        [uuid.v4()]: {
          filename: '4.jpg',
          state: downloadStates.PAUSED
        },
        [id2]: {
          filename: '5.jpg',
          state: downloadStates.IN_PROGRESS
        }
      }))
      const expectedState = Immutable.fromJS({
        [id1]: {
          filename: '3.jpg',
          state: downloadStates.IN_PROGRESS
        },
        [id2]: {
          filename: '5.jpg',
          state: downloadStates.IN_PROGRESS
        }
      })
      const result = downloadUtil.getActiveDownloads(newState)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })
})
