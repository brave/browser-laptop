/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global performance */

let nodeTimer
if (typeof performance === 'undefined') {
  nodeTimer = {
    now: function () {
      const NS_PER_SEC = 1e9
      const NS_PER_MS = 1e6
      const time = process.hrtime()
      const seconds = time[0]
      const nanoseconds = time[1] + (seconds * NS_PER_SEC)
      return nanoseconds / NS_PER_MS
    }
  }
}
const timer = nodeTimer || performance

const filterArgs = function (args) {
  const filteredArgs = []
  for (let i = 0; i < args.length; i++) {
    if (typeof args === 'object') {
      filteredArgs[i] = '[Filtered]'
    } else {
      filteredArgs[i] = args[i]
    }
  }
  return filteredArgs
}

exports.trace = (obj, ...args) => {
  let filter = filterArgs
  let metadata = {}
  for (let i = 0; i < args.length; i++) {
    if (typeof args[i] === 'function') {
      filter = args[i]
    } else if (typeof args[i] === 'object') {
      metadata = args[i]
    } else {
      console.warn('invalid argument for trace: ' + args[i])
    }
  }

  let handler = {
    get (target, propKey, receiver) {
      const propValue = target[propKey]
      if (typeof propValue !== 'function') {
        return propValue
      }
      return function (...fnArgs) {
        metadata.name = propKey
        muon.crashReporter.setJavascriptInfoCrashValue(JSON.stringify(metadata))
        let result, end, exception
        const start = timer.now()
        try {
          result = propValue.apply(this, fnArgs)
          end = timer.now()
          metadata.durationMS = Math.ceil(end - start)
        } catch (e) {
          metadata.args = filter(fnArgs)
          metadata.stack = e.stack != null ? e.stack : e.name + ': ' + e.message
          exception = e
        }
        muon.crashReporter.setJavascriptInfoCrashValue(JSON.stringify(metadata))
        if (exception) {
          muon.crashReporter.dumpWithoutCrashing()
          throw exception
        }
        return result
      }
    }
  }
  return new Proxy(obj, handler)
}
