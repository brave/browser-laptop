/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appConfig = require('../constants/appConfig')

let registeredCallbacks = []
let registeredSessions = {}
let registeredPrivateSessions = {}
const blockContentSetting = { setting: 'block', primaryPattern: '*' }

// TODO(bridiver) move this to electron so we can call a simpler api
const setUserPrefType = (ses, path, value) => {
  switch (typeof value) {
    case 'object':
      if (Array.isArray(value)) {
        ses.userPrefs.setListPref(path, value)
      } else {
        ses.userPrefs.setDictionaryPref(path, value)
      }
      break
    case 'string':
      ses.userPrefs.setStringPref(path, value)
      break
    case 'number':
      if ((/^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i).test(value.to_s())) {
        ses.userPrefs.setDoublePref(path, value)
      } else {
        ses.userPrefs.setIntegerPref(path, value)
      }
      break
    case 'boolean':
      ses.userPrefs.setBooleanPref(path, value)
      break
    default:
      console.warn(`Attempting to set an invalid preference value type for ${path}:`, value)
  }
}

const runCallback = (cb, incognito) => {
  let prefs = cb(incognito)

  if (typeof prefs !== 'object') {
    console.warn('userPrefs callback did not return an object:', prefs)
    return
  }

  for (let name in prefs) {
    module.exports.setUserPref(name, prefs[name], incognito)
  }

  return true
}

module.exports.setUserPref = (path, value, incognito = false) => {
  value = value.toJS ? value.toJS() : value

  const partitions = incognito ? registeredPrivateSessions : registeredSessions
  for (let partition in partitions) {
    let newValue = value
    if (partition === appConfig.tor.partition && path === 'content_settings' && value) {
      newValue = Object.assign({}, value, {
        flashEnabled: [blockContentSetting],
        flashAllowed: [blockContentSetting],
        torEnabled: [blockContentSetting], // currently only used for webrtc blocking
        plugins: [blockContentSetting]
      })
    }
    const ses = partitions[partition]
    setUserPrefType(ses, path, newValue)
    ses.webRequest.handleBehaviorChanged()
  }
}

module.exports.init = (ses, partition, isPrivate) => {
  if (isPrivate) {
    registeredPrivateSessions[partition] = ses
  }
  registeredSessions[partition] = ses
  registeredCallbacks.forEach((fn) => fn(isPrivate))
}

module.exports.registerUserPrefs = (cb) => {
  let fn = runCallback.bind(this, cb)
  registeredCallbacks.push(fn)
  return fn
}
