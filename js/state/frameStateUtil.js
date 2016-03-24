/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import Immutable from 'immutable'
const config = require('../constants/config.js')
const urlParse = require('url').parse

export function isFrameKeyActive (windowState, frameKey) {
  return windowState.get('activeFrameKey') === frameKey
}

export function getFrameIndex (windowState, frame) {
  return findIndexForFrameKey(windowState.get('frames'), frame)
}

export function getActiveFrameIndex (windowState) {
  return getFrameIndex(windowState, windowState.get('activeFrameKey'))
}

export function getFrameByIndex (windowState, i) {
  return windowState.getIn(['frames', i])
}

export function getFrameByKey (windowState, key) {
  const i = findIndexForFrameKey(windowState.get('frames'), key)
  return windowState.getIn(['frames', i])
}

export function getActiveFrame (windowState) {
  const activeFrameIndex = getActiveFrameIndex(windowState)
  return windowState.get('frames').get(activeFrameIndex)
}

export function setActiveFrameIndex (windowState, i) {
  const frame = getFrameByIndex(windowState, i)
  if (!frame) {
    return windowState
  }

  return setActiveFrameKey(windowState, frame.get('key'))
}

export function setActiveFrameKey (windowState, activeFrameKey) {
  return windowState.merge({
    activeFrameKey: activeFrameKey,
    previewFrameKey: null
  })
}

export function makeNextFrameActive (windowState) {
  const activeFrameIndex = getActiveFrameIndex(windowState)
  return setActiveFrameIndex(windowState, (activeFrameIndex + 1) % windowState.get('frames').size)
}

export function makePrevFrameActive (windowState) {
  const activeFrameIndex = getActiveFrameIndex(windowState)
  return setActiveFrameIndex(windowState, (windowState.get('frames').size + activeFrameIndex - 1) % windowState.get('frames').size)
}

/**
 * @param {Object} windowState
 * @param {Object} frameProps
 * @param {String} propName
 * @return {Object} the value of the propName associated with frameProps
 */
export function getFramePropValue (windowState, frameProps, propName) {
  return windowState.getIn(getFramePropPath(windowState, frameProps, propName))
}

/**
 * @param {Object} windowState
 * @param {Object} frameProps
 * @param {String} propName
 * @return {Object} the path of the propName in windowState
 */
export function getFramePropPath (windowState, frameProps, propName) {
  return ['frames', getFramePropsIndex(windowState.get('frames'), frameProps), propName]
}

/**
 * Obtains the index for the specified frame key
 */
export function findIndexForFrameKey (frames, key) {
  return frames.findIndex(frame => frame.get('key') === key)
}

/**
 * Obtains the frameProps index in the frames
 */
export function getFramePropsIndex (frames, frameProps) {
  return frames.findIndex(found => found.get('key') === frameProps.get('key'))
}

/**
 * Converts a feature string into an object.
 * @param {String} featureStr A string like, arg=val,arg2=val2
 */
export function getFeatures (featureStr) {
  return String(featureStr)
    .split(',')
    .reduce((acc, feature) => {
      feature = feature
        .split('=')
        .map(featureElem => featureElem.trim())
      if (feature.length !== 2) {
        return acc
      }

      acc[decodeURIComponent(feature[0])] = decodeURIComponent(feature[1])
      return acc
    }, {})
}

/**
 * Determines if the specified frame was opened from the specified
 * ancestorFrameKey.
 *
 * For example you may go to google.com and open 3 links in new tabs:
 * G g1 g2 g3
 * Then you may change to g1 and open another tab:
 * G g1 g1.1 g2 g3
 * But then you may go back to google.com and open another tab.
 * It should go like so:
 * G g1 g1.1 g2 g3 g4
 */
function isAncestorFrameKey (frames, frame, parentFrameKey) {
  if (!frame || !frame.get('parentFrameKey')) {
    return false
  }

  if (frame.get('parentFrameKey') === parentFrameKey) {
    return true
  }

  // So there is a parentFrameKey but it isn't the specified one.
  // Check recursively for each of the parentFrame's ancestors to see
  // if we have a match.
  const parentFrameIndex = findIndexForFrameKey(frames, frame.get('parentFrameKey'))
  const parentFrame = frames.get(parentFrameIndex)
  if (parentFrameIndex === -1 || !parentFrame.get('parentFrameKey')) {
    return false
  }
  return isAncestorFrameKey(frames, parentFrame, parentFrameKey)
}

/**
 * Adds a frame specified by frameOpts and newKey and sets the activeFrameKey
 * @return Immutable top level application state ready to merge back in
 */
export function addFrame (frames, frameOpts, newKey, partitionNumber, activeFrameKey) {
  const url = frameOpts.location || config.defaultUrl
  const navbarFocus = activeFrameKey === newKey &&
                      url === config.defaultUrl &&
                      frameOpts.delayedLoadUrl === undefined
  const frame = Immutable.fromJS({
    zoomLevel: config.zoom.defaultValue,
    audioMuted: false, // frame is muted
    canGoBack: false,
    canGoForward: false,
    location: frameOpts.delayedLoadUrl || url, // page url
    src: url, // what the iframe src should be
    // if this is a delayed load then go ahead and start the loading indicator
    loading: !!frameOpts.delayedLoadUrl,
    startLoadTime: frameOpts.delayedLoadUrl ? new Date().getTime() : null,
    endLoadTime: null,
    isPrivate: frameOpts.isPrivate || false,
    partitionNumber,
    element: frameOpts.element,
    features: getFeatures(frameOpts.features),
    pinnedLocation: frameOpts.isPinned ? url : undefined,
    key: newKey,
    parentFrameKey: frameOpts.parentFrameKey,
    guestInstanceId: frameOpts.guestInstanceId,
    navbar: {
      searchSuggestions: true,
      focused: navbarFocus,
      urlbar: {
        location: frameOpts.delayedLoadUrl || url,
        urlPreview: '',
        suggestions: {
          selectedIndex: 0,
          searchResults: [],
          suggestionList: null
        },
        selected: navbarFocus,
        focused: navbarFocus,
        active: false
      }
    },
    searchDetail: null,
    findDetail: {
      searchString: '',
      caseSensitivity: false
    },
    security: {
      isSecure: urlParse(url).protocol === 'https:',
      certDetails: null
    }
  })

  // Find the closest index to the current frame's index which has
  // a different ancestor frame key.
  let insertionIndex = findIndexForFrameKey(frames, frameOpts.parentFrameKey)
  if (insertionIndex === -1) {
    insertionIndex = frames.size
  }
  while (insertionIndex < frames.size) {
    ++insertionIndex
    if (!isAncestorFrameKey(frames, frames.get(insertionIndex), frameOpts.parentFrameKey)) {
      break
    }
  }

  return {
    frames: frames.splice(insertionIndex, 0, frame),
    activeFrameKey
  }
}

/**
 * Undoes a frame close and inserts it at the last index
 * @return Immutable top level application state ready to merge back in
 */
export function undoCloseFrame (windowState, closedFrames) {
  if (closedFrames.size === 0) {
    return {}
  }
  const closedFrame = closedFrames.last()
  const insertIndex = closedFrame.get('closedAtIndex')
  return {
    closedFrames: closedFrames.pop(),
    frames: windowState.get('frames').splice(insertIndex, 0,
          closedFrame
          .delete('guestInstanceId')
          .set('src', closedFrame.get('location'))),
    activeFrameKey: closedFrame.get('key')
  }
}

/**
 * Removes a frame specified by frameProps
 * @return Immutable top level application state ready to merge back in
 */
export function removeFrame (frames, closedFrames, frameProps, activeFrameKey) {
  if (!frameProps.get('isPrivate')) {
    frameProps = frameProps.set('isFullScreen', false)
    closedFrames = closedFrames.push(frameProps)
    if (frameProps.get('thumbnailBlob')) {
      window.URL.revokeObjectURL(frameProps.get('thumbnailBlob'))
    }
    if (closedFrames.size > config.maxClosedFrames) {
      closedFrames = closedFrames.shift()
    }
  }
  let activeFrameIndex = findIndexForFrameKey(frames, frameProps.get('parentFrameKey'))
  if (activeFrameIndex === -1) {
    activeFrameIndex = findIndexForFrameKey(frames, activeFrameKey)
  }
  const framePropsIndex = getFramePropsIndex(frames, frameProps)
  frames = frames.splice(framePropsIndex, 1)
  const newActiveFrameKey = frameProps.get('key') === activeFrameKey && frames.size > 0
    ? Math.max(
      frames.get(activeFrameIndex)
      // Go to the next frame if it exists.
      ? frames.get(activeFrameIndex).get('key')
      // Otherwise go to the frame right before the active tab.
      : frames.get(activeFrameIndex - 1).get('key'),
    0) : activeFrameKey
  return {
    previewFrameKey: null,
    activeFrameKey: newActiveFrameKey,
    closedFrames,
    frames
  }
}

/**
 * Removes all but the specified frameProps
 * @return Immutable top level application state ready to merge back in
 */
export function removeOtherFrames (frames, closedFrames, frameProps) {
  closedFrames = closedFrames.concat(frames.filter(currentFrameProps => !currentFrameProps.get('isPrivate') && currentFrameProps.get('key') !== frameProps.get('key')))
    .take(config.maxClosedFrames)
  closedFrames.forEach(currentFrameProps => {
    if (currentFrameProps.get('thumbnailBlob')) {
      window.URL.revokeObjectURL(currentFrameProps.get('thumbnailBlob'))
    }
  })

  frames = Immutable.fromJS([frameProps])
  return {
    activeFrameKey: frameProps.get('key'),
    closedFrames,
    frames
  }
}

export function getFrameTabPageIndex (frames, frameProps, tabsPerTabPage) {
  const index = getFramePropsIndex(frames, frameProps)
  if (index === -1) {
    return -1
  }
  return Math.floor(index / tabsPerTabPage)
}
