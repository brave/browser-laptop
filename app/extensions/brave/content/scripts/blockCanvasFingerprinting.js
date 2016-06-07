/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

let canvasFingerprintingInitialized = false
function blockCanvasFingerprinting () {
  if (canvasFingerprintingInitialized) {
    return
  } else {
    canvasFingerprintingInitialized = true
  }

  /**
   * @return {string}
   */
  function getBlockFpPageScript () {
    return '(' + Function.prototype.toString.call(function (ERROR) {
      ERROR.stackTraceLimit = Infinity // collect all frames
      var event_id = document.currentScript ? document.currentScript.getAttribute('data-event-id') : ''

      // from Underscore v1.6.0
      function debounce (func, wait, immediate) {
        var timeout, args, context, timestamp, result

        var later = function () {
          var last = Date.now() - timestamp
          if (last < wait) {
            timeout = setTimeout(later, wait - last)
          } else {
            timeout = null
            if (!immediate) {
              result = func.apply(context, args)
              context = args = null
            }
          }
        }

        return function () {
          context = this
          args = arguments
          timestamp = Date.now()
          var callNow = immediate && !timeout
          if (!timeout) {
            timeout = setTimeout(later, wait)
          }
          if (callNow) {
            result = func.apply(context, args)
            context = args = null
          }
          return result
        }
      }

      // messages the injected script
      var send = (function () {
        var messages = []
        // debounce sending queued messages
        var _send = debounce(function () {
          document.dispatchEvent(new window.CustomEvent(event_id, {
            detail: messages
          }))
          // clear the queue
          messages = []
        }, 100)
        return function (msg) {
          // queue the message
          messages.push(msg)
          _send()
        }
      }())

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
          origFormatter = ERROR.prepareStackTrace
          ERROR.prepareStackTrace = function (errObj, structuredStackTrace) {
            return structuredStackTrace
          }
        }

        ERROR.captureStackTrace(errObj, getStackTrace)
        stack = errObj.stack

        if (structured) {
          ERROR.prepareStackTrace = origFormatter
        }

        return stack
      }

      /**
       * Checks the stack trace for the originating URL
       * @returns {String} The URL of the originating script (URL:Line number:Column number)
       */
      function getOriginatingScriptUrl () {
        var trace = getStackTrace(true)

        if (trace.length < 2) {
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

      function reportBlock (item) {
        var script_url = getOriginatingScriptUrl()
        var msg = {
          type: item.type,
          obj: item.objName,
          prop: item.propName,
          url: window.location.href,
          scriptUrl: stripLineAndColumnNumbers(script_url)
        }

        // Block the read from occuring; send info to background page instead
        send(msg)
      }

      /**
       * Monitor the reads from a canvas instance
       * @param item special item objects
       */
      function trapInstanceMethod (item) {
        item.obj[item.propName] = reportBlock.bind(this, item)
      }

      /**
       * Stubs iframe methods that can be used for canvas fingerprinting.
       * @param {HTMLIFrameElement} frame
       */
      function trapIFrameMethods (frame) {
        var items = [{
          type: 'Canvas',
          objName: 'contentDocument',
          propName: 'createElement',
          obj: frame.contentDocument
        }, {
          type: 'Canvas',
          objName: 'contentDocument',
          propName: 'createElementNS',
          obj: frame.contentDocument
        }]
        items.forEach(function (item) {
          var orig = item.obj[item.propName]
          item.obj[item.propName] = function () {
            var args = arguments
            var lastArg = args[args.length - 1]
            if (lastArg && lastArg.toLowerCase() === 'canvas') {
              // Prevent fingerprinting using contentDocument.createElement('canvas'),
              // which evades trapInstanceMethod when the iframe is sandboxed
              reportBlock(item)
            } else {
              // Otherwise apply the original method
              return orig.apply(this, args)
            }
          }
        })
      }

      var methods = []
      var canvasMethods = ['getImageData', 'getLineDash', 'measureText']
      canvasMethods.forEach(function (method) {
        var item = {
          type: 'Canvas',
          objName: 'CanvasRenderingContext2D.prototype',
          propName: method,
          obj: window.CanvasRenderingContext2D.prototype
        }

        methods.push(item)
      })

      var canvasElementMethods = ['toDataURL', 'toBlob']
      canvasElementMethods.forEach(function (method) {
        var item = {
          type: 'Canvas',
          objName: 'HTMLCanvasElement.prototype',
          propName: method,
          obj: window.HTMLCanvasElement.prototype
        }
        methods.push(item)
      })

      var webglMethods = ['getSupportedExtensions', 'getParameter', 'getContextAttributes',
        'getShaderPrecisionFormat', 'getExtension']
      webglMethods.forEach(function (method) {
        var item = {
          type: 'WebGL',
          objName: 'WebGLRenderingContext.prototype',
          propName: method,
          obj: window.WebGLRenderingContext.prototype
        }
        methods.push(item)
      })

      var audioBufferMethods = ['copyFromChannel', 'getChannelData']
      audioBufferMethods.forEach(function (method) {
        var item = {
          type: 'AudioContext',
          objName: 'AudioBuffer.prototype',
          propName: method,
          obj: window.AudioBuffer.prototype
        }
        methods.push(item)
      })

      var analyserMethods = ['getFloatFrequencyData', 'getByteFrequencyData',
        'getFloatTimeDomainData', 'getByteTimeDomainData']
      analyserMethods.forEach(function (method) {
        var item = {
          type: 'AudioContext',
          objName: 'AnalyserNode.prototype',
          propName: method,
          obj: window.AnalyserNode.prototype
        }
        methods.push(item)
      })

      methods.forEach(trapInstanceMethod)
      Array.from(document.querySelectorAll('iframe')).forEach(trapIFrameMethods)

    // save locally to keep from getting overwritten by site code
    }) + '(Error));'
  }

  var event_id = Math.random().toString()

  // listen for messages from the script we are about to insert
  document.addEventListener(event_id, function (e) {
    if (!e.detail) {
      return
    }
    // pass these on to the background page
    chrome.ipc.send('got-canvas-fingerprinting', e.detail)
  })

  insertScript(getBlockFpPageScript(), {
    event_id: event_id
  })
}
