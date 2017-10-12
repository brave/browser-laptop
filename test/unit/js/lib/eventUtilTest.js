/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, it */

const eventUtil = require('../../../../js/lib/eventUtil')
const assert = require('assert')

require('../../braveUnit')

describe('eventUtil', function () {
  describe('elementHasDataset', function () {
    let datasetToTest
    let node = { dataset: { nespresso: true } }

    it('returns false if node dataset do not match', function () {
      datasetToTest = ['starbucks', 'keurig']
      assert.equal(eventUtil.elementHasDataset(node, datasetToTest), false)
    })
    it('returns true if node dataset match the provided dataset array', function () {
      datasetToTest = ['wow', 'such', 'nespresso', 'very', 'amazing']
      assert.equal(eventUtil.elementHasDataset(node, datasetToTest), true)
    })
    it('can accept strings for the dataset to match against', function () {
      datasetToTest = 'nespresso'
      assert.equal(eventUtil.elementHasDataset(node, datasetToTest), true)
    })
    it('can not accept partial string match', function () {
      datasetToTest = ['nespressomnibox']
      assert.equal(eventUtil.elementHasDataset(node, datasetToTest), false)
    })
    it('returns false if node do not provide a dataset', function () {
      node = delete node.dataset
      datasetToTest = ['nespresso']
      assert.equal(eventUtil.elementHasDataset(node, datasetToTest), false)
    })
  })
})
