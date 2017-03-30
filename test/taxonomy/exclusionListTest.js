/* global describe, it, before */

/* jshint asi: true, node: true, laxbreak: true, laxcomma: true, undef: true, unused: true */
const levelup = require('level')
const assert = require('assert')

const includes = (db, domain, done) => {
  db.get('domain:' + domain, function (err, value) {
    assert.equal(!!err, true)
    done()
  })
}

const excludes = (db, domain, done) => {
  db.get('domain:' + domain, function (err, value) {
    if (err) throw err
    const parsedValue = JSON.parse(value)
    assert.equal(parsedValue && parsedValue.exclude, true)
    done()
  })
}

const excludesSubdomain = (db, subdomain, done) => {
  db.get('SLD:' + subdomain, function (err, value) {
    if (err) throw err
    const parsedValue = JSON.parse(value)
    assert.equal(parsedValue && parsedValue.exclude, true)
    done()
  })
}

const excludesTLD = (db, tld, done) => {
  db.get('TLD:' + tld, function (err, value) {
    if (err) throw err
    const parsedValue = JSON.parse(value)
    assert.equal(parsedValue && parsedValue.exclude, true)
    done()
  })
}

const waitForDownload = (db, done) => {
  const entries = []

  db.createKeyStream()
  .on('data', function (data) {
    entries.push(data)
  }).on('error', function (err) {
    throw err
  }).on('end', function () {
    if (entries.length === 0) {
      const err = 'No entries found in leveldb;\n' +
        'manually run `LEDGER_VERBOSE=1 LEDGER_RULES_TESTING=1 npm start` and wait for all entries to download\n' +
        '(takes about 6 minutes).\n' +
        'If running in CI, make a test case that just sleeps for 10 minutes and run prior to this.'
      throw err
    }
    done()
  })
}

let dbHandle

// https://github.com/Level/levelup

describe('smoketest for our exclusion list', function () {
  before(function (done) {
    // TODO(bsclifton): only works on macOS at the moment
    const filepath =
      require('os').homedir() +
      '/Library/Application Support' +
      '/brave-development/ledger-rulesV2.leveldb'

    levelup(filepath,
      {},
      function (err, db) {
        if (err) throw err
        dbHandle = db

        // TODO: wait until the DB has entries
        waitForDownload(db, done)
      })
  })

  describe('includes', function () {
    it('brianbondy.com', function (done) {
      includes(dbHandle, 'brianbondy.com', done)
    })
    it('clifton.io', function (done) {
      includes(dbHandle, 'clifton.io', done)
    })
    it('coindesk.com', function (done) {
      includes(dbHandle, 'coindesk.com', done)
    })
    it('cnn.com', function (done) {
      includes(dbHandle, 'cnn.com', done)
    })
    it('cnet.com', function (done) {
      includes(dbHandle, 'cnet.com', done)
    })
    it('Hacker News', function (done) {
      includes(dbHandle, 'news.ycombinator.com', done)
    })
  })

  describe('excludes', function () {
    it('bankofamerica.com', function (done) {
      excludes(dbHandle, 'bankofamerica.com', done)
    })
    it('brave.com', function (done) {
      excludes(dbHandle, 'brave.com', done)
    })
    it('Facebook', function (done) {
      excludesSubdomain(dbHandle, 'facebook', done)
    })
    it('.gov TLD', function (done) {
      excludesTLD(dbHandle, 'gov', done)
    })
    it('Google', function (done) {
      excludesSubdomain(dbHandle, 'google', done)
    })
    it('walmart.com', function (done) {
      excludes(dbHandle, 'walmart.com', done)
    })
  })
})
