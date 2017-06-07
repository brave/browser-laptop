/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

function bookmarkHangerHeading (detail, isFolder, shouldShowLocation) {
  if (isFolder) {
    return shouldShowLocation
      ? 'bookmarkFolderEditing'
      : 'bookmarkFolderAdding'
  }
  return shouldShowLocation
    ? (!detail || !detail.has('location'))
      ? 'bookmarkCreateNew'
      : 'bookmarkEdit'
    : 'bookmarkAdded'
}

function displayBookmarkName (detail) {
  const customTitle = detail.get('customTitle')
  if (customTitle !== undefined && customTitle !== '') {
    return customTitle || ''
  }
  return detail.get('title') || ''
}

function isBookmarkNameValid (detail, isFolder) {
  const title = detail.get('title') || detail.get('customTitle')
  const location = detail.get('location')
  return isFolder
    ? (title != null && title.trim().length > 0)
    : (location != null && location.trim().length > 0)
}

module.exports = {
  bookmarkHangerHeading,
  displayBookmarkName,
  isBookmarkNameValid
}
