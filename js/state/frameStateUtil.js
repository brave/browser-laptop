/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const config = require('../constants/config.js')
const urlParse = require('url').parse

const matchFrame = (queryInfo, frame) => {
  queryInfo = queryInfo.toJS ? queryInfo.toJS() : queryInfo
  return !Object.keys(queryInfo).map((queryKey) => (frame.get(queryKey) === queryInfo[queryKey])).includes(false)
}

function query (windowState, queryInfo) {
  return windowState.get('frames').filter(matchFrame.bind(null, queryInfo))
}

function find (windowState, queryInfo) {
  return windowState.get('frames').find(matchFrame.bind(null, queryInfo))
}

function isFrameKeyActive (windowState, frameKey) {
  return windowState.get('activeFrameKey') === frameKey
}

function getFrameDisplayIndex (windowState, frame) {
  return findDisplayIndexForFrameKey(windowState.get('frames'), frame)
}

function getFrameIndex (windowState, frame) {
  return findIndexForFrameKey(windowState.get('frames'), frame)
}

function getActiveFrameDisplayIndex (windowState) {
  return getFrameDisplayIndex(windowState, windowState.get('activeFrameKey'))
}

function getActiveFrameIndex (windowState) {
  return getFrameIndex(windowState, windowState.get('activeFrameKey'))
}

function getFrameByIndex (windowState, i) {
  return windowState.getIn(['frames', i])
}

function getFrameKeysByDisplayIndex (frames) {
  let framesByDisplayIndex = [[], []]
  frames.forEach((frame) => {
    let key = frame.get('key')
    if (frame.get('pinnedLocation')) {
      framesByDisplayIndex[0].push(key)
    } else {
      framesByDisplayIndex[1].push(key)
    }
  })
  return framesByDisplayIndex.reduce(function (a, b) {
    return a.concat(b)
  }, [])
}

function getFrameByDisplayIndex (windowState, i) {
  let frames = getFrameKeysByDisplayIndex(windowState.get('frames'))
  let key = frames[i]
  return getFrameByKey(windowState, key)
}

function getFrameByKey (windowState, key) {
  return find(windowState, {key})
}

function getFrameByTabId (windowState, tabId) {
  return find(windowState, {tabId})
}

function getActiveFrame (windowState) {
  const activeFrameIndex = getActiveFrameIndex(windowState)
  return windowState.get('frames').get(activeFrameIndex)
}

function setActiveFrameDisplayIndex (windowState, i) {
  const frame = getFrameByDisplayIndex(windowState, i)
  if (!frame) {
    return windowState
  }

  return setActiveFrameKey(windowState, frame.get('key'))
}

function setActiveFrameIndex (windowState, i) {
  const frame = getFrameByIndex(windowState, i)
  if (!frame) {
    return windowState
  }

  return setActiveFrameKey(windowState, frame.get('key'))
}

function setActiveFrameKey (windowState, activeFrameKey) {
  return windowState.merge({
    activeFrameKey: activeFrameKey,
    previewFrameKey: null
  })
}

function makeNextFrameActive (windowState) {
  const activeFrameIndex = getActiveFrameDisplayIndex(windowState)
  return setActiveFrameDisplayIndex(windowState, (activeFrameIndex + 1) % windowState.get('frames').size)
}

function makePrevFrameActive (windowState) {
  const activeFrameIndex = getActiveFrameDisplayIndex(windowState)
  return setActiveFrameDisplayIndex(windowState, (windowState.get('frames').size + activeFrameIndex - 1) % windowState.get('frames').size)
}

/**
 * @param {Object} windowState
 * @param {Object} frameProps
 * @param {String} propName
 * @return {Object} the value of the propName associated with frameProps
 */
function getFramePropValue (windowState, frameProps, propName) {
  return windowState.getIn(getFramePropPath(windowState, frameProps, propName))
}

/**
 * @param {Object} windowState
 * @param {Object} frameProps
 * @param {String} propName
 * @return {Object} the path of the propName in windowState
 */
function getFramePropPath (windowState, frameProps, propName) {
  return ['frames', getFramePropsIndex(windowState.get('frames'), frameProps), propName]
}

/**
 * Obtains the index for the specified frame key
 */
function findIndexForFrameKey (frames, key) {
  return frames.findIndex(matchFrame.bind(null, {key}))
}

/**
 * Obtains the display index for the specified frame key
 */
function findDisplayIndexForFrameKey (frames, key) {
  return getFrameKeysByDisplayIndex(frames).findIndex((displayKey) => displayKey === key)
}

/**
 * Obtains the frameProps index in the frames
 */
function getFramePropsIndex (frames, frameProps) {
  let queryInfo = frameProps.toJS ? frameProps.toJS() : frameProps
  if (queryInfo.tabId) {
    queryInfo = {
      tabId: queryInfo.tabId
    }
  }
  if (queryInfo.key) {
    queryInfo = {
      key: queryInfo.key
    }
  }
  return frames.findIndex(matchFrame.bind(null, queryInfo))
}

/**
 * Converts a feature string into an object.
 * @param {String} featureStr A string like, arg=val,arg2=val2
 */
function getFeatures (featureStr) {
  return String(featureStr)
    .split(',')
    .reduce((acc, feature) => {
      feature = feature
        .split('=')
        .map((featureElem) => featureElem.trim())
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

function getPartition (frameOpts) {
  let partition = 'persist:default'
  if (frameOpts.get('isPrivate')) {
    partition = 'default'
  } else if (frameOpts.get('partitionNumber')) {
    partition = `persist:partition-${frameOpts.get('partitionNumber')}`
  }
  return partition
}
/**
 * Adds a frame specified by frameOpts and newKey and sets the activeFrameKey
 * @return Immutable top level application state ready to merge back in
 */
function addFrame (frames, frameOpts, newKey, partitionNumber, activeFrameKey) {
  const url = frameOpts.location || config.defaultUrl
  const navbarFocus = activeFrameKey === newKey &&
                      url === config.defaultUrl &&
                      frameOpts.delayedLoadUrl === undefined
  const location = frameOpts.delayedLoadUrl || url // page url

  // Only add pin requests if it's not already added
  if (frameOpts.isPinned) {
    const alreadyPinnedFrameProps = frames.find((frame) =>
      frame.get('pinnedLocation') === location && frame.get('partitionNumber') === partitionNumber)
    if (alreadyPinnedFrameProps) {
      return {}
    }
  }

  const frame = Immutable.fromJS({
    zoomLevel: config.zoom.defaultValue,
    audioMuted: false, // frame is muted
    canGoBack: false,
    canGoForward: false,
    location,
    aboutDetails: undefined,
    src: url, // what the iframe src should be
    tabId: -1,
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
    },
    unloaded: frameOpts.unloaded,
    history: []
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
function undoCloseFrame (windowState, closedFrames) {
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
function removeFrame (frames, closedFrames, frameProps, activeFrameKey) {
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
function removeOtherFrames (frames, closedFrames, frameProps) {
  closedFrames = closedFrames.concat(frames.filter((currentFrameProps) => !currentFrameProps.get('isPrivate') && currentFrameProps.get('key') !== frameProps.get('key')))
    .take(config.maxClosedFrames)
  closedFrames.forEach((currentFrameProps) => {
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

function getFrameTabPageIndex (frames, frameProps, tabsPerTabPage) {
  const index = getFramePropsIndex(frames, frameProps)
  if (index === -1) {
    return -1
  }
  return Math.floor(index / tabsPerTabPage)
}

module.exports = {
  query,
  find,
  isFrameKeyActive,
  getFrameIndex,
  getFrameDisplayIndex,
  getActiveFrameIndex,
  getActiveFrameDisplayIndex,
  getFrameByIndex,
  getFrameByDisplayIndex,
  getFrameByKey,
  getFrameByTabId,
  getActiveFrame,
  setActiveFrameDisplayIndex,
  setActiveFrameIndex,
  setActiveFrameKey,
  makeNextFrameActive,
  makePrevFrameActive,
  getFramePropValue,
  getFramePropPath,
  findIndexForFrameKey,
  findDisplayIndexForFrameKey,
  getFramePropsIndex,
  getFrameKeysByDisplayIndex,
  getFeatures,
  getPartition,
  addFrame,
  undoCloseFrame,
  removeFrame,
  removeOtherFrames,
  getFrameTabPageIndex
}
