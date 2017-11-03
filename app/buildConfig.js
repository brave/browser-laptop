/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

// The package npm task builds this module
const config = require('../js/constants/buildConfig')

exports.browserLaptopRev = () => process.env.NODE_ENV === 'development'
  ? require('git-rev-sync').long()
  : config.BROWSER_LAPTOP_REV
