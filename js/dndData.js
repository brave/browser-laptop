/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

module.exports.hasDragData = (dataTransfer, dragType) => {
  return dataTransfer.types.includes(`application/x-brave-${dragType}`)
}
// Construct a pipe-delimited bookmark key from the bookmark's main identifiers.
module.exports.setBookmarkKey = ({
  location, parentFolderId, partitionNumber
}) => {
  return [location, partitionNumber, parentFolderId].join('|')
}

// Return the last item, the parentFolderId, from the pipe-delimited key.
module.exports.getBookmarkKeyFolderId = (key) => {
  const keySplit = key.split('|')
  return keySplit[keySplit.length - 1]
}
// Get data from a drag event, e.g. drag of a bookmark between folders.
module.exports.getDragData = function(dataTransfer, dragType) {
  // Get the bookmark's data from the event.
  const data = dataTransfer.getData(`application/x-brave-${dragType}`)
  // Validate.
  if (!data) {
    // If invalid, exit w/ undefined (or falsey value?).
    return undefined
  }
  // If valid, parse data to get bookmark and its identifiers.
  const bookmark = JSON.parse(data)
  const { key, parentFolderId } = bookmark
  const keyFolderId = this.getBookmarkKeyFolderId(key)
  // Reset to correct key if key's parentFolderId set to top-level folder,
  // not actual parent folder ID.
  if (parentFolderId !== keyFolderId) {
    bookmark.key = this.setBookmarkKey(bookmark)
  }
  // Return the bookmark as an immutable object.
  return Immutable.fromJS(bookmark)
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
