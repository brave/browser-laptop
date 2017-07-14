/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const isDarwin = require('../../app/common/lib/platformUtil').isDarwin()

module.exports.isForSecondaryAction = (e) =>
  (e.ctrlKey && !isDarwin) ||
  (e.metaKey && isDarwin) ||
  e.button === 1

module.exports.eventElHasAncestorWithClasses = (e, classesToCheck) => {
  let node = e.target

  while (node) {
    let classMatch = classesToCheck.map(
      function (className) {
        return (node.classList ? node.classList.contains(className) : false)
      }
    ).includes(true)

    if (classMatch) {
      return true
    }

    node = node.parentNode
  }

  return false
}
