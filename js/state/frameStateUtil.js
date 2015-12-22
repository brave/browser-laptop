/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import Immutable from 'immutable'
import Config from '../constants/config.js'

export function isFrameKeyActive (appState, frameKey) {
  return appState.get('activeFrameKey') === frameKey
}

export function getActiveFrameIndex (appState) {
  return findIndexForFrameKey(appState.get('frames'), appState.get('activeFrameKey'))
}

export function getFrameByIndex (appState, i) {
  return appState.getIn(['frames', i])
}

export function getFrameByKey (appState, key) {
  let i = findIndexForFrameKey(appState.get('frames'), key)
  return appState.getIn(['frames', i])
}

export function getActiveFrame (appState) {
  const activeFrameIndex = getActiveFrameIndex(appState)
  return appState.get('frames').get(activeFrameIndex)
}

export function setActiveFrameIndex (appState, i) {
  const frame = getFrameByIndex(appState, i)
  if (!frame) {
    return appState
  }

  return setActiveFrameKey(appState, frame.get('key'))
}

export function setActiveFrameKey (appState, activeFrameKey) {
  return appState.set('activeFrameKey', activeFrameKey)
}

export function makeNextFrameActive (appState) {
  const activeFrameIndex = getActiveFrameIndex(appState)
  return setActiveFrameIndex(appState, (activeFrameIndex + 1) % appState.get('frames').size)
}

export function makePrevFrameActive (appState) {
  const activeFrameIndex = getActiveFrameIndex(appState)
  return setActiveFrameIndex(appState, (appState.get('frames').size + activeFrameIndex - 1) % appState.get('frames').size)
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
  let parentFrameIndex = findIndexForFrameKey(frames, frame.get('parentFrameKey'))
  let parentFrame = frames.get(parentFrameIndex)
  if (parentFrameIndex === -1 || !parentFrame.get('parentFrameKey')) {
    return false
  }
  return isAncestorFrameKey(frames, parentFrame, parentFrameKey)
}

/**
 * Adds a frame specified by frameOpts and newKey and sets the activeFrameKey
 * @return Immutable top level application state ready to merge back in
 */
export function addFrame (frames, frameOpts, newKey, activeFrameKey) {
  var url = frameOpts.location || Config.defaultUrl
  let frame = Immutable.fromJS({
    audioMuted: false, // frame is muted
    canGoBack: false,
    canGoForward: false,
    location: url, // page url
    src: url, // what the iframe src should be
    isPrivate: frameOpts.isPrivate || false,
    element: frameOpts.element,
    features: getFeatures(frameOpts.features),
    key: newKey,
    parentFrameKey: frameOpts.parentFrameKey,
    navbar: {
      searchSuggestions: true,
      focused: true,
      urlbar: {
        location: url,
        urlPreview: '',
        suggestions: {
          selectedIndex: 0,
          searchResults: [],
          suggestionList: null
        },
        autoselected: true,
        focused: true,
        active: false
      }
    },
    searchDetail: null
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
export function undoCloseFrame (appState, closedFrames) {
  if (closedFrames.size === 0) {
    return {}
  }
  var closedFrame = closedFrames.last()
  let insertIndex = closedFrame.get('closedAtIndex')
  return {
    closedFrames: closedFrames.pop(),
    frames: appState.get('frames').splice(insertIndex, 0, closedFrame.remove('closedAtIndex')),
    activeFrameKey: closedFrame.get('key')
  }
}

/**
 * Removes a frame specified by frameProps
 * @return Immutable top level application state ready to merge back in
 */
export function removeFrame (frames, closedFrames, frameProps, activeFrameKey) {
  if (!frameProps.get('isPrivate')) {
    closedFrames = closedFrames.push(frameProps)
    if (frameProps.get('thumbnailBlob')) {
      window.URL.revokeObjectURL(frameProps.get('thumbnailBlob'))
    }
    if (closedFrames.size > Config.maxClosedFrames) {
      closedFrames = closedFrames.shift()
    }
  }
  const activeFrameIndex = findIndexForFrameKey(frames, activeFrameKey)
  const framePropsIndex = getFramePropsIndex(frames, frameProps)
  frames = frames.splice(framePropsIndex, 1)
  return {
    activeFrameKey: frameProps.get('key') === activeFrameKey && frames.size > 0
      ? Math.max(
        frames.get(activeFrameIndex)
          // Go to the next frame if it exists.
          ? frames.get(activeFrameIndex).get('key')
          // Otherwise go to the frame right before the active tab.
          : frames.get(activeFrameIndex - 1).get('key'),
        0) : activeFrameKey,
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
    .take(Config.maxClosedFrames)
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

/**
 * Extracts theme-color from a favicon using vibrant.js.
 */
export function computeThemeColor (frameProps) {
  return new Promise((resolve, reject) => {
    /*
    var icon = getFavicon(frameProps)

    var xhr = new window.XMLHttpRequest({
      mozAnon: true,
      mozSystem: true
    })

    xhr.open('GET', icon, true)
    xhr.responseType = 'blob'
    xhr.send()

    xhr.onload = function () {
      var status = xhr.status
      if (status !== 0 && status !== 200) {
        reject(
          new Error('Got HTTP status ' + status + ' trying to load ' + icon)
        )
        return
      }
      renderFromBlob(xhr.response)
    }

    xhr.onerror = xhr.ontimeout = function () {
      reject(new Error('Error while fetching icon: ', icon))
    }

    function renderFromBlob (blob) {
      var img = new window.Image()
      img.src = window.URL.createObjectURL(blob)

      img.onload = () => {
        var vibrant = new window.Vibrant(img)
        var swatches = vibrant.swatches()

        window.URL.revokeObjectURL(img.src)

        // Arbitrary selection ordering, which appears to give decent results.
        const swatchOrder = ['Muted', 'LightMuted', 'DarkMuted', 'DarkVibrant', 'Vibrant', 'LightVibrant']
        for (var i = 0; i < swatchOrder.length; i++) {
          var swatch = swatchOrder[i]
          if (swatches[swatch]) {
            resolve(swatches[swatch].getHex())
            break
          }
        }
      }
      img.onerror = () => {
        window.URL.revokeObjectURL(img.src)
        reject(new Error('Could not render image from blob.'))
      }
    }
  */
  })
}

export function getFrameTabPageIndex (frames, frameProps) {
  const index = getFramePropsIndex(frames, frameProps)
  if (index === -1) {
    return -1
  }
  return Math.floor(index / Config.tabs.tabsPerPage)
}
