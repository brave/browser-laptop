/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const WindowActions = require('./actions/windowActions')
const ReactDOM = require('react-dom')

module.exports.onDragStart = (dragType, key, e) => {
  e.dataTransfer.effectAllowed = 'all'
  WindowActions.setIsBeingDragged(dragType, key, true)
}

module.exports.onDragEnd = (dragType, key) => {
  console.log('onDragEnd!', dragType, key.toJS())
  WindowActions.setIsBeingDragged(dragType, key, false)
  WindowActions.setIsBeingDraggedOverDetail(dragType)
}

module.exports.onDragOver = (dragType, sourceDragData, sourceBoundingRect, draggingOverKey, draggingOverDetail, e) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'

  // Otherise, only accept it if we have some frameProps
  if (!sourceDragData) {
    WindowActions.setIsBeingDraggedOverDetail(dragType, draggingOverKey, {
      draggingOverLeftHalf: false,
      draggingOverRightHalf: false
    })
    return
  }

  if (e.clientX > sourceBoundingRect.left && e.clientX < sourceBoundingRect.left + sourceBoundingRect.width / 2 &&
    (!draggingOverDetail || !draggingOverDetail.get('draggingOverLeftHalf'))) {
    WindowActions.setIsBeingDraggedOverDetail(dragType, draggingOverKey, {
      draggingOverLeftHalf: true,
      draggingOverRightHalf: false
    })
  } else if (e.clientX < sourceBoundingRect.right && e.clientX >= sourceBoundingRect.left + sourceBoundingRect.width / 2 &&
    (!draggingOverDetail || !draggingOverDetail.get('draggingOverRightHalf'))) {
    WindowActions.setIsBeingDraggedOverDetail(dragType, draggingOverKey, {
      draggingOverLeftHalf: false,
      draggingOverRightHalf: true
    })
  }
}

module.exports.closestFromXOffset = (refs, x) => {
  let smallestValue = Number.MAX_VALUE
  let selectedRef
  refs.forEach(ref => {
    let refNode = ReactDOM.findDOMNode(ref)
    let currentDistance = Math.abs(x - refNode.getBoundingClientRect().left)
    if (currentDistance < smallestValue) {
      smallestValue = currentDistance
      selectedRef = ref
    }
  })
  return selectedRef
}

module.exports.isLeftSide = (domNode, clientX) => {
  const boundingRect = domNode.getBoundingClientRect()
  return Math.abs(clientX - boundingRect.left) < Math.abs(clientX - boundingRect.right)
}

module.exports.setupDataTransferURL = (dataTransfer, location, title) => {
  dataTransfer.setData('text/plain', location)
  dataTransfer.setData('text/uri-list', location)
  dataTransfer.setData('text/html', `<html><head><meta http-equiv="content-type" content="text/html; charset=utf-8"></head><body><A HREF="${location}">${title || location}</A></body></html>`)
}
