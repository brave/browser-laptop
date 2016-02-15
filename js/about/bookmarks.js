/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')

// Stylesheets
require('../../less/about/bookmarks.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

class AboutBookmarks extends ImmutableComponent {
  render () {
    return <div>
      <h1>Bookmarks TODO</h1>
    </div>
  }
}

module.exports = <AboutBookmarks/>
