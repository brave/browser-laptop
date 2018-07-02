/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global after, afterEach, before, beforeEach, describe, it */

const assert = require('assert')
const child_process = require('child_process') // eslint-disable-line camelcase
const fs = require('fs')
const mockery = require('mockery')
const rimraf = require('rimraf')

describe('tor unit tests', function () {
  let tor
  const fakeElectron = require('../../unit/lib/fakeElectron')
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    tor = require('../../../app/tor')
  })
  after(function () {
    mockery.disable()
    mockery.deregisterAll()
  })

  it('torrcEscapeString', function () {
    assert.strictEqual('foobar', tor.torrcEscapeString('foobar'))
    assert.strictEqual('" foobar"', tor.torrcEscapeString(' foobar'))
    assert.strictEqual('"\\x09foobar"', tor.torrcEscapeString('\tfoobar'))
    assert.strictEqual('"foo\\\\\\x0abar"', tor.torrcEscapeString('foo\\\nbar'))
    assert.strictEqual('"foo bar"', tor.torrcEscapeString('foo bar'))
    assert.strictEqual('"foo#bar"', tor.torrcEscapeString('foo#bar'))
    assert.strictEqual('"foo\\"bar"', tor.torrcEscapeString('foo"bar'))
    assert.strictEqual('"foo\\\\bar"', tor.torrcEscapeString('foo\\bar'))
    assert.strictEqual('"fno\\xcc\\x88rd"', tor.torrcEscapeString('fnörd'))
    assert.strictEqual('"C:\\\\Ronald\\xe2\\x80\\x99s laptop\'s disk"',
      tor.torrcEscapeString('C:\\Ronald’s laptop\'s disk'))
  })

  it('torrcEscapeBuffer', function () {
    assert.strictEqual('"\\x00\\x01\\x1f \\x7f\\x80\\xfe\\xff"',
      tor.torrcEscapeBuffer(Buffer.from([0, 1, 31, 32, 127, 128, 254, 255])))
  })

  it('torControlParseQuoted', function () {
    assert.deepStrictEqual([Buffer.from('127.0.0.1:41159', 'ascii'), 17],
      tor.torControlParseQuoted('"127.0.0.1:41159"', 0, 17))
    assert.deepStrictEqual([Buffer.from('unix:/a b/c', 'ascii'), 13],
      tor.torControlParseQuoted('"unix:/a b/c"', 0, 13))
    assert.deepStrictEqual([Buffer.from('unix:/a\rb/c', 'ascii'), 14],
      tor.torControlParseQuoted('"unix:/a\\rb/c"', 0, 14))
    assert.deepStrictEqual([Buffer.from('unix:/a\nb/c', 'ascii'), 14],
      tor.torControlParseQuoted('"unix:/a\\nb/c"', 0, 14))
    assert.deepStrictEqual([Buffer.from('unix:/a\tb/c', 'ascii'), 14],
      tor.torControlParseQuoted('"unix:/a\\tb/c"', 0, 14))
    assert.deepStrictEqual([Buffer.from('unix:/a\\b/c', 'ascii'), 14],
      tor.torControlParseQuoted('"unix:/a\\\\b/c"', 0, 14))
    assert.deepStrictEqual([Buffer.from('unix:/a"b/c', 'ascii'), 14],
      tor.torControlParseQuoted('"unix:/a\\"b/c"', 0, 14))
    assert.deepStrictEqual([Buffer.from('unix:/a\'b/c', 'ascii'), 14],
      tor.torControlParseQuoted('"unix:/a\\\'b/c"', 0, 14))
    assert.deepStrictEqual([Buffer.from('unix:/a b/c', 'ascii'), 13],
      tor.torControlParseQuoted('"unix:/a b/c" "127.0.0.1:9050"', 0, 30))
    assert.deepStrictEqual([null, 12],
      tor.torControlParseQuoted('"unix:/a b/c', 0, 12))
    assert.deepStrictEqual([null, 9],
      tor.torControlParseQuoted('"unix:/a\\fb/c"', 0, 13))
  })

  it('torControlParseKV', function () {
    assert.deepStrictEqual(['foo', Buffer.from('bar'), 8],
      tor.torControlParseKV('xfoo=bary', 1, 8))
    assert.deepStrictEqual(['foo', Buffer.from('bar'), 10],
      tor.torControlParseKV('xfoo="bar"y', 1, 10))
    assert.deepStrictEqual(['foo', Buffer.from('bar baz'), 14],
      tor.torControlParseKV('xfoo="bar baz"y', 1, 14))
    assert.deepStrictEqual(['foo', Buffer.from('bar"baz'), 15],
      tor.torControlParseKV('xfoo="bar\\"baz"y', 1, 15))
    assert.deepStrictEqual(['foo', Buffer.from('bar"baz'), 16],
      tor.torControlParseKV('xfoo="bar\\"baz" quux="zot"y', 1, 26))
    assert.deepStrictEqual(['foo', Buffer.from('barbaz'), 12],
      tor.torControlParseKV('xfoo=barbaz quux=zoty', 1, 20))
  })

  const spawnTor = (torDaemon) => {
    const argv = [
      // Pass torrc on stdin.
      '-f', '-',
      '--defaults-torrc', '/nonexistent',
      '--ignore-missing-torrc',
      // Set the directory authority to something that doesn't exist
      // so tor won't actually talk to the network (much?).
      '--dirauthority', '0.0.0.0:443 0000000000000000000000000000000000000000',
      '--socksport', 'auto',
      '--controlport', 'auto',
      '--controlportwritetofile', tor.torControlPortPath(),
      '--cookieauthentication', '1',
      '--cookieauthfile', tor.torControlCookiePath(),
      '--datadirectory', tor.torDataDirPath(),
      '--log', 'notice stderr'
    ]
    const spawnOpts = {
      env: {},
      argv0: 'brave-test-tor'   // make the process easily greppable
    }
    const torPath = 'app/extensions/bin/tor'
    const proc = child_process.spawn(torPath, argv, spawnOpts)
    const bufsplit = (buf, delim) => {
      const chunks = []
      let i = 0
      let j
      while ((j = buf.indexOf(delim, i)) !== -1) {
        chunks.push(buf.slice(i, j))
        i = j + 1
      }
      if (i !== 0) {            // Trailing chunk.
        chunks.push(buf.slice(i))
      }
      return chunks
    }
    const termify = (prefix, buf) => {
      // TODO(riastradh): make content safe for terminal
      const chunks = bufsplit(buf, 0x0a) // LF
      for (let i = 0; i < chunks.length; i++) {
        if (i + 1 === chunks.length && chunks[i].length === 0) {
          continue
        }
        console.log(prefix + chunks[i])
      }
    }

    proc.stderr.on('data', (chunk) => termify('tor: stderr: ', chunk))
    proc.stdout.on('data', (chunk) => termify('tor: stdout: ', chunk))
    proc.on('error', (err) => console.log(`tor process error: ${err}`))
    proc.on('exit', (status) => console.log(`tor process exited: ${status}`))

    // Send empty torrc on stdin.
    proc.stdin.end('')

    return proc
  }

  // Kill tor gently with SIGTERM and wait for it to exit.
  const killTor = (torDaemon, torProcess, callback) => {
    // Send SIGTERM.
    torProcess.kill('SIGTERM')

    // Wait up to 2sec for both to report exit.
    const timeoutExited = setTimeout(() => {
      assert.fail('tor failed to exit after 2sec')
    }, 2000)

    let countdown = 2
    const exited = () => {
      if (--countdown === 0) {
        clearTimeout(timeoutExited)
        // Success!
        callback()
      }
    }

    // Make sure the TorDaemon emits an exit event.
    torDaemon.once('exit', exited)

    // Make sure the process actually exits.
    torProcess.once('exit', exited)
  }

  describe('tor daemon tests', function () {
    const bravePath = () => fakeElectron.app.getPath('userData')
    let torDaemon = null        // TorDaemon
    let torProcess = null       // child_process
    beforeEach((cb) => {
      assert(torDaemon === null)
      assert(torProcess === null)
      fs.mkdir(bravePath(), 0o700, (err) => {
        if (err && err.code !== 'EEXIST') {
          assert.ifError(err)
        }
        torDaemon = new tor.TorDaemon()
        cb()
      })
    })
    afterEach((cb) => {
      if (torProcess) {
        torProcess.kill('SIGKILL')
        torProcess = null
      }
      assert(torDaemon)
      torDaemon.kill()
      torDaemon = null
      rimraf(bravePath(), (err) => {
        assert.ifError(err)
        cb()
      })
    })

    it('spawns tor process then watches', function (callback) {
      torDaemon.setup(() => {
        // First spawn the tor process.
        assert(torProcess === null)
        assert(torDaemon)
        torProcess = spawnTor(torDaemon)
        // Wait half a second to give the tor process a head start.
        setTimeout(() => {
          // Next set up the directory watching.
          torDaemon.start()
          const timeoutLaunch = setTimeout(() => {
            assert.fail('tor daemon failed to start after 2.5sec')
          }, 2000)
          // Wait for it to launch.
          torDaemon.once('launch', (socksAddr) => {
            clearTimeout(timeoutLaunch)
            // All done.
            killTor(torDaemon, torProcess, callback)
          })
        }, 500)
      })
    })

    it('watches then spawns tor process', function (callback) {
      torDaemon.setup(() => {
        // First set up directory watching.
        torDaemon.start()
        // Wait half a second to give the file system watcher a head
        // start.
        setTimeout(() => {
          // Next spawn the tor process.
          assert(torProcess === null)
          assert(torDaemon)
          torProcess = spawnTor(torDaemon)
          const timeoutLaunch = setTimeout(() => {
            assert.fail('tor daemon failed to start after 2sec')
          }, 2000)
          // Wait for it to launch.
          torDaemon.once('launch', (socksAddr) => {
            clearTimeout(timeoutLaunch)
            // All done.
            killTor(torDaemon, torProcess, callback)
          })
        }, 500)
      })
    })

    it('launches tor and begins bootstrapping', function (callback) {
      torDaemon.setup(() => {
        torDaemon.start()
        torProcess = spawnTor(torDaemon)
        const timeoutLaunch = setTimeout(() => {
          assert.fail('tor daemon failed to start after 2sec')
        }, 2000)
        torDaemon.once('launch', (socksAddr) => {
          clearTimeout(timeoutLaunch)
          const bootstrapTimeout = setTimeout(() => {
            assert.fail('tor daemon failed to begin bootstrapping after 2sec')
          }, 2000)
          const done = () => killTor(torDaemon, torProcess, callback)
          let countdown = 2
          let bootstrapped1 = false
          const bootstrapped = (err, progress) => {
            assert.ifError(err)
            clearTimeout(bootstrapTimeout)
            console.log(`tor: bootstrapped ${progress}%`)
            if (!bootstrapped1) {
              // Got at least one bootstrap progress notification.
              bootstrapped1 = true
              if (--countdown === 0) {
                // And onBootstrap returned.
                return done()
              }
            }
          }
          torDaemon.onBootstrap(bootstrapped, (err) => {
            assert.ifError(err)
            if (--countdown === 0) {
              // Got at least one bootstrap progress notification too.
              return done()
            }
          })
        })
      })
    })

    it('notices tor restart', function (callback) {
      torDaemon.setup(() => {
        // Start watching.
        torDaemon.start()
        // Spawn a process.
        torProcess = spawnTor(torDaemon)
        // Wait for it to launch once.
        const timeoutLaunch = setTimeout(() => {
          assert.fail('tor daemon failed to start after 2sec')
        }, 2000)
        torDaemon.once('launch', (socksAddr) => {
          clearTimeout(timeoutLaunch)
          // Kill the _process_ once.
          killTor(torDaemon, torProcess, () => {
            // Spawn a new process.
            torProcess = spawnTor(torDaemon)
            // Wait for it to launch a second time.
            const timeoutRelaunch = setTimeout(() => {
              assert.fail('tor daemon failed to restart after 2sec')
            }, 2000)
            torDaemon.once('launch', (socksAddr) => {
              clearTimeout(timeoutRelaunch)
              killTor(torDaemon, torProcess, callback)
            })
          })
        })
      })
    })
  })
})
