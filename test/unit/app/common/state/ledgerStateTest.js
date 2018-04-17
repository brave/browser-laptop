/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, beforeEach, after, afterEach */
const assert = require('assert')
const Immutable = require('immutable')
const sinon = require('sinon')
const mockery = require('mockery')

require('../../../braveUnit')
const appActions = require('../../../../../js/actions/appActions')
const settings = require('../../../../../js/constants/settings')

describe('ledgerState unit test', function () {
  // State
  const defaultState = Immutable.fromJS({
    ledger: {}
  })

  const stateWithData = Immutable.fromJS({
    ledger: {
      publisherTime: 1
    }
  })

  // settings
  let paymentsEnabled = true
  let paymentsAmount = 5

  let ledgerState

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('../../../js/settings', {
      getSetting: (settingKey) => {
        switch (settingKey) {
          case settings.PAYMENTS_ENABLED:
            return paymentsEnabled
          case settings.PAYMENTS_CONTRIBUTION_AMOUNT:
            {
              return paymentsAmount
            }
        }

        return false
      }
    })
    mockery.registerMock('../../../js/actions/appActions', appActions)
    ledgerState = require('../../../../../app/common/state/ledgerState')
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('setLedgerValue', function () {
    it('null case', function () {
      const result = ledgerState.setLedgerValue(defaultState)
      assert.deepEqual(result.toJS(), defaultState.toJS())
    })

    it('key is provided', function () {
      const result = ledgerState.setLedgerValue(defaultState, 'publisherTime', 1)
      assert.deepEqual(result.toJS(), stateWithData.toJS())
    })
  })

  describe('getLedgerValue', function () {
    it('null case', function () {
      const result = ledgerState.getLedgerValue(defaultState)
      assert.deepEqual(result, null)
    })

    it('key is provided', function () {
      const result = ledgerState.getLedgerValue(stateWithData, 'publisherTime')
      assert.deepEqual(result, 1)
    })
  })

  describe('savePromotion', function () {
    let setActivePromotionSpy

    before(function () {
      paymentsEnabled = false
      setActivePromotionSpy = sinon.spy(ledgerState, 'setActivePromotion')
    })

    afterEach(function () {
      setActivePromotionSpy.reset()
    })

    after(function () {
      paymentsEnabled = true
      setActivePromotionSpy.restore()
    })

    it('null case', function () {
      const result = ledgerState.savePromotion(defaultState)
      assert.deepEqual(result.toJS(), defaultState.toJS())
      assert(setActivePromotionSpy.notCalled)
    })

    it('promotion is regular object', function () {
      const result = ledgerState.savePromotion(defaultState, {
        promotionId: '1'
      })
      const expectedState = defaultState
        .setIn(['ledger', 'promotion'], Immutable.fromJS({
          activeState: 'disabledWallet',
          promotionId: '1',
          remindTimestamp: -1
        }))
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(setActivePromotionSpy.calledOnce)
    })

    it('we already have the same promotion', function () {
      const state = defaultState
        .setIn(['ledger', 'promotion'], Immutable.fromJS({
          promotionId: '1',
          remindTimestamp: 10,
          stateWallet: {
            disabledWallet: {
              notification: {
                message: 'Hello'
              }
            }
          }
        }))
      const result = ledgerState.savePromotion(state, Immutable.fromJS({
        promotionId: '1',
        stateWallet: {
          disabledWallet: {
            notification: {
              message: 'New Hello'
            }
          }
        }
      }))
      const expectedState = defaultState
        .setIn(['ledger', 'promotion'], Immutable.fromJS({
          activeState: 'disabledWallet',
          promotionId: '1',
          remindTimestamp: 10,
          stateWallet: {
            disabledWallet: {
              notification: {
                message: 'New Hello'
              }
            }
          }
        }))
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(setActivePromotionSpy.calledOnce)
    })

    describe('existing promotion', function () {
      let hideNotificationSpy
      before(function () {
        hideNotificationSpy = sinon.spy(appActions, 'hideNotification')
      })
      after(function () {
        hideNotificationSpy.restore()
      })

      it('we have existing promotion, but is empty', function () {
        const state = defaultState
          .setIn(['ledger', 'promotion'], Immutable.Map())

        const result = ledgerState.savePromotion(state, Immutable.fromJS({
          promotionId: '1'
        }))
        const expectedState = state
          .setIn(['ledger', 'promotion'], Immutable.fromJS({
            activeState: 'disabledWallet',
            promotionId: '1',
            remindTimestamp: -1
          }))
        assert.deepEqual(result.toJS(), expectedState.toJS())
        assert(setActivePromotionSpy.calledOnce)
        assert(hideNotificationSpy.notCalled)
      })

      it('we have existing promotion', function () {
        const state = defaultState
          .setIn(['ledger', 'promotion'], Immutable.fromJS({
            promotionId: '2',
            activeState: 'disabledWallet',
            remindTimestamp: 10,
            stateWallet: {
              disabledWallet: {
                notification: {
                  message: 'Hello'
                }
              }
            }
          }))
        const result = ledgerState.savePromotion(state, Immutable.fromJS({
          promotionId: '1',
          stateWallet: {
            disabledWallet: {
              notification: {
                message: 'New Hello'
              }
            }
          }
        }))
        const expectedState = state
          .setIn(['ledger', 'promotion'], Immutable.fromJS({
            activeState: 'disabledWallet',
            promotionId: '1',
            remindTimestamp: -1,
            stateWallet: {
              disabledWallet: {
                notification: {
                  message: 'New Hello'
                }
              }
            }
          }))
        assert.deepEqual(result.toJS(), expectedState.toJS())
        assert(setActivePromotionSpy.calledOnce)
        assert(hideNotificationSpy.withArgs('Hello').calledOnce)
      })
    })
  })

  describe('getPromotion', function () {
    it('no promotion', function () {
      const result = ledgerState.getPromotion(defaultState)
      assert.deepEqual(result.toJS(), {})
    })

    it('promotion exists', function () {
      const promotion = {
        promotionId: '2',
        activeState: 'disabledWallet',
        remindTimestamp: 10,
        stateWallet: {
          disabledWallet: {
            notification: {
              message: 'Hello'
            }
          }
        }
      }
      const state = defaultState.setIn(['ledger', 'promotion'], Immutable.fromJS(promotion))
      const result = ledgerState.getPromotion(state)
      assert.deepEqual(result.toJS(), promotion)
    })
  })

  describe('setActivePromotion', function () {
    let setPromotionPropSpy

    before(function () {
      setPromotionPropSpy = sinon.spy(ledgerState, 'setPromotionProp')
    })

    afterEach(function () {
      setPromotionPropSpy.reset()
    })

    after(function () {
      setPromotionPropSpy.restore()
    })

    it('promotion is missing', function () {
      const result = ledgerState.setActivePromotion(defaultState)
      assert.deepEqual(result.toJS(), defaultState.toJS())
      assert(setPromotionPropSpy.notCalled)
    })

    it('payment status is not provided', function () {
      paymentsEnabled = false
      const state = defaultState.setIn(['ledger', 'promotion'], Immutable.fromJS({
        promotionId: '1'
      }))
      const result = ledgerState.setActivePromotion(state)
      const expectedState = state
        .setIn(['ledger', 'promotion', 'activeState'], 'disabledWallet')
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(setPromotionPropSpy.calledOnce)
      paymentsEnabled = true
    })

    it('payment is disabled', function () {
      const state = defaultState.setIn(['ledger', 'promotion'], Immutable.fromJS({
        promotionId: '1'
      }))
      const result = ledgerState.setActivePromotion(state, false)
      const expectedState = state
        .setIn(['ledger', 'promotion', 'activeState'], 'disabledWallet')
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(setPromotionPropSpy.calledOnce)
    })

    it('payment is enabled, but wallet is empty', function () {
      const state = defaultState.setIn(['ledger', 'promotion'], Immutable.fromJS({
        promotionId: '1'
      }))
      const result = ledgerState.setActivePromotion(state, true)
      const expectedState = state
        .setIn(['ledger', 'promotion', 'activeState'], 'emptyWallet')
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(setPromotionPropSpy.calledOnce)
    })

    it('payment is enabled and wallet is founded', function () {
      const state = defaultState
        .setIn(['ledger', 'info', 'balance'], 10)
        .setIn(['ledger', 'promotion'], Immutable.fromJS({
          promotionId: '1'
        }))
      const result = ledgerState.setActivePromotion(state, true)
      const expectedState = state
        .setIn(['ledger', 'promotion', 'activeState'], 'fundedWallet')
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(setPromotionPropSpy.calledOnce)
    })
  })

  describe('getActivePromotion', function () {
    it('active state is missing', function () {
      const result = ledgerState.getActivePromotion(defaultState)
      assert.deepEqual(result.toJS(), {})
    })

    it('active state is provided, but promotion do not have this promotion', function () {
      const state = defaultState.setIn(['ledger', 'promotion', 'activeState'], 'emptyWallet')
      const result = ledgerState.getActivePromotion(state)
      assert.deepEqual(result.toJS(), {})
    })

    it('promotion is found', function () {
      const notification = {
        notification: {
          message: 'Hi'
        }
      }
      const state = defaultState
        .setIn(['ledger', 'promotion', 'activeState'], 'emptyWallet')
        .setIn(['ledger', 'promotion', 'stateWallet', 'emptyWallet'], Immutable.fromJS(notification))
      const result = ledgerState.getActivePromotion(state)
      assert.deepEqual(result.toJS(), notification)
    })
  })

  describe('setPromotionProp', function () {
    it('null case', function () {
      const result = ledgerState.setPromotionProp(defaultState)
      assert.deepEqual(result.toJS(), defaultState.toJS())
    })

    it('prop is set', function () {
      const result = ledgerState.setPromotionProp(defaultState, 'promotionId', '1')
      const expectedState = defaultState.setIn(['ledger', 'promotion', 'promotionId'], '1')
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })

  describe('removePromotion', function () {
    it('null case', function () {
      const result = ledgerState.removePromotion(defaultState)
      const expectedState = defaultState.setIn(['ledger', 'promotion'], Immutable.Map())
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })

    it('remove promotion', function () {
      const state = defaultState.setIn(['ledger', 'promotion'], Immutable.fromJS({
        promotionId: '1'
      }))
      const result = ledgerState.removePromotion(state)
      const expectedState = state.setIn(['ledger', 'promotion'], Immutable.Map())
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })

  describe('remindMeLater', function () {
    let fakeClock

    before(function () {
      fakeClock = sinon.useFakeTimers()
      fakeClock.tick(6000)
    })

    after(function () {
      fakeClock.restore()
    })

    it('null case', function () {
      const result = ledgerState.remindMeLater(defaultState)
      const expectedState = defaultState.setIn(['ledger', 'promotion', 'remindTimestamp'], 86406000)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })

    it('custom time', function () {
      const result = ledgerState.remindMeLater(defaultState, 50)
      const expectedState = defaultState.setIn(['ledger', 'promotion', 'remindTimestamp'], 6050)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })

  describe('getPromotionNotification', function () {
    it('promotion is missing', function () {
      const result = ledgerState.getPromotionNotification(defaultState)
      assert.deepEqual(result.toJS(), {})
    })

    it('we do not have active promotion', function () {
      const state = defaultState.setIn(['ledger', 'promotion', 'activeState'], 'emptyWallet')
      const result = ledgerState.getPromotionNotification(state)
      assert.deepEqual(result.toJS(), {})
    })

    it('notification is missing', function () {
      const state = defaultState
        .setIn(['ledger', 'promotion', 'activeState'], 'emptyWallet')
        .setIn(['ledger', 'promotion', 'stateWallet', 'emptyWallet'], Immutable.Map())
      const result = ledgerState.getPromotionNotification(state)
      assert.deepEqual(result.toJS(), {})
    })

    it('notification is returned', function () {
      const notification = {
        message: 'Hello'
      }
      const state = defaultState
        .setIn(['ledger', 'promotion', 'activeState'], 'emptyWallet')
        .setIn(['ledger', 'promotion', 'stateWallet', 'emptyWallet', 'notification'], Immutable.fromJS(notification))
      const result = ledgerState.getPromotionNotification(state)
      assert.deepEqual(result.toJS(), notification)
    })
  })

  describe('setPromotionNotificationProp', function () {
    it('null case', function () {
      const result = ledgerState.setPromotionNotificationProp(defaultState)
      assert.deepEqual(result.toJS(), defaultState.toJS())
    })

    it('active state is missing', function () {
      const result = ledgerState.setPromotionNotificationProp(defaultState, 'message')
      assert.deepEqual(result.toJS(), defaultState.toJS())
    })

    it('prop is set', function () {
      const state = defaultState
        .setIn(['ledger', 'promotion', 'activeState'], 'emptyWallet')
      const result = ledgerState.setPromotionNotificationProp(state, 'message', 'Hello')
      const expectedState = state
        .setIn(['ledger', 'promotion', 'stateWallet', 'emptyWallet', 'notification', 'message'], 'Hello')
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })

  describe('getAboutPromotion', function () {
    it('no active promotion', function () {
      const result = ledgerState.getAboutPromotion(defaultState)
      assert.deepEqual(result.toJS(), {})
    })

    it('active promotion (no claim)', function () {
      const promo = Immutable.fromJS({
        notification: {
          message: 'Hello'
        }
      })
      const state = defaultState
        .setIn(['ledger', 'promotion', 'activeState'], 'emptyWallet')
        .setIn(['ledger', 'promotion', 'stateWallet', 'emptyWallet'], promo)
      const result = ledgerState.getAboutPromotion(state)
      assert.deepEqual(result.toJS(), promo.toJS())
    })

    it('promotion was claimed', function () {
      const promo = Immutable.fromJS({
        notification: {
          message: 'Hello'
        }
      })
      const state = defaultState
        .setIn(['ledger', 'promotion', 'activeState'], 'emptyWallet')
        .setIn(['ledger', 'promotion', 'claimedTimestamp'], 10000)
        .setIn(['ledger', 'promotion', 'stateWallet', 'emptyWallet'], promo)
      const result = ledgerState.getAboutPromotion(state)
      const expectedPromo = promo.set('claimedTimestamp', 10000)
      assert.deepEqual(result.toJS(), expectedPromo.toJS())
    })
  })

  describe('resetInfo', function () {
    it('null case', function () {
      const state = defaultState.setIn(['ledger', 'info'], Immutable.fromJS({
        paymentId: 'a-1-a',
        balance: 10.00
      }))
      const result = ledgerState.resetInfo(state)
      const expectedState = defaultState.setIn(['ledger', 'info'], Immutable.Map())
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })

    it('keep is on, but paymentId and transactions are not there', function () {
      const state = defaultState.setIn(['ledger', 'info'], Immutable.fromJS({
        balance: 10.00
      }))
      const result = ledgerState.resetInfo(state, true)
      const expectedState = defaultState.setIn(['ledger', 'info'], Immutable.Map())
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })

    it('keep it', function () {
      const state = defaultState.setIn(['ledger', 'info'], Immutable.fromJS({
        paymentId: 'a-1-a',
        transactions: [
          {
            votes: 15
          }
        ],
        balance: 10.00
      }))
      const result = ledgerState.resetInfo(state, true)
      const expectedState = defaultState.setIn(['ledger', 'info'], Immutable.fromJS({
        paymentId: 'a-1-a',
        transactions: [
          {
            votes: 15
          }
        ]
      }))
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })

  describe('getPromotionProp', function () {
    it('null case', function () {
      const result = ledgerState.getPromotionProp(defaultState)
      assert.deepEqual(result, null)
    })

    it('prop is set', function () {
      const state = defaultState.setIn(['ledger', 'promotion', 'promotionId'], '1')
      const result = ledgerState.getPromotionProp(state, 'promotionId')
      assert.deepEqual(result, '1')
    })
  })

  describe('getContributionAmount', function () {
    beforeEach(function () {
      paymentsAmount = 5
    })

    it('user did change the amount', function () {
      paymentsAmount = 10
      const result = ledgerState.getContributionAmount()
      assert.equal(result, 10)
    })

    it('state contains the amount', function () {
      paymentsAmount = null
      const state = defaultState
        .setIn(['ledger', 'info', 'contributionAmount'], 15)
      const result = ledgerState.getContributionAmount(state, 'promotionId')
      assert.equal(result, 15)
    })

    describe('we pass amount directly', function () {
      beforeEach(function () {
        paymentsAmount = null
      })

      it('amount is word', function () {
        const result = ledgerState.getContributionAmount(null, 'sdfsdf')
        assert.equal(result, 5)
      })

      it('amount is string', function () {
        const result = ledgerState.getContributionAmount(null, '10.5')
        assert.equal(result, 10.5)
      })

      it('amount is number', function () {
        const result = ledgerState.getContributionAmount(null, 11)
        assert.equal(result, 11)
      })

      it('amount is 0', function () {
        const result = ledgerState.getContributionAmount(null, 0)
        assert.equal(result, 5)
      })
    })
  })

  describe('setAboutProp', function () {
    it('null case', function () {
      const result = ledgerState.setAboutProp(defaultState)
      assert.deepEqual(result.toJS(), defaultState.toJS())
    })

    it('prop is set', function () {
      const result = ledgerState.setAboutProp(defaultState, 'status', 'ok')
      const expectedState = defaultState.setIn(['ledger', 'about', 'status'], 'ok')
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })

  describe('getAboutProp', function () {
    it('null case', function () {
      const result = ledgerState.getAboutProp(defaultState)
      assert.equal(result, null)
    })

    it('prop is set', function () {
      const state = defaultState.setIn(['ledger', 'about', 'status'], 'corrupted')
      const result = ledgerState.getAboutProp(state, 'status')
      assert.equal(result, 'corrupted')
    })
  })
})
