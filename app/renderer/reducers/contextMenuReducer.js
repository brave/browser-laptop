/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')

// Constants
const config = require('../../../js/constants/config.js')
const windowConstants = require('../../../js/constants/windowConstants')

// State
const contextMenuState = require('../../common/state/contextMenuState.js')

// Actions
const appActions = require('../../../js/actions/appActions.js')
const windowAction = require('../../../js/actions/windowActions.js')

// Utils
const eventUtil = require('../../../js/lib/eventUtil.js')
const CommonMenu = require('../../common/commonMenu.js')
const locale = require('../../../js/l10n.js')
const { makeImmutable, isMap } = require('../../common/state/immutableUtil')

const validateAction = function (action) {
  action = makeImmutable(action)
  assert.ok(isMap(action), 'action must be an Immutable.Map')
  return action
}

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  return state
}

const onLongBackHistory = (state, action) => {
  action = validateAction(action)
  state = validateState(state)
  const history = action.get('history')

  const menuTemplate = []

  if (action.get('tabId') > -1 && history && history.get('entries').size > 0) {
    const stopIndex = Math.max(((history.get('currentIndex') - config.navigationBar.maxHistorySites) - 1), -1)
    for (let index = (history.get('currentIndex') - 1); index > stopIndex; index--) {
      const entry = history.getIn(['entries', index])
      const url = entry.get('url')

      menuTemplate.push({
        label: entry.get('display'),
        icon: entry.get('icon'),
        click: function (e) {
          if (eventUtil.isForSecondaryAction(e)) {
            appActions.createTabRequested({
              url,
              partitionNumber: action.get('partitionNumber'),
              active: !!e.shiftKey
            })
          } else {
            appActions.onGoToIndex(action.get('tabId'), index)
          }
        }
      })
    }

    // Always display "Show History" link
    menuTemplate.push(
      CommonMenu.separatorMenuItem,
      {
        label: locale.translation('showAllHistory'),
        click: function () {
          appActions.createTabRequested({
            url: 'about:history'
          })
          windowAction.setContextMenuDetail()
        }
      })

    state = contextMenuState.setContextMenu(state, makeImmutable({
      left: action.get('left'),
      top: action.get('top'),
      template: menuTemplate
    }))
  }

  return state
}

const onLongForwardHistory = (state, action) => {
  action = validateAction(action)
  state = validateState(state)
  const history = action.get('history')

  const menuTemplate = []

  if (action.get('tabId') > -1 && history && history.get('entries').size > 0) {
    const stopIndex = Math.min(((history.get('currentIndex') + config.navigationBar.maxHistorySites) + 1), history.get('entries').size)
    for (let index = (history.get('currentIndex') + 1); index < stopIndex; index++) {
      const entry = history.getIn(['entries', index])
      const url = entry.get('url')

      menuTemplate.push({
        label: entry.get('display'),
        icon: entry.get('icon'),
        click: function (e) {
          if (eventUtil.isForSecondaryAction(e)) {
            appActions.createTabRequested({
              url,
              partitionNumber: action.get('partitionNumber'),
              active: !!e.shiftKey
            })
          } else {
            appActions.onGoToIndex(action.get('tabId'), index)
          }
        }
      })
    }

    // Always display "Show History" link
    menuTemplate.push(
      CommonMenu.separatorMenuItem,
      {
        label: locale.translation('showAllHistory'),
        click: function () {
          appActions.createTabRequested({
            url: 'about:history'
          })
          windowAction.setContextMenuDetail()
        }
      })

    state = contextMenuState.setContextMenu(state, makeImmutable({
      left: action.get('left'),
      top: action.get('top'),
      template: menuTemplate
    }))
  }

  return state
}

const contextMenuReducer = (windowState, action) => {
  switch (action.actionType) {
    case windowConstants.WINDOW_ON_GO_BACK_LONG:
      windowState = onLongBackHistory(windowState, action)
      break
    case windowConstants.WINDOW_ON_GO_FORWARD_LONG:
      windowState = onLongForwardHistory(windowState, action)
      break
  }

  return windowState
}

module.exports = contextMenuReducer
