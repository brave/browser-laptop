/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Some parts of this file are derived from:
 * Chameleon <https://github.com/ghostwords/chameleon>, Copyright (C) 2015 ghostwords
 * Privacy Badger Chrome <https://github.com/EFForg/privacybadger>, Copyright (C) 2015 Electronic Frontier Foundation and other contributors
 */

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

    if (trace.length < 4) {
      return ''
    }

    // This script is at positions 0 (this function), 1 (the reportBlock
    // function) and 2 (the newGlobalFunction function).  Index 3 and beyond
    // are on the client page.
    var callSite = trace[3]

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

  /**
   * Returns a false-y default value, depending on how a proxy is being coerced.
   *
   * @param {String} hint
   *   A string, describing the type of coercion being applied to the proxy.
   *   Expected values are "string", "number" or "default".
   *
   * @return {String|Number|undefined}
   *   A falsey value, determined by the type of coercion being applied.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive
   */
  var valueOfCoercionFunc = function (hint) {
    if (hint === 'string') {
      return ''
    }
    if (hint === 'number' || hint === 'default') {
      return 0
    }
    return undefined
  }

  // This object is used to map from names of blocking proxy objects,
  // to the proxy object itself.  Its used to allow the handler of each
  // proxy to refer to the proxy before the proxy is created (since the
  // handler is needed to create the proxy, there would otherwise be a
  // chicken and egg situation).
  var proxyRegistery = {}

  /**
   * Returns a handler object, for use in configuring a Proxy object.
   *
   * The returned handler will return a named proxy on get, set and apply
   * operations up to `loopGuardMax` times (1000), and then returns undefined
   * to avoid infinite loops.
   *
   * @param {String} proxyName
   *   The name of the proxy ("registered" in the above "proxyRegistery"
   *   object) to return when the proxy object is {get,set,apply}'ed.
   * @param {?Function(String)} onTriggerCallback
   *   An optional callback funciton that will be called whenever the
   *   proxy object is get,'ed.  This callback is called with
   *   a single argument, the name of the property being looked up.
   *
   * @return {Object}
   *   A valid Proxy handler definition.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler
   */
  var createProxyHandler = function (proxyName, onTriggerCallback) {

    var loopGuardMax = 1000
    var callCounter = 0

    return {
      get: function (target, property) {

        if (onTriggerCallback !== undefined) {
          onTriggerCallback(property)
        }

        // If the proxy has been called a large number of times on this page,
        // it might be stuck in an loop.  To prevent locking up the page,
        // return undefined to break the loop, and then resume the normal
        // behavior on subsequent calls.
        if (callCounter > loopGuardMax) {
          callCounter = 0
          return undefined
        }

        callCounter += 1

        if (property === Symbol.toPrimitive) {
          return valueOfCoercionFunc
        }

        if (property === 'toString') {
          return ''
        }

        if (property === 'valueOf') {
          return 0
        }

        return proxyRegistery[proxyName]
      },
      set: function () {
        return proxyRegistery[proxyName]
      },
      apply: function () {
        return proxyRegistery[proxyName]
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
    }
  }

  var mainFrameBlockingProxy = new Proxy(defaultFunc, createProxyHandler("mainFrameBlockingProxy"))
  proxyRegistery["mainFrameBlockingProxy"] = mainFrameBlockingProxy

  /**
   * Reports that a method related to fingerprinting was called by the page.
   *
   * @param {String} type
   *   A category of the fingerprinting method, such as "SVG", "iFrame" or
   *   "Canvas".
   * @param {?String} scriptUrlToReport
   *   Optional URL to report where the fingerprinting effort happened.
   *   If this is undefined, then the script URL is determined from
   *   a stack trace.
   */
  function reportBlock (type, scriptUrlToReport) {

    var scriptUrl

    if (scriptUrlToReport !== undefined) {
      scriptUrl = scriptUrlToReport
    } else {
      scriptUrl = getOriginatingScriptUrl()
      if (scriptUrl) {
        scriptUrl = stripLineAndColumnNumbers(scriptUrl)
      } else {
        scriptUrl = window.location.href
      }
    }

    var msg = {
      type,
      scriptUrl: stripLineAndColumnNumbers(scriptUrl)
    }

    // Block the read from occuring; send info to background page instead
    chrome.ipcRenderer.sendToHost('got-canvas-fingerprinting', msg)
  }

  /**
   * Replaces global method with one that reports the fingerprinting attempt.
   *
   * @param {Object} item
   *   A definition for the method that should be replaced.
   * @param {String} item.type
   *   A category for the type of fingerprinting method being blocked, such
   *   as "SVG" or "Canvas"
   * @param {?String} item.propName
   *   The name of the property / method to be modified.  If provided,
   *   item.objName must also be provided.
   * @param {?String} item.objName
   *   The name of the global structure to modfiy.  If this is provided,
   *   then the item.propName on the prototype of this object will be modified.
   * @param {?String} item.methodName
   *   A global, singleton method to overwrite.  If this is provided,
   *   then item.propName and item.objName are ignored.
   */
  function trapInstanceMethod (item) {

    var newGlobalFunction = function () {
      reportBlock(item.type)
      return mainFrameBlockingProxy
    }

    if (!item.methodName) {
      chrome.webFrame.setGlobal(item.objName + ".prototype." + item.propName, newGlobalFunction)
    } else {
      chrome.webFrame.setGlobal(item.methodName, newGlobalFunction)
    }
  }

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

  var propertiesToReportInIframe = new Set(canvasMethods
    .concat(canvasElementMethods)
    .concat(webglMethods)
    .concat(audioBufferMethods)
    .concat(analyserMethods)
    .concat(svgPathMethods)
    .concat(svgTextContentMethods)
    .concat(webrtcMethods)
    .concat(['enumerateDevices']))

  // Boolean guard used to make sure we don't report more than one iframe
  // fingerprinting attempt per page.
  var hasiFrameReported = false

  /**
   * Callback function called when the iframe proxy receives a "get".
   *
   * This callback is used to report fingerprinting attempts using methods
   * extracted from an iframe.
   *
   * @param {String} property
   *   The name of the propery being "get" in the iframe proxy.
   *
   * @return {Boolean}
   *   true if a fingerprinting attempt was reported, otherwise false
   */
  var onIframeProxyCalled = function (property) {

    if (hasiFrameReported === true) {
      return false
    }

    if (propertiesToReportInIframe.has(property) === false) {
      return false
    }

    hasiFrameReported = true
    reportBlock("Iframe", window.location.href)
    return true
  }

  var iframeBlockingProxy = new Proxy(defaultFunc, createProxyHandler("iframeBlockingProxy", onIframeProxyCalled))
  proxyRegistery["iframeBlockingProxy"] = iframeBlockingProxy

  chrome.webFrame.setGlobal("window.__braveIframeProxy", iframeBlockingProxy)

  // Prevent access to frames' contentDocument / contentWindow
  // properties, to prevent the parent frame from pulling unblocked
  // references to blocked standards from injected frames.
  // This may break some sites, but, fingers crossed, its not too much.
  var pageScriptToInject = function () {
    var frameTypesToModify = [window.HTMLIFrameElement, window.HTMLFrameElement]
    var propertiesToModify = ['contentWindow', 'contentDocument']
    var braveIframeProxy = window.__braveIframeProxy
    delete window.__braveIframeProxy

    frameTypesToModify.forEach(function (frameType) {
      propertiesToModify.forEach(function (propertyToModify) {
        Object.defineProperty(frameType.prototype, propertyToModify, {
          get: () => {
            // XXX: this breaks contentWindow.postMessage since the target window
            // is now the parent window
            return braveIframeProxy
          }
        })
      })
    })
  }

  chrome.webFrame.executeJavaScript(`(${pageScriptToInject.toString()})()`)
}
