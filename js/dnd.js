/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const windowActions = require('./actions/windowActions')
const appActions = require('./actions/appActions')
const ReactDOM = require('react-dom')
const dndData = require('./dndData')
const Immutable = require('immutable')
const dragTypes = require('./constants/dragTypes')
const siteTags = require('./constants/siteTags')
const appStoreRenderer = require('./stores/appStoreRenderer')
const {getCurrentWindowId} = require('../app/renderer/currentWindow')
const {ESC} = require('../app/common/constants/keyCodes.js')

module.exports.getInterBraveDragData = () => {
  return appStoreRenderer.state.getIn(['dragData', 'data'])
}

module.exports.getInterBraveDragType = () => {
  return appStoreRenderer.state.getIn(['dragData', 'type'])
}

module.exports.onDragStart = (dragType, data, e) => {
  e.dataTransfer.effectAllowed = 'all'
  dndData.setupDataTransferBraveData(e.dataTransfer, dragType, data)
  if (dragType === dragTypes.BOOKMARK) {
    dndData.setupDataTransferURL(e.dataTransfer, data.get('location'), data.get('title'))
  }
  appActions.dragStarted(getCurrentWindowId(), dragType, data)
}

document.addEventListener('keyup', (e) => {
  if (e.keyCode === ESC) {
    appActions.dragCancelled()
  }
}, true)

module.exports.onDragEnd = () => {
  windowActions.setContextMenuDetail()
  // TODO: This timeout is a hack to give time for the keyup event to fire.
  // The keydown event is not fired currently for dragend events that
  // are canceled with Escape because Chromium calls stopPropagation
  // on the event.  We should patch chromium, then we can remove
  // the hack below and allow keydown Escape to be propagated during a drag.
  // This hack can lead to a user sometimes getting an accidental detached
  // tab when they press escape if they hold down escape. But it works
  // most of the time and that's not commonly done.
  setTimeout(() => {
    appActions.dragEnded()
  }, 100)
}

module.exports.onDragOver = (dragType, sourceBoundingRect, draggingOverKey, draggingOverDetail, e) => {
  if (module.exports.getInterBraveDragType() !== dragType) {
    return
  }

  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  // Otherwise, only accept it if we have some frameProps
  if (!dndData.hasDragData(e.dataTransfer, dragType)) {
    appActions.draggedOver({
      draggingOverKey,
      draggingOverType: dragType,
      draggingOverLeftHalf: false,
      draggingOverRightHalf: false,
      draggingOverWindowId: getCurrentWindowId()
    })
    return
  }

  if (!sourceBoundingRect) {
    return
  }

  if (e.clientX > sourceBoundingRect.left && e.clientX < sourceBoundingRect.left + (sourceBoundingRect.width / 5) &&
    (!draggingOverDetail || !draggingOverDetail.get('draggingOverLeftHalf'))) {
    appActions.draggedOver({
      draggingOverKey,
      draggingOverType: dragType,
      draggingOverLeftHalf: true,
      draggingOverRightHalf: false,
      draggingOverWindowId: getCurrentWindowId()
    })
    windowActions.setContextMenuDetail()
  } else if (e.clientX < sourceBoundingRect.right && e.clientX >= sourceBoundingRect.left + (sourceBoundingRect.width / 5) &&
    (!draggingOverDetail || !draggingOverDetail.get('draggingOverRightHalf'))) {
    appActions.draggedOver({
      draggingOverKey,
      draggingOverType: dragType,
      draggingOverLeftHalf: false,
      draggingOverRightHalf: true,
      draggingOverWindowId: getCurrentWindowId()
    })
    windowActions.setContextMenuDetail()
  }
}

module.exports.closestFromXOffset = (refs, x) => {
  let smallestValue = Number.MAX_VALUE
  let selectedRef
  for (let ref of refs) {
    let refNode = ReactDOM.findDOMNode(ref)
    let boundingRect = refNode.getBoundingClientRect()
    if (x > boundingRect.left && x < boundingRect.right) {
      return {
        selectedRef: ref,
        isDroppedOn: true
      }
    }
    const rect = refNode.getBoundingClientRect()
    let currentDistance = Math.abs(x - rect.left + ((rect.right - rect.left) / 2))
    if (currentDistance < smallestValue) {
      smallestValue = currentDistance
      selectedRef = ref
    }
  }
  return {
    selectedRef,
    isDroppedOn: false
  }
}

module.exports.isLeftSide = (domNode, clientX) => {
  const boundingRect = domNode.getBoundingClientRect()
  return clientX < boundingRect.left + ((boundingRect.right - boundingRect.left) / 2)
}

module.exports.isRightSide = (domNode, clientX) => {
  return !module.exports.isLeftSide(domNode, clientX)
}

module.exports.isMiddle = (domNode, clientX) => {
  const boundingRect = domNode.getBoundingClientRect()
  const isLeft = clientX < boundingRect.left + ((boundingRect.right - boundingRect.left) / 3)
  const isRight = clientX > boundingRect.right - ((boundingRect.right - boundingRect.left) / 3)
  return !isLeft && !isRight
}

module.exports.prepareBookmarkDataFromCompatible = (dataTransfer) => {
  let bookmark = dndData.getDragData(dataTransfer, dragTypes.BOOKMARK)
  if (!bookmark) {
    const dragData = dndData.getDragData(dataTransfer, dragTypes.TAB)
    if (dragData) {
      bookmark = Immutable.fromJS({
        location: dragData.get('location'),
        title: dragData.get('title'),
        type: siteTags.BOOKMARK
      })
    }
  }
  return bookmark
}
