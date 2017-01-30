/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const windowActions = require('./actions/windowActions')
const appActions = require('./actions/appActions')
const ReactDOM = require('react-dom')
const dndData = require('./dndData')
const dragTypes = require('./constants/dragTypes')
const siteTags = require('./constants/siteTags')
const siteUtil = require('./state/siteUtil')
const appStoreRenderer = require('./stores/appStoreRenderer')
const {currentWindowId} = require('../app/renderer/currentWindow')

let isDraggingInsideWindow = false

module.exports.getInterBraveDragData = () => {
  return appStoreRenderer.state.getIn(['dragData', 'data'])
}

module.exports.getInterBraveDragType = () => {
  return appStoreRenderer.state.getIn(['dragData', 'type'])
}

document.addEventListener('dragenter', () => {
  isDraggingInsideWindow = true
}, true)

document.addEventListener('dragleave', (e) => {
  if (!e.clientX && !e.clientY) {
    isDraggingInsideWindow = false
  }
}, true)

module.exports.isDraggingInsideWindow = () => isDraggingInsideWindow

module.exports.onDragStart = (dragType, data, e) => {
  e.dataTransfer.effectAllowed = 'all'
  dndData.setupDataTransferBraveData(e.dataTransfer, dragType, data)
  if (dragType === dragTypes.BOOKMARK) {
    dndData.setupDataTransferURL(e.dataTransfer, data.get('location'), data.get('customTitle') || data.get('title'))
  }
  appActions.dragStarted(currentWindowId, dragType, data)
}

module.exports.onDragEnd = (dragType, key) => {
  windowActions.setContextMenuDetail()
  appActions.dragEnded()
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
      draggingOverWindowId: currentWindowId
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
      draggingOverWindowId: currentWindowId
    })
    windowActions.setContextMenuDetail()
  } else if (e.clientX < sourceBoundingRect.right && e.clientX >= sourceBoundingRect.left + (sourceBoundingRect.width / 5) &&
    (!draggingOverDetail || !draggingOverDetail.get('draggingOverRightHalf'))) {
    appActions.draggedOver({
      draggingOverKey,
      draggingOverType: dragType,
      draggingOverLeftHalf: false,
      draggingOverRightHalf: true,
      draggingOverWindowId: currentWindowId
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

module.exports.isMiddle = (domNode, clientX) => {
  const boundingRect = domNode.getBoundingClientRect()
  const isLeft = clientX < boundingRect.left + ((boundingRect.right - boundingRect.left) / 3)
  const isRight = clientX > boundingRect.right - ((boundingRect.right - boundingRect.left) / 3)
  return !isLeft && !isRight
}

module.exports.prepareBookmarkDataFromCompatible = (dataTransfer) => {
  let bookmark = dndData.getDragData(dataTransfer, dragTypes.BOOKMARK)
  if (!bookmark) {
    const frameProps = dndData.getDragData(dataTransfer, dragTypes.TAB)
    if (frameProps) {
      bookmark = siteUtil.getDetailFromFrame(frameProps, siteTags.BOOKMARK)
      appActions.addSite(bookmark, siteTags.BOOKMARK)
    }
  }
  return bookmark
}
