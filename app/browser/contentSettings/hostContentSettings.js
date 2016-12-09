/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const { makeImmutable } = require('../../common/state/immutableUtil')

let registeredSessions = {}

module.exports.setContentSettings = (contentSettings) => {
  contentSettings = makeImmutable(contentSettings)
  contentSettings.forEach((settings, contentType) => {
    for (let partition in registeredSessions) {
      registeredSessions[partition].contentSettings.clearForOneType(contentType)
    }
    settings.forEach((setting) => {
      module.exports.setContentSetting(setting.get('primaryPattern'), setting.get('secondaryPattern'),
          contentType, setting.get('resourceId'), setting.get('setting'))
    })
    for (let partition in registeredSessions) {
      registeredSessions[partition].webRequest.handleBehaviorChanged()
    }
  })
}

module.exports.setContentSetting = (primaryUrl, secondaryUrl = '*', contentType, resourceId = '', setting) => {
  for (var partition in registeredSessions) {
    registeredSessions[partition].contentSettings.set(primaryUrl, secondaryUrl, contentType, resourceId, setting)
  }
}

module.exports.init = (ses, partition, isPrivate) => {
  registeredSessions[partition] = ses
}
