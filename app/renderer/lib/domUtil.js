/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const styleValues = require('../../common/constants/styleValues')

const createWebView = () => {
  return document.createElement('webview')
}

const appendChild = (element, child) => {
  element.appendChild(child)
}

const getStyleConstants = (prop) => {
  return styleValues[prop]
}

/**
 * Find the X, Y coords of an element relative to its offset parent,
 * i.e. not including transforms
 * @param {HTMLElement} element
 * @returns { x: number, y: number }
 */
function getNodeOffsetPosition (element) {
  return {
    x: element.offsetLeft,
    y: element.offsetTop
  }
}

/**
 * Sets an element to be absolute-positioned so that it does not affect its parent's size,
 * but still occupies the same position, size and margin as before
 */
function removeNodeFromDOMFlow (domNode, bottomAligned = false) {
  // For this to work, we have to offset any given `margin`.
  const computed = window.getComputedStyle(domNode)
  const marginAttrs = ['margin-top', 'margin-left', 'margin-right']
  const margins = marginAttrs.reduce((acc, margin) => {
    const propertyVal = computed.getPropertyValue(margin)
    return Object.assign({}, acc, {
      // Number(String.replace) more efficient than parseFloat?
      [margin]: Number(propertyVal.replace('px', ''))
    })
  }, {})

  // If we're bottom-aligned, we need to add the height of the child to its
  // top offset. This is because, when the container is bottom-aligned, its
  // height shrinks from the top, not the bottom. We're removing this node
  // from the flow, so the top is going to drop by its height.
  const topOffset =
    bottomAligned
      ? domNode.offsetTop - domNode.offsetHeight
      : domNode.offsetTop

  const styles = {
    position: 'absolute',
    top: `${topOffset - margins['margin-top']}px`,
    left: `${domNode.offsetLeft - margins['margin-left']}px`,
    width: `${domNode.offsetWidth}px`
  }
  for (const key of Object.keys(styles)) {
    domNode.style.setProperty(key, styles[key])
  }
}

module.exports = {
  createWebView,
  appendChild,
  getStyleConstants,
  getNodeOffsetPosition,
  removeNodeFromDOMFlow
}
