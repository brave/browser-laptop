/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it */

const dispatchAction = require('../../../../../app/common/dispatcher/dispatchAction')
const assert = require('assert')
const sinon = require('sinon')

describe('dispatchAction unit test', function () {
  const name = 'name-one'
  const action = { name: 'value' }
  const expectedAction = {'actionType': 'name-one', 'name': 'value'}
  describe('If run in Chrome', function () {
    it('should dispatch action to IPC renderer', function () {
      const sendStub = sinon.stub()
      global.chrome = {
        ipcRenderer: {
          send: sendStub
        }
      }
      dispatchAction(name, action)
      assert.equal(sendStub.calledOnce, true)
      assert.equal(sendStub.calledWithExactly('dispatch-action', '{"actionType":"name-one","name":"value"}'), true)
      global.chrome = undefined
    })
  })
  describe('If process type is the browser', function () {
    it('should emit a \'dispatch-action\' message of the action to the process', function () {
      const tempType = process.type
      process.type = 'browser'
      const dispatchActionStub = sinon.stub()
      process.on('dispatch-action', dispatchActionStub)
      dispatchAction(name, action)
      assert.equal(dispatchActionStub.calledOnce, true)
      assert.equal(dispatchActionStub.calledWithExactly(expectedAction), true)
      process.type = tempType
    })
  })
  describe('If process type is a worker', function () {
    it('should postMessage the action', function () {
      const tempType = process.type
      process.type = 'worker'
      const expectedMessage = {
        message: 'dispatch-action',
        action: expectedAction
      }
      const postMessageStub = sinon.stub()
      global.postMessage = postMessageStub
      dispatchAction(name, action)
      assert.equal(postMessageStub.calledOnce, true)
      assert.equal(postMessageStub.calledWithExactly(expectedMessage), true)
      process.type = tempType
    })
  })
  describe('If not Chrome and process is not browser or worker', function () {
    it('should throw expected Error', function () {
      // unfortunately assert.throws would not help
      //   as need to run the code and then re-assign process for Mocha before assertion
      const tempProcess = process
      process = undefined // eslint-disable-line no-global-assign
      let errored = false
      try {
        dispatchAction(name, action)
      } catch (e) {
        process = tempProcess // eslint-disable-line no-global-assign
        errored = true
        assert.equal(e.message, 'Unsupported environment for dispatch')
      } finally {
        process = tempProcess // eslint-disable-line no-global-assign
        assert.equal(errored, true)
      }
    })
  })
})
