/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const _ = require('underscore')
const Channel = require('./channel')
const request = require('request')

var telemetry = Immutable.Map()
var enabled = false
const params = {}
const DEBUG = !!process.env.TELEMETRY_DEBUG

var platforms = {
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

  if (DEBUG) console.log(checkpoint, ts)
  telemetry = telemetry.set(checkpoint, ts)
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
  var ts1 = telemetry.get(checkpoint1)
  var ts2 = telemetry.get(checkpoint2)
  if (_.isNumber(ts1) && _.isNumber(ts2)) {
    return Math.abs(ts2 - ts1)
  } else {
    return
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
var sendTelemetry = (measure, value, extra) => {
  var payload = _.extend(params, {
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
      if (err) console.log(err)
      if (DEBUG) console.log(body)
    })
  }
  return payload
}

module.exports = {
  setCheckpoint: setCheckpoint,
  clearCheckpoint: clearCheckpoint,
  deltaBetween: deltaBetween,
  setCheckpointAndReport: setCheckpointAndReport
}
