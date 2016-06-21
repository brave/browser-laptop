/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

let registeredCallbacks = []
let registeredSessions = []
let registeredPrivateSessions = []

const isPrivate = (partition) => !partition.startsWith('persist:') && partition !== 'main-1'

// TODO(bridiver) move this to electron so we can call a simpler api
const setUserPrefType = (ses, path, value) => {
  switch (typeof value) {
    case 'object':
      ses.userPrefs.setDictionaryPref(path, value)
      break
    case 'string':
      ses.userPrefs.setStringPref(path, value)
      break
    case 'array':
      ses.userPrefs.setListPref(path, value)
      break
    case 'number':
      ses.userPrefs.setIntegerPref(path, value)
      break
    case 'boolean':
      ses.userPrefs.setBooleanPref(path, value)
      break
    default:
      console.warn(`Attempting to set an invalid preference value type for ${path}:`, value)
  }
}

const runCallback = (cb, name, incognito) => {
  let prefs = cb()

  if (typeof prefs !== 'object') {
    console.warn('userPrefs callback did not return an object:', prefs)
    return
  }

  if (name) {
    if (prefs[name]) {
      setUserPref(name, prefs[name], incognito)
      return true
    }
    return false
  }

  for (name in prefs) {
    setUserPref(name, prefs[name], incognito)
  }
  return true
}

const setUserPref = (path, value, incognito = false) => {
  let partitions = incognito ? Object.keys(registeredPrivateSessions) : Object.keys(registeredSessions)
  partitions.forEach((partition) => {
    setUserPrefType(registeredSessions[partition], path, value)
  })
}

module.exports.init = (ses, partition) => {
  if (isPrivate(partition)) {
    registeredPrivateSessions[partition] = ses
  } else {
    registeredSessions[partition] = ses
  }
  registeredCallbacks.forEach((fn) => fn())
}

module.exports.registerUserPrefs = (cb) => {
  let fn = runCallback.bind(this, cb)
  registeredCallbacks.push(fn)
  return fn
}
