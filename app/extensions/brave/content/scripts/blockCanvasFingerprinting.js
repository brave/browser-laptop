/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Some parts of this file are derived from:
 * Chameleon <https://github.com/ghostwords/chameleon>, Copyright (C) 2015 ghostwords
 * Privacy Badger Chrome <https://github.com/EFForg/privacybadger>, Copyright (C) 2015 Electronic Frontier Foundation and other contributors
 */
Error.stackTraceLimit = Infinity // collect all frames

// https://code.google.com/p/v8-wiki/wiki/JavaScriptStackTraceApi
/**
 * Customize the stack trace
 * @param structured If true, change to customized version
 * @returns {*} Returns the stack trace
 */
function getStackTrace (structured) {
  var errObj = {}
  var origFormatter
  var stack

  if (structured) {
    origFormatter = Error.prepareStackTrace
    Error.prepareStackTrace = function (errObj, structuredStackTrace) {
      return structuredStackTrace
    }
  }

  Error.captureStackTrace(errObj, getStackTrace)
  stack = errObj.stack

  if (structured) {
    Error.prepareStackTrace = origFormatter
  }

  return stack
}

/**
 * Checks the stack trace for the originating URL
 * @returns {String} The URL of the originating script (URL:Line number:Column number)
 */
function getOriginatingScriptUrl () {
  var trace = getStackTrace(true)

  if (trace.length < 3) {
    return ''
  }

  // this script is at 0 and 1
  var callSite = trace[2]

  if (callSite.isEval()) {
    // argh, getEvalOrigin returns a string ...
    var eval_origin = callSite.getEvalOrigin()
    var script_url_matches = eval_origin.match(/\((http.*:\d+:\d+)/)

    return script_url_matches && script_url_matches[1] || eval_origin
  } else {
    return callSite.getFileName() + ':' + callSite.getLineNumber() + ':' + callSite.getColumnNumber()
  }
}

/**
 *  Strip away the line and column number (from stack trace urls)
 * @param script_url The stack trace url to strip
 * @returns {String} the pure URL
 */
function stripLineAndColumnNumbers (script_url) {
  return script_url.replace(/:\d+:\d+$/, '')
}

// To avoid throwing hard errors on code that expects a fingerprinting feature
// to be in place, create a method that can be called as if it were most
// other types of objects (ie can be called like a function, can be indexed
// into like an array, can have properties looked up, etc).
//
// This is done in two steps.  First, create a default, no-op function
// (`defaultFunc` below), and then second, wrap it in a Proxy that traps
// on all these operations, and yields itself.  This allows for long
// chains of no-op operations like
//    AnalyserNode.prototype.getFloatFrequencyData().bort.alsoBort,
// even though AnalyserNode.prototype.getFloatFrequencyData has been replaced.
var defaultFunc = function () {}

// In order to avoid deeply borking things, we need to make sure we don't
// prevent access to builtin object properties and functions (things
// like (Object.prototype.constructor).  So, build a list of those below,
// and then special case those in the allPurposeProxy object's traps.
var funcPropNames = Object.getOwnPropertyNames(defaultFunc)
var unconfigurablePropNames = funcPropNames.filter(function (propName) {
  var possiblePropDesc = Object.getOwnPropertyDescriptor(defaultFunc, propName)
  return (possiblePropDesc && !possiblePropDesc.configurable)
})

var valueOfCoercionFunc = function (hint) {
  if (hint === 'string') {
    return ''
  }
  if (hint === 'number' || hint === 'default') {
    return 0
  }
  return undefined
}

var allPurposeProxy = new Proxy(defaultFunc, {
  get: function (target, property) {

    if (property === Symbol.toPrimitive) {
      return valueOfCoercionFunc
    }

    if (property === 'toString') {
      return ''
    }

    if (property === 'valueOf') {
      return 0
    }

    return allPurposeProxy
  },
  set: function () {
    return allPurposeProxy
  },
  apply: function () {
    return allPurposeProxy
  },
  ownKeys: function () {
    return unconfigurablePropNames
  },
  has: function (target, property) {
    return (unconfigurablePropNames.indexOf(property) > -1)
  },
  getOwnPropertyDescriptor: function (target, property) {
    if (unconfigurablePropNames.indexOf(property) === -1) {
      return undefined
    }
    return Object.getOwnPropertyDescriptor(defaultFunc, property)
  }
})

function reportBlock (type) {
  var script_url = getOriginatingScriptUrl() || window.location.href
  var msg = {
    type,
    scriptUrl: stripLineAndColumnNumbers(script_url)
  }

  // Block the read from occuring; send info to background page instead
  chrome.ipcRenderer.sendToHost('got-canvas-fingerprinting', msg)

  return allPurposeProxy
}

/**
 * Monitor the reads from a canvas instance
 * @param item special item objects
 */
function trapInstanceMethod (item) {
  if (!item.methodName) {
    chrome.webFrame.setGlobal(item.objName + ".prototype." + item.propName, reportBlock.bind(null, item.type))
  } else {
    chrome.webFrame.setGlobal(item.methodName, reportBlock.bind(null, item.type))
  }
}

function blockWebRTC () {
  const methods = []
  // Based on https://github.com/webrtcHacks/webrtcnotify
  const webrtcMethods = ['createOffer', 'createAnswer', 'setLocalDescription', 'setRemoteDescription']
  webrtcMethods.forEach(function (method) {
    const item = {
      type: 'WebRTC',
      objName: 'webkitRTCPeerConnection',
      propName: method
    }
    methods.push(item)
  })
  methods.forEach(trapInstanceMethod)

  // Block WebRTC device enumeration
  trapInstanceMethod({
    type: 'WebRTC',
    methodName: 'navigator.mediaDevices.enumerateDevices'
  })
}

if (chrome.contentSettings.canvasFingerprinting == 'block') {
  var methods = []
  var canvasMethods = ['getImageData', 'getLineDash', 'measureText', 'isPointInPath']
  canvasMethods.forEach(function (method) {
    var item = {
      type: 'Canvas',
      objName: 'CanvasRenderingContext2D',
      propName: method
    }

    methods.push(item)
  })

  var canvasElementMethods = ['toDataURL', 'toBlob']
  canvasElementMethods.forEach(function (method) {
    var item = {
      type: 'Canvas',
      objName: 'HTMLCanvasElement',
      propName: method
    }
    methods.push(item)
  })

  var webglMethods = ['getSupportedExtensions', 'getParameter', 'getContextAttributes',
    'getShaderPrecisionFormat', 'getExtension', 'readPixels', 'getUniformLocation',
    'getAttribLocation']
  webglMethods.forEach(function (method) {
    var item = {
      type: 'WebGL',
      objName: 'WebGLRenderingContext',
      propName: method
    }
    methods.push(item)
    methods.push(Object.assign({}, item, {objName: 'WebGL2RenderingContext'}))
  })

  var audioBufferMethods = ['copyFromChannel', 'getChannelData']
  audioBufferMethods.forEach(function (method) {
    var item = {
      type: 'AudioContext',
      objName: 'AudioBuffer',
      propName: method
    }
    methods.push(item)
  })

  var analyserMethods = ['getFloatFrequencyData', 'getByteFrequencyData',
    'getFloatTimeDomainData', 'getByteTimeDomainData']
  analyserMethods.forEach(function (method) {
    var item = {
      type: 'AudioContext',
      objName: 'AnalyserNode',
      propName: method
    }
    methods.push(item)
  })

  var svgPathMethods = ['getTotalLength']
  svgPathMethods.forEach(function (method) {
    var item = {
      type: 'SVG',
      objName: 'SVGPathElement',
      propName: method
    }
    methods.push(item)
  })

  var svgTextContentMethods = ['getComputedTextLength']
  svgTextContentMethods.forEach(function (method) {
    var item = {
      type: 'SVG',
      objName: 'SVGTextContentElement',
      propName: method
    }
    methods.push(item)
  })
  methods.forEach(trapInstanceMethod)
  blockWebRTC()
}

if (isTorTab()) {
  blockWebRTC()
}
