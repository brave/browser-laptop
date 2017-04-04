/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const windowConstants = require('../../../js/constants/windowConstants')
const frameStateUtil = require('../../../js/state/frameStateUtil')
const siteUtil = require('../../../js/state/siteUtil')
const appActions = require('../../../js/actions/appActions')
const settings = require('../../../js/constants/settings')
const getSetting = require('../../../js/settings').getSetting
const {updateTabPageIndex} = require('../lib/tabUtil')

const setFullScreen = (state, action) => {
  return state.mergeIn(['frames', frameStateUtil.getFramePropsIndex(state.get('frames'), action.frameProps)], {
    isFullScreen: action.isFullScreen !== undefined ? action.isFullScreen : state.getIn(['frames', frameStateUtil.getFramePropsIndex(state.get('frames'), action.frameProps)].concat('isFullScreen')),
    showFullScreenWarning: action.showFullScreenWarning
  })
}

const frameReducer = (state, action) => {
  switch (action.actionType) {
    case windowConstants.WINDOW_CLOSE_FRAMES:
      const activeFrameKey = state.get('activeFrameKey')
      const activeFrame = frameStateUtil.findFrameInList(action.framePropsList, activeFrameKey)

      if (activeFrame) {
        const origin = siteUtil.getOrigin(activeFrame.get('location'))
        if (origin) {
          appActions.clearNotifications(origin)
        }

        // If the frame was full screen, exit
        if (activeFrame && activeFrame.get('isFullScreen')) {
          state = setFullScreen(state, {
            frameProps: activeFrame,
            isFullScreen: false
          })
        }
      }

      state = state.merge(frameStateUtil.removeFrames(
        state.get('frames'),
        state.get('tabs'),
        state.get('closedFrames'),
        action.framePropsList,
        activeFrame,
        state.get('activeFrameKey'),
        getSetting(settings.TAB_CLOSE_ACTION)
      ))

      state = updateTabPageIndex(state, frameStateUtil.getActiveFrame(state))
      state = state.deleteIn(['ui', 'tabs', 'fixTabWidth'])
      break

    case windowConstants.WINDOW_SET_FULL_SCREEN:
      state = setFullScreen(state, action)
      break
  }

  return state
}

module.exports = frameReducer
