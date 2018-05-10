/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const aphrodite = require('aphrodite/no-important')

const pseudoChild = {
  psuedoHandler: (selector, baseSelector, generateSubtreeStyles) => {
    var regex = /^>:\w+\s{1}\w+$/im
    if (!selector.match(regex)) {
      return null
    }
    var pseudo = selector.slice(1).split(' ')[0]
    var parentSelector = '.' + selector.split(' ')[1]
    return generateSubtreeStyles(parentSelector + pseudo + ' ' + baseSelector)
  }
}

var parentExtension = {selectorHandler: pseudoChild}

module.exports = aphrodite.StyleSheet.extend([parentExtension])
