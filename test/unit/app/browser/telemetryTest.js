/* global describe, it */
const assert = require('assert')

process.env.TELEMETRY_TOKEN = 'token'
process.env.TELEMETRY_VERSION = '1.2.3'
process.env.TELEMETRY_MACHINE = 'mbp'

const telemetry = require('../../../../app/telemetry')

describe('telemetry', function () {
  it('records checkpoints', function () {
    telemetry.setCheckpoint('foo', 1000)
    telemetry.setCheckpoint('bar', 2000)

    assert.equal(telemetry.deltaBetween('foo', 'bar'), 1000, 'has correct delta calculation')

    telemetry.clearCheckpoint('bar')
    telemetry.setCheckpoint('bar', 3000)
    assert.equal(telemetry.deltaBetween('foo', 'bar'), 2000, 'clears checkpoints')
  })
  it('formats and sends telemetry object correctly', function () {
    const payload = telemetry.setCheckpointAndReport('baz', 'foo', { attrib: 'value' }, 5000)
    const expected = {
      platform: payload.platform,
      version: '1.2.3',
      channel: payload.channel,
      machine: 'mbp',
      measure: 'baz',
      value: 4,
      ts: payload.ts,
      extra: { attrib: 'value' }
    }
    assert.deepEqual(payload, expected, 'payload is correct')
  })
  it('records events correctly', function () {
    assert.equal(telemetry.events().length, 5, 'correct number of events')
  })
})
