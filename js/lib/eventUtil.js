/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {isDarwin} = require('../../app/common/lib/platformUtil')

module.exports.isForSecondaryAction = (e) =>
  (e.ctrlKey && !isDarwin()) ||
  (e.metaKey && isDarwin()) ||
  e.button === 1

module.exports.eventElHasAncestorWithClasses = (e, classesToCheck) => {
  // DO NOT ADD NEW CHECKS USING THIS METHOD
  // classNames are changed from dev to prod by Aphrodite est. v1.2.3
  // and new code will not work. Consider using dataset attribute instead.
  // See issue #10029 for a breaking example.
  // ....
  // TODO deprecate this method.
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

/**
 * Checks if a given node dataset matches a given dataset or array of datasets
 * @param {Object} The node to check if dataset is included
 * @param {Array|String} the dataset value to check against
 * @returns {Boolean} Whether or not the given dataset is included in the check
 */
module.exports.elementHasDataset = (node, datasetArray) => {
  if (!node.dataset) {
    return false
  }

  const datasetToMatch = Array.isArray(datasetArray) ? datasetArray : [datasetArray]
  const elementDataset = Object.keys(node.dataset)

  return elementDataset.some(dataset => datasetToMatch.includes(dataset))
}
