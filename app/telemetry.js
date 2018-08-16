/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const _ = require('underscore')
const Channel = require('./channel')
const request = require('request')

let telemetry = Immutable.Map()
let eventList = Immutable.List()
let enabled = false
const params = {}
const DEBUG = !!process.env.TELEMETRY_DEBUG

const platforms = {
  'darwin': 'osx',
  'win32x64': 'winx64',
  'win32ia32': 'winia32',
  'linux': 'linux'
}

// Configure default payload for Telemetry calls
if (params.platform === 'win32') {
  params.platform = platforms[params.platform + process.arch]
} else {
  params.platform = platforms[process.platform]
}
params.version = process.env.TELEMETRY_VERSION || require('electron').app.getVersion()
params.channel = Channel.channel()
params.machine = process.env.TELEMETRY_MACHINE

// determine if fully configured
if (!!process.env.TELEMETRY_URL &&
    !!process.env.TELEMETRY_TOKEN &&
    params.platform &&
    params.version &&
    params.channel &&
    !!params.machine) {
  console.log('Telemetry enabled: ' + process.env.TELEMETRY_URL)
  enabled = true
}

/**
 * Set a checkpoint to current timestamp
 * @param checkpoint {String} - name of checkpoint
 * @param ts {Number} - epoch timestamp [optional]
 */
function setCheckpoint (checkpoint, ts) {
  ts = ts || (new Date()).getTime()
  let delta = 0

  telemetry = telemetry.set(checkpoint, ts)

  if (eventList.size > 0) {
    delta = ts - eventList.get(eventList.size - 1)[1]
  }
  eventList = eventList.push([checkpoint, ts, delta / 1000])
  if (DEBUG) console.log(events())
}

/**
 * Return array containing timing info for all calls to setCheckpoint
 */
function events () {
  return eventList.toJS()
}

/**
 * Clear a checkpoint
 * @param checkpoint {String} - name of checkpoint
 */
function clearCheckpoint (checkpoint) {
  telemetry = telemetry.delete(checkpoint)
}

/**
 * Find the difference between the timestamps of two checkpoints
 * @param checkpoint1 {String} - name of earlier checkpoint
 * @param checkpoint2 {String} - name of later checkpoint
 */
function deltaBetween (checkpoint1, checkpoint2) {
  const ts1 = telemetry.get(checkpoint1)
  const ts2 = telemetry.get(checkpoint2)
  if (_.isNumber(ts1) && _.isNumber(ts2)) {
    return Math.abs(ts2 - ts1)
  }
}

/**
 * Set a checkpoint and report telemetry if configured
 * @param checkpoint {String} - name checkpoint
 * @param initialCheckpoint {String} - name of earlier checkpoint
 * @param extra {Object} - object passed to telemetry [optional]
 * @param ts {Number] - epoch timestamp for checkpoint
 */
function setCheckpointAndReport (checkpoint, initialCheckpoint, extra, ts) {
  initialCheckpoint = initialCheckpoint || 'init'
  extra = extra || {}

  setCheckpoint(checkpoint, ts)
  return sendTelemetry(
    checkpoint,
    deltaBetween(initialCheckpoint, checkpoint),
    extra
  )
}

// Build payload object and send telemetry if configured
const sendTelemetry = (measure, value, extra) => {
  const payload = _.extend(params, {
    measure: measure,
    value: value / 1000,
    ts: (new Date()).getTime(),
    extra: extra
  })
  if (enabled) {
    if (DEBUG) console.log(payload)
    request({
      method: 'POST',
      url: process.env.TELEMETRY_URL,
      form: params,
      headers: {
        Authorization: 'Bearer ' + process.env.TELEMETRY_TOKEN
      }
    },
    function (err, response, body) {
      if (err) console.error(err)
      if (DEBUG) console.log(body)
    })
  }
  return payload
}

setCheckpoint('__baseline__')

module.exports = {
  events: events,
  setCheckpoint: setCheckpoint,
  clearCheckpoint: clearCheckpoint,
  deltaBetween: deltaBetween,
  setCheckpointAndReport: setCheckpointAndReport
}
