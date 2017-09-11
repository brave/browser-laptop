/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

const braveDragTypePrefix = 'application/x-brave-'

module.exports.hasDragData = (dataTransfer, dragType) => {
  return dataTransfer.types.includes(`${braveDragTypePrefix}${dragType}`)
}

module.exports.getDragData = (dataTransfer, dragType) => {
  const data = dataTransfer.getData(`${braveDragTypePrefix}${dragType}`)
  if (!data) {
    return undefined
  }
  return Immutable.fromJS(JSON.parse(data))
}

module.exports.hasBraveDragData = (dataTransfer) => {
  if (!dataTransfer || !dataTransfer.types) {
    return false
  }
  for (let i = 0; i < dataTransfer.types.length; i++) {
    let type = dataTransfer.types[i]
    if (type && type.startsWith(braveDragTypePrefix)) {
      return true
    }
  }
  return false
}

module.exports.setupDataTransferURL = (dataTransfer, location, title) => {
  dataTransfer.setData('text/plain', location)
  dataTransfer.setData('text/uri-list', location)
  dataTransfer.setData('text/html', `<html><head><meta http-equiv="content-type" content="text/html; charset=utf-8"></head><body><A HREF="${location}">${title || location}</A></body></html>`)
}

module.exports.setupDataTransferBraveData = (dataTransfer, dragType, data) => {
  dataTransfer.setData(`application/x-brave-${dragType}`, JSON.stringify(data))
}

module.exports.shouldPrependVerticalItem = (target, clientY) => {
  const boundingRect = target.getBoundingClientRect()
  return clientY < boundingRect.top + ((boundingRect.bottom - boundingRect.top) / 2)
}
