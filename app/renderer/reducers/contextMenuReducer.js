/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')
const Immutable = require('immutable')
const electron = require('electron')
const remote = electron.remote
const Menu = remote.Menu

// Constants
const config = require('../../../js/constants/config.js')
const windowConstants = require('../../../js/constants/windowConstants')
const settings = require('../../../js/constants/settings')

// State
const contextMenuState = require('../../common/state/contextMenuState')

// Actions
const appActions = require('../../../js/actions/appActions')
const windowActions = require('../../../js/actions/windowActions')

// Utils
const eventUtil = require('../../../js/lib/eventUtil')
const CommonMenu = require('../../common/commonMenu')
const locale = require('../../../js/l10n.js')
const {makeImmutable, isMap} = require('../../common/state/immutableUtil')
const {getSetting} = require('../../../js/settings')
const frameStateUtil = require('../../../js/state/frameStateUtil')
const {getCurrentWindow} = require('../../renderer/currentWindow')

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

function generateMuteFrameList (framePropsList, muted) {
  return framePropsList.map((frameProp) => {
    return {
      frameKey: frameProp.get('key'),
      tabId: frameProp.get('tabId'),
      muted: muted && frameProp.get('audioPlaybackActive') && !frameProp.get('audioMuted')
    }
  })
}

const onTabPageMenu = function (state, action) {
  action = validateAction(action)
  state = validateState(state)

  const index = action.get('index')
  if (index == null || index < 0) {
    return
  }

  const frames = frameStateUtil.getNonPinnedFrames(state) || Immutable.List()
  const tabsPerPage = Number(getSetting(settings.TABS_PER_PAGE))
  const tabPageFrames = frames.slice(index * tabsPerPage, (index * tabsPerPage) + tabsPerPage)

  if (tabPageFrames.isEmpty()) {
    return
  }

  const template = [{
    label: locale.translation('unmuteTabs'),
    click: () => {
      windowActions.muteAllAudio(generateMuteFrameList(tabPageFrames, false))
    }
  }, {
    label: locale.translation('muteTabs'),
    click: () => {
      windowActions.muteAllAudio(generateMuteFrameList(tabPageFrames, true))
    }
  }, {
    label: locale.translation('closeTabPage'),
    click: () => {
      windowActions.closeFrames(tabPageFrames)
    }
  }]

  const tabPageMenu = Menu.buildFromTemplate(template)
  tabPageMenu.popup(getCurrentWindow())
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
          windowActions.setContextMenuDetail()
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
          windowActions.setContextMenuDetail()
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
    case windowConstants.WINDOW_ON_TAB_PAGE_CONTEXT_MENU:
      onTabPageMenu(windowState, action)
      break
  }

  return windowState
}

module.exports = contextMenuReducer
