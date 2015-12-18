/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// UPDATE_HOST should be set to the host name for the auto-updater server
var updateHost = process.env.UPDATE_HOST || 'https://dev.mysite.com'

module.exports = {
  updates: {
    // Check for front end updates every hour
    appUpdateCheckFrequency: 1000 * 60 * 60,
    // Check after 2 minutes, near startup
    runtimeUpdateCheckDelay: 1000 * 60 * 2,
    // If true user will not be notified before updates are reloaded
    autoAppUpdate: false,
    autoRuntimeUpdate: false,
    // url to check for updates
    baseUrl: `${updateHost}/1/releases`
  }
}
