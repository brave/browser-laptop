/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const { makeImmutable } = require('../../common/state/immutableUtil')
const appConfig = require('../../../js/constants/appConfig')

let registeredCallbacks = []
let registeredSessions = {}
let registeredPrivateSessions = {}
const blockContentSetting = { setting: 'block', primaryPattern: '*' }

module.exports.setContentSettings = (contentSettings, incognito) => {
  contentSettings = makeImmutable(contentSettings)

  const partitions = incognito ? registeredPrivateSessions : registeredSessions
  for (let partition in partitions) {
    let newContentSettings = contentSettings
    if (partition === appConfig.tor.partition) {
      // Do not allow plugins to be enabled in Tor contexts
      newContentSettings = contentSettings.set('plugins', makeImmutable([blockContentSetting]))
    }

    const ses = partitions[partition]

    newContentSettings.forEach((settings, contentType) => {
      ses.contentSettings.clearForOneType(contentType)
      settings.forEach((setting) => {
        module.exports.setContentSetting(ses, setting.get('primaryPattern'), setting.get('secondaryPattern'),
            contentType, setting.get('resourceId'), setting.get('setting'))
      })
    })
    ses.webRequest.handleBehaviorChanged()
  }
}

module.exports.setContentSetting = (ses, primaryUrl, secondaryUrl = '*', contentType, resourceId = '', setting) => {
  ses.contentSettings.set(primaryUrl, secondaryUrl, contentType, resourceId, setting)
}

const runCallback = (cb, incognito) => {
  let settings = cb(incognito)

  if (typeof settings !== 'object') {
    console.warn('contentSettings callback did not return an object:', settings)
    return
  }

  module.exports.setContentSettings(settings, incognito)
}

module.exports.init = (ses, partition, isPrivate) => {
  if (isPrivate) {
    registeredPrivateSessions[partition] = ses
  }
  registeredSessions[partition] = ses
  registeredCallbacks.forEach((fn) => fn(isPrivate))
}

module.exports.registerContentSettings = (cb) => {
  let fn = runCallback.bind(this, cb)
  registeredCallbacks.push(fn)
  return fn
}
