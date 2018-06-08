/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it */
const assert = require('assert')

const migration = require('../../../../app/migrations/20180518_uphold')

require('../../braveUnit')

describe('20180518_uphold migration', function () {
  it('does not run if global fingerprint protection is enabled', function () {
    let data = {
      fingerprintingProtectionAll: {
        enabled: true
      },
      lastAppVersion: '0.22.714'
    }
    assert.equal(migration(data), false)
  })

  it('does not run if last app version is missing (new installs)', function () {
    let data = {}
    assert.equal(migration(data), false)
  })

  it('does not run if last app version is greater than 0.22.714', function () {
    let data = {
      lastAppVersion: '0.22.715'
    }
    assert.equal(migration(data), false)
  })

  it('runs if last app version is 0.22.714', function () {
    let data = {
      lastAppVersion: '0.22.714'
    }
    assert.equal(migration(data), true)
  })

  it('runs if last app version is older than 0.22.714', function () {
    let data = {
      lastAppVersion: '0.22.13'
    }
    assert.equal(migration(data), true)
  })

  it('sets fingerprintingProtection for the site (if not already set)', function () {
    let data = {
      lastAppVersion: '0.22.13'
    }
    migration(data)
    assert.equal(data.siteSettings['https?://uphold.com'].fingerprintingProtection, 'allowAllFingerprinting')
  })

  it('does not overwrite an existing fingerprintingProtection setting for the site', function () {
    let data = {
      lastAppVersion: '0.22.13',
      siteSettings: {
        'https?://uphold.com': {
          fingerprintingProtection: 'blockAllFingerprinting'
        }
      }
    }
    migration(data)
    assert.equal(data.siteSettings['https?://uphold.com'].fingerprintingProtection, 'blockAllFingerprinting')
  })
})
