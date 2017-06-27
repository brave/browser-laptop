/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const syncUtil = require('../../../js/state/syncUtil')

/**
 * Turn app state pendingRecords into an OrderedMap.
 * @param {Immutable.Map} state app state
 * @returns {Immutable.OrderedMap} new app state
 */
module.exports.initPendingRecords = (state) => {
  const pendingRecords = state.getIn(['sync', 'pendingRecords'])
  const orderedPendingRecords = new Immutable.OrderedMap(pendingRecords)
  return state.setIn(['sync', 'pendingRecords'], orderedPendingRecords)
}

/**
 * Given records sent via SEND_SYNC_RECORDS, insert them in the app state.
 * @param {Immutable.Map} state app state
 * @param {Array.<Object>} records
 * @returns {Immutable.Map} new app state
 */
module.exports.pendRecords = (state, records) => {
  const enqueueTimestamp = new Date().getTime()
  records.forEach(record => {
    const pendingRecord = Immutable.fromJS({enqueueTimestamp, record})
    const key = record.objectId.toString()
    state = state.setIn(['sync', 'pendingRecords', key], pendingRecord)
  })
  return state
}

/**
 * Given app state, extract records to be sent via SEND_SYNC_RECORDS.
 * @param {Immutable.Map} state app state
 * @returns {Array.<Object>} records
 */
module.exports.getPendingRecords = (state) => {
  const pendingRecords = state.getIn(['sync', 'pendingRecords'])
  return pendingRecords.map(pendingRecord => pendingRecord.get('record').toJS()).toArray()
}

/**
 * Confirm downloaded records and remove them from the app state sync
 * pending records.
 * In case of multiple updates to the same object, the newest update takes
 * precedence. Thus, if a downloaded record has a newer timestamp it
 * dequeues any pending record.
 * @param {Immutable.Map} state app state
 * @param {Array.<Object>} downloadedRecord
 * @returns {Immutable.Map} new app state
 */
module.exports.confirmRecords = (state, downloadedRecords) => {
  downloadedRecords.forEach(record => {
    // browser-laptop stores byte arrays like objectId as Arrays.
    // downloaded records use Uint8Arrays which we should convert back.
    const fixedRecord = syncUtil.deepArrayify(record)
    const key = fixedRecord.objectId.toString()
    const enqueueTimestamp = state.getIn(['sync', 'pendingRecords', key, 'enqueueTimestamp'])
    if (!enqueueTimestamp || (enqueueTimestamp > fixedRecord.syncTimestamp)) {
      return
    }
    state = state.deleteIn(['sync', 'pendingRecords', key])
  })
  return state
}
