/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const tabState = require('../../../common/state//tabState')
const { getCurrentWindowId } = require('../../currentWindow')
const withDragSortDetach = require('../common/withDragSortDetach')
const ReduxComponent = require('../reduxComponent')
const ConnectedTab = require('./tab')

function isTabElement (element) {
  return element != null && (element.getAttribute('data-tab-area') || false)
}

function evaluateDraggingTabWidth (elementRef) {
  const sibling = isTabElement(elementRef.nextElementSibling)
    ? elementRef.nextElementSibling
    : isTabElement(elementRef.previousElementSibling)
      ? elementRef.previousElementSibling
      : null
  const parentElement = elementRef.parentElement
  if (!parentElement) {
    throw new Error('Cannot drag an element with no parent')
  }
  const nonDraggingItemWidth = sibling ? sibling.getBoundingClientRect().width : 0
  const draggingItemWidth = elementRef.getBoundingClientRect().width
  // save parent position in order to know where first-tab position is, and also the bounds for detaching
  // this is cached and re-evaluated whenever the drag operation starts (or is attached to a different window)
  // if, for some reason, the parent position can change during a drag operation, then this should be re-evaluated
  // more often
  // but only consider tabs within the parent, allowing us to have non sortable / draggable elements inside the parent
  // ...e.g. buttons
  let tabsSelector = '[data-draggable-tab]'

  const allDraggableTabs = parentElement.querySelectorAll(tabsSelector)
  let parentClientRect
  if (allDraggableTabs.length) {
    const firstTab = allDraggableTabs.item(0)
    const lastTab = allDraggableTabs.item(allDraggableTabs.length - 1)
    const firstTabRect = firstTab.getBoundingClientRect()
    const lastTabRect = firstTab === lastTab ? firstTabRect : lastTab.getBoundingClientRect()
    parentClientRect = {
      x: firstTabRect.left,
      y: firstTabRect.top,
      left: firstTabRect.left,
      top: firstTabRect.top,
      width: lastTabRect.left + lastTabRect.width - firstTabRect.left,
      height: firstTabRect.height,
      offsetDifference: firstTabRect.left - parentElement.getBoundingClientRect().left,
      windowWidth: document.body ? document.body.clientWidth : 0
    }
  }
  return {
    draggingItemWidth,
    nonDraggingItemWidth,
    parentClientRect
  }
}

const DragSortDetachTab = withDragSortDetach(ConnectedTab, evaluateDraggingTabWidth)

// give drag functionality the data from state it needs
const mergeStateToDraggableProps = (state, ownProps) => {
  const frame = ownProps.frame
  const tabId = frame.get('tabId', tabState.TAB_ID_NONE)

  const props = Object.assign({
    onStartDragSortDetach: ownProps.onStartDragSortDetach,
    onRequestDetach: ownProps.onRequestDetach,
    onDragChangeIndex: ownProps.onDragChangeIndex,
    onDragMoveSingleItem: ownProps.onDragMoveSingleItem,
    displayIndex: ownProps.displayIndex,
    totalItemCount: ownProps.totalTabCount || ownProps.displayedTabCount,
    firstItemDisplayIndex: ownProps.firstItemDisplayIndex != null ? ownProps.firstItemDisplayIndex : 0,
    displayedItemCount: ownProps.displayedTabCount,
    dragCanDetach: ownProps.dragCanDetach,
    dragData: ownProps.dragData
  }, ownProps)
  // drag-related
  const windowId = getCurrentWindowId()
  const dragSourceData = state.get('tabDragData')
  // let's draggable know when the container contents have changed (maybe this item was dragged
  // to another 'page'), so it can re-evaluate any data that has changed
  props.containerKey = ownProps.tabPageIndex != null ? ownProps.tabPageIndex : 0
  if (
    dragSourceData &&
    tabState.isTabDragging(state, tabId)
  ) {
    // make sure we're setup
    props.isDragging = true
    const dragIntendedWindowId = dragSourceData ? dragSourceData.get('currentWindowId') : null
    // TODO: this is probably not needed anymore, but did prevent some crashes previously
    props.dragProcessMoves =
      !dragSourceData.has('attachRequestedWindowId') &&
      !dragSourceData.has('detachedFromWindowId') &&
      dragIntendedWindowId === windowId &&
      tabState.getWindowId(state, tabId) === windowId
    props.relativeXDragStart = dragSourceData.get('relativeXDragStart')
    props.dragWindowClientX = dragSourceData.get('dragWindowClientX')
    props.dragWindowClientY = dragSourceData.get('dragWindowClientY')
    props.detachedFromItemX = dragSourceData.get('detachedFromTabX')
  } else {
    props.isDragging = false
    props.dragProcessMoves = false
    props.relativeXDragStart = null
    props.dragWindowClientX = null
    props.dragWindowClientY = null
    props.detachedFromItemX = null
  }
  return props
}

const ConnectedDragSortDetachTab = ReduxComponent.connect(DragSortDetachTab, mergeStateToDraggableProps)

ConnectedDragSortDetachTab.defaultProps = {
  firstTabDisplayIndex: 0
}

module.exports = ConnectedDragSortDetachTab
