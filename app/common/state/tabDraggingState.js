/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/
*/
const { createSelector } = require('reselect')
const {getCurrentWindowId} = require('../../renderer/currentWindow')

const appStateKey = 'tabDragData'
const windowStateKeyPath = ['ui', 'tabs', 'dragData']

const dragDataSelector = state => state.get(appStateKey)

const sourceFrameSelector = createSelector(
  dragDataSelector,
  dragData => dragData && dragData.get('frame')
)

const dragDetachedWindowIdSelector = createSelector(
  dragDataSelector,
  dragState => dragState && dragState.get('dragDetachedWindowId')
)

const windowUIStateSelector = windowState => windowState.get('ui')

const windowTabUIStateSelector = createSelector(
  windowUIStateSelector,
  uiState => uiState && uiState.get('tabs')
)
const windowTabDragDataSelector = createSelector(
  windowTabUIStateSelector,
  tabUIState => tabUIState && tabUIState.get('dragData')
)

const tabDraggingState = {
  app: {
    isCurrentWindowDetached: createSelector(
      // re-run next function only if dragDetachedWindowId changes
      dragDetachedWindowIdSelector,
      detachedWindowId =>
        detachedWindowId && detachedWindowId === getCurrentWindowId()
    ),

    getDragDetachedWindowId: dragDetachedWindowIdSelector,

    isCurrentWindowBufferWindow: createSelector(
      state => state.getIn([appStateKey, 'bufferWindowId']),
      bufferWindowId => bufferWindowId && bufferWindowId === getCurrentWindowId()
    ),

    isDragging: createSelector(
      dragDataSelector,
      dragState => {
        return dragState != null
      }
    ),

    getDragData: dragDataSelector,

    getSourceTabId: createSelector(
      dragDataSelector,
      dragState => dragState && dragState.get('sourceTabId')
    ),

    getCurrentWindowId: createSelector(
      dragDataSelector,
      dragState => dragState && dragState.get('currentWindowId')
    ),

    getSourceWindowId: createSelector(
      dragDataSelector,
      dragState => dragState && dragState.get('originalWindowId')
    ),

    getTabWidth: createSelector(
      dragDataSelector,
      dragState => dragState && dragState.get('tabWidth')
    ),

    sourceFrame: sourceFrameSelector,

    sourceGuestInstanceId: createSelector(
      sourceFrameSelector,
      frame => frame.get('guestInstanceId')
    ),

    delete: state => state.delete(appStateKey)
  },

  window: {

    getPausingForPageIndex: createSelector(
      windowTabDragDataSelector,
      windowDragState => windowDragState && windowDragState.get('pausingForPageIndexChange')
    ),

    clearDragData: windowState =>
      windowState.deleteIn(windowStateKeyPath),

    setPausingForPageIndexChange: (windowState, pageIndex) =>
      windowState.setIn([...windowStateKeyPath, 'pausingForPageIndexChange'], pageIndex),

    clearPausingForPageIndexChange: (windowState) =>
      windowState.deleteIn([...windowStateKeyPath, 'pausingForPageIndexChange'])
  }
}

module.exports = tabDraggingState
