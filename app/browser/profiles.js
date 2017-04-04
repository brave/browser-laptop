/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {app, session} = require('electron')
const {initPartition} = require('../filtering')

const init = (state) => {
  app.on('browser-context-created', (e, session) => {
    initPartition(session.partition)
  })
  session.getAllSessions().forEach((session) => {
    initPartition(session.partition)
  })

  return state
}

module.exports.init = init
