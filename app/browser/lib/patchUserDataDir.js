/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const path = require('path')
const {app} = require('electron')

if (!process.env.BRAVE_USER_DATA_DIR && ['development', 'test'].includes(process.env.NODE_ENV)) {
  process.env.BRAVE_USER_DATA_DIR = path.join(app.getPath('appData'), app.getName() + '-' + process.env.NODE_ENV)
}

if (process.env.BRAVE_USER_DATA_DIR) {
  app.setPath('userData', process.env.BRAVE_USER_DATA_DIR)
}

