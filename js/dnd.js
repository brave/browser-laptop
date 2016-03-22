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

let inProcessDragData
let inProcessDragType

module.exports.getInProcessDragData = () => {
  return inProcessDragData
}

module.exports.getInProcessDragType = () => {
  return inProcessDragType
}

module.exports.onDragStart = (dragType, data, e) => {
  e.dataTransfer.effectAllowed = 'all'
  dndData.setupDataTransferBraveData(e.dataTransfer, dragType, data)
  if (dragType === dragTypes.BOOKMARK) {
    dndData.setupDataTransferURL(e.dataTransfer, data.get('location'), data.get('customTitle') || data.get('title'))
  }
  inProcessDragData = data
  inProcessDragType = dragType
}

module.exports.onDragEnd = (dragType, key) => {
  windowActions.setIsBeingDraggedOverDetail(dragType)
  windowActions.setContextMenuDetail()
  inProcessDragData = undefined
  inProcessDragType = undefined
}

module.exports.onDragOver = (dragType, sourceBoundingRect, draggingOverKey, draggingOverDetail, e) => {
  if (inProcessDragType !== dragType) {
    return
  }

  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  // Otherise, only accept it if we have some frameProps
  if (!dndData.hasDragData(e.dataTransfer, dragType)) {
    windowActions.setIsBeingDraggedOverDetail(dragType, draggingOverKey, {
      draggingOverLeftHalf: false,
      draggingOverRightHalf: false
    })
    return
  }

  if (!sourceBoundingRect) {
    return
  }

  if (e.clientX > sourceBoundingRect.left && e.clientX < sourceBoundingRect.left + sourceBoundingRect.width / 5 &&
    (!draggingOverDetail || !draggingOverDetail.get('draggingOverLeftHalf'))) {
    windowActions.setIsBeingDraggedOverDetail(dragType, draggingOverKey, {
      draggingOverLeftHalf: true,
      draggingOverRightHalf: false
    })
    windowActions.setContextMenuDetail()
  } else if (e.clientX < sourceBoundingRect.right && e.clientX >= sourceBoundingRect.left + sourceBoundingRect.width / 5 &&
    (!draggingOverDetail || !draggingOverDetail.get('draggingOverRightHalf'))) {
    windowActions.setIsBeingDraggedOverDetail(dragType, draggingOverKey, {
      draggingOverLeftHalf: false,
      draggingOverRightHalf: true
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
    let currentDistance = Math.abs(x - rect.left + (rect.right - rect.left) / 2)
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
  return clientX < boundingRect.left + (boundingRect.right - boundingRect.left) / 2
}

module.exports.isMiddle = (domNode, clientX) => {
  const boundingRect = domNode.getBoundingClientRect()
  const isLeft = clientX < boundingRect.left + (boundingRect.right - boundingRect.left) / 3
  const isRight = clientX > boundingRect.right - (boundingRect.right - boundingRect.left) / 3
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
