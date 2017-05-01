/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

module.exports.getSiteProps = site => {
  return Immutable.fromJS({
    location: site.get('location'),
    order: site.get('order'),
    partitionNumber: site.get('partitionNumber') || 0
  })
}
