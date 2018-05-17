/* global describe, before, after, it */

const assert = require('assert')
const child_process = require('child_process') // eslint-disable-line camelcase
const fs = require('fs')
const mockery = require('mockery')

describe('tor unit tests', () => {
  let tor
  const fakeElectron = require('../lib/fakeElectron')
  before(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    tor = require('../../../app/tor')
  })
  after(() => {
    mockery.disable()
  })

  it('torrcEscapeString', () => {
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

  it('torrcEscapeBuffer', () => {
    assert.strictEqual('"\\x00\\x01\\x1f \\x7f\\x80\\xfe\\xff"',
      tor.torrcEscapeBuffer(Buffer.from([0, 1, 31, 32, 127, 128, 254, 255])))
  })

  it('torControlParseQuoted', () => {
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

  it('torControlParseKV', () => {
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
    proc.on('error', (err) => {
      console.log(`error: ${err}`)
      torDaemon.kill()
    })
    proc.on('exit', () => {
      console.log(`exited`)
      torDaemon.kill()
    })
    proc.stdin.end('')
    return proc
  }

  const bravePath = () => fakeElectron.app.getPath('userData')
  before((cb) => {
    fs.mkdir(bravePath(), 0o700, (err) => {
      if (err && err.code !== 'EEXIST') {
        assert.ifError(err)
      }
      cb()
    })
  })
  after((cb) => {
    fs.rmdir(bravePath(), (err) => {
      assert.ifError(!err)
      cb()
    })
  })

  it('tor daemon start then watch', (callback) => {
    // TODO(riastradh): broken test
    return callback()
    /* eslint-disable no-unreachable */
    const torDaemon = new tor.TorDaemon()
    torDaemon.setup(() => {
      const proc = spawnTor(torDaemon)
      setTimeout(() => {
        torDaemon.start()
        const timeoutLaunch = setTimeout(() => {
          assert.fail('tor daemon failed to start after 1sec')
        }, 2000)
        torDaemon.on('launch', (socksAddr) => {
          clearTimeout(timeoutLaunch)
          proc.kill('SIGTERM')
          const timeoutKill = setTimeout(() => {
            proc.kill('SIGKILL')
            assert.fail('tor daemon failed to exit after 1sec')
          }, 2000)
          proc.on('exit', () => {
            clearTimeout(timeoutKill)
            torDaemon.kill()
            callback()
          })
        })
      }, 500)
    })
    /* eslint-enable no-unreachable */
  })

  it('tor daemon watch then start', (callback) => {
    // TODO(riastradh): broken test
    return callback()
    /* eslint-disable no-unreachable */
    const torDaemon = new tor.TorDaemon()
    torDaemon.setup(() => {
      torDaemon.start()
      setTimeout(() => {
        const proc = spawnTor(torDaemon)
        const timeoutLaunch = setTimeout(() => {
          console.log(`launch timeout`)
          assert.fail('tor daemon failed to start after 1sec')
        }, 2000)
        torDaemon.on('launch', (socksAddr) => {
          clearTimeout(timeoutLaunch)
          proc.kill('SIGTERM')
          const timeoutKill = setTimeout(() => {
            proc.kill('SIGKILL')
            assert.fail('tor daemon failed to exit after 1sec')
          }, 2000)
          proc.on('exit', () => {
            clearTimeout(timeoutKill)
            torDaemon.kill()
            callback()
          })
        })
      }, 500)
    })
    /* eslint-enable no-unreachable */
  })
})
