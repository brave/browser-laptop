/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

if (chrome.contentSettings.canvasFingerprinting == 'block') {
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

  function reportBlock (type) {
    var script_url = getOriginatingScriptUrl()
    var msg = {
      type,
      scriptUrl: stripLineAndColumnNumbers(script_url)
    }

    // Block the read from occuring; send info to background page instead
    chrome.ipcRenderer.sendToHost('got-canvas-fingerprinting', msg)
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

  var methods = []
  var canvasMethods = ['getImageData', 'getLineDash', 'measureText']
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
    'getShaderPrecisionFormat', 'getExtension']
  webglMethods.forEach(function (method) {
    var item = {
      type: 'WebGL',
      objName: 'WebGLRenderingContext',
      propName: method
    }
    methods.push(item)
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

  // Based on https://github.com/webrtcHacks/webrtcnotify
  var webrtcMethods = ['createOffer', 'createAnswer', 'setLocalDescription', 'setRemoteDescription']
  webrtcMethods.forEach(function (method) {
    var item = {
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
