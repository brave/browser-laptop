/* global describe, before, after, it */

const assert = require('assert')
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
})
