/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

// Tor daemon management.
//
// This doesn't actually manage the tor daemon: the parts that did are
// commented out.  Rather it just watches the tor daemon's control
// port file for activity and connects to its control socket.

const EventEmitter = require('events')
const assert = require('assert')
const electron = require('electron')
const fs = require('fs')
const net = require('net')
const path = require('path')
const stream = require('stream')

// torBravePath()
//
//      Return the path to the directory where we store tor-related
//      files.
//
function torBravePath () {
  const bravePath = electron.app.getPath('userData')
  return path.join(bravePath, 'tor')
}

// torDataDirPath()
//
//      Return the path to the data directory that we use for our tor
//      daemon.
//
function torDataDirPath () {
  return path.join(torBravePath(), 'data')
}

// torWatchDirPath()
//
//      Return the path to the directory we watch for changes as tor
//      starts up.
//
function torWatchDirPath () {
  return path.join(torBravePath(), 'watch')
}

// torControlPortPath()
//
//      Return the path to the file containing the port number for the
//      control channel that our tor daemon is listening on.
//
function torControlPortPath () {
  return path.join(torWatchDirPath(), 'controlport')
}

// torControlCookiePath()
//
//      Return the path to the file containing the control connection
//      authentication cookie.
//
function torControlCookiePath () {
  return path.join(torWatchDirPath(), 'control_auth_cookie')
}

// TorDaemon
//
//      State for a tor daemon subprocess.
//
class TorDaemon extends EventEmitter {
  constructor () {
    super()
    this._process = null        // child process
    this._watcher = null        // fs watcher
    this._polling = false       // true if we are polling for start
    this._retry_poll = null     // set if polling, true if should retry on fail
    this._control = null        // TorControl instance
    this._socks_addresses = null // array of tor's socks addresses
  }

  // setup(callback)
  //
  //    Create the necessary directories and invoke callback when
  //    done.  We assume the parent of torBravePath exists; we create
  //    it and everything we need underneath it.  On failure other
  //    than EEXIST, may leave directories partially created.
  //
  setup (callback) {
    const directories = [
      torBravePath(),
      torWatchDirPath()
    ]
    const loop = (i) => {
      if (i === directories.length) {
        return callback(null)
      }
      assert(i >= 0)
      assert(i < directories.length)
      fs.mkdir(directories[i], 0o700, (err) => {
        if (err && err.code !== 'EEXIST') {
          return callback(err)
        }
        loop(i + 1)
      })
    }
    loop(0)
  }

  // start()
  //
  //    Start the tor daemon.  Caller must ensure that the necessary
  //    directories have been created.
  //
  start () {
    // Begin watching for the control port file to be written.
    const watchDir = torWatchDirPath()
    const watchOpts = {persistent: false}
    this._watcher = fs.watch(watchDir, watchOpts, (event, filename) => {
      this._watchEvent(event, filename)
    })

    this._process = 'i am the very seeming of a child process daemon'
    this._poll()
  }

  // kill()
  //
  //    Kill the tor daemon.
  //
  kill () {
    if (!this._process) {
      assert(this._process === null)
      assert(this._control === null)
      console.log("tor: not running, can't kill")
      return
    }
    if (this._control) {
      this._control.close()
      this._control = null
    }
    this.emit('exit')
  }

  // _watchEvent(event, filename)
  //
  //    Called by fs.watch when the tor watch directory is changed.
  //    If the control port file is newly written, then the control
  //    socket should be available now.
  //
  //    Note: filename is documented to be unreliable, so we don't use
  //    it.  Instead we just check whether the control port file is
  //    written and matches.
  //
  _watchEvent (event, filename) {
    assert(this._watcher)

    // If the process died in the interim, give up.
    if (!this._process) {
      console.log('tor: process dead, ignoring watch event')
      return
    }

    if (this._control) {
      console.log('tor: ignoring watch event, control already open')
      return
    }
    this._poll()
  }

  // _poll()
  //
  //    Poll for whether tor has started yet, or if there is a poll
  //    already pending, tell it to retry in case it fails.
  //
  _poll () {
    assert(this._process)
    assert(this._control === null)

    if (this._polling) {
      console.log('tor: already polling, will retry if it fails')
      this._retry_poll = true
      return
    } else {
      assert(this._retry_poll === null)
    }
    this._polling = true
    this._retry_poll = false
    this._doPoll()
  }

  // _doPoll()
  //
  //    Actually poll for whether tor has started yet.  If tor is not
  //    ready yet, we exit via this._polled(), which either waits for
  //    another notification or polls again in case another
  //    notification already came in.
  //
  //    When is tor ready?  We need the control port _and_ the control
  //    authentication cookie.  The tor daemon currently writes the
  //    control port first, and _then_ the control authentication
  //    cookie.  So we open both, and check the mtimes.  If either one
  //    is not there, tor is not ready.  If the cookie is older, it is
  //    stale, from an older run of tor, and so tor is not ready in
  //    that case.
  //
  _doPoll () {
    assert(this._process)
    assert(this._control === null)
    assert(this._polling)

    this._readControlPort((err, portno, portMtime) => {
      if (err) {
        // If there's an error, don't worry: the file may have been
        // written incompletely, and we will, with any luck, be notified
        // again when it has been written completely and renamed to its
        // permanent location.
        console.log(`tor: failed to read control port: ${err}`)
        return this._polled()
      }

      // If the process died in the interim, give up.
      if (!this._process) {
        return this._polled()
      }

      // Assert we're in a sane state: we have a process, we have no
      // control, and we're polling.
      assert(this._process)
      assert(this._control === null)
      assert(this._polling)

      this._readControlCookie((err, cookie, cookieMtime) => {
        if (err) {
          console.log(`tor: failed to read control cookie: ${err}`)
          return this._polled()
        }

        // If the process died in the interim, give up.
        if (!this._process) {
          return this._polled()
        }

        // Assert we're in a sane state: we have a process, we have no
        // control, and we're polling.
        assert(this._process)
        assert(this._control === null)
        assert(this._polling)

        // Tor writes the control port first, then the auth cookie.
        // If the auth cookie is _older_ than the control port, then
        // it's definitely stale.  If they are the _same age_, then
        // probably the control port is older but the file system
        // resolution is just not enough to distinguish them.
        if (cookieMtime < portMtime) {
          console.log(`tor: tossing stale cookie`)
          return this._polled()
        }

        this._openControl(portno, cookie)
      })
    })
  }

  // _polled()
  //
  //    Called when done polling.  If no control socket but asked to
  //    retry, arrange to poll again; otherwise, restore state.
  //
  _polled () {
    assert(this._polling)
    if (this._retry_polling && this._control === null) {
      return process.nextTick(() => this._doPoll())
    }
    this._polling = false
    this._retry_poll = null
  }

  // _readControlPort(callback)
  //
  //    Read the control port.
  //
  _readControlPort (callback) {
    // First, open the control port file.
    fs.open(torControlPortPath(), 'r', (err, fd) => {
      if (err) {
        return callback(err)
      }

      // Get the mtime.
      fs.fstat(fd, (err, stat) => {
        if (err) {
          return callback(err)
        }

        // Read up to 27 octets, the maximum we will ever need.
        const readlen = 'PORT=255.255.255.255:65535\n'.length
        const buf = Buffer.alloc(readlen)
        fs.read(fd, buf, 0, readlen, null, (err, nread, buf) => {
          let portno = null
          do {                    // break for cleanup
            if (err) {
              break
            }

            // Make sure the line looks sensible.
            const line = buf.slice(0, nread).toString('utf8')
            if (!line.startsWith('PORT=') || !line.endsWith('\n')) {
              err = new Error(`invalid control port file`)
              break
            }
            if (!line.startsWith('PORT=127.0.0.1:')) {
              err = new Error(`control port has non-local address`)
              break
            }

            // Parse the port number.
            const portstr = line.slice('PORT=127.0.0.1:'.length, line.length - 1)
            const portno0 = parseInt(portstr, 10)
            if (isNaN(portno) || portno === 0) {
              err = new Error(`invalid control port number`)
              break
            }

            // We'll take it!
            assert(!err)
            portno = portno0
          } while (0)

          // We're done with the control port file; close it.
          fs.close(fd, (err) => {
            if (err) {
              console.log(`tor: close pidfile failed: ${err}`)
            }
          })

          // And call back.
          callback(err, portno, stat.mtime)
        })
      })
    })
  }

  // _readControlCookie(callback)
  //
  //    Read the control cookie.
  //
  _readControlCookie (callback) {
    // First, open the control cookie file.
    fs.open(torControlCookiePath(), 'r', (err, fd) => {
      if (err) {
        return callback(err, null)
      }

      // Get the mtime.
      fs.fstat(fd, (err, stat) => {
        if (err) {
          return callback(err, null)
        }

        // Read up to 33 octets.  We should need no more than 32, so 33
        // will indicate the file is abnormally large.
        const readlen = 33
        const buf = Buffer.alloc(readlen)
        fs.read(fd, buf, 0, readlen, null, (err, nread, buf) => {
          let cookie = null
          do {                    // break for cleanup
            if (err) {
              break
            }

            // Check for probable truncation.
            if (nread === readlen) {
              err = new Error('control cookie too long')
              break
            }

            // We'll take it!
            assert(!err)
            cookie = buf.slice(0, nread)
          } while (0)
          callback(err, cookie, stat.mtime)
        })
      })
    })
  }

  // _openControl(portno, cookie)
  //
  //    Open a control socket, arrange to set up a TorControl to
  //    manage it, and authenticate to it with a null authentication
  //    cookie.
  //
  _openControl (portno, cookie) {
    assert(this._process)
    assert(this._control === null)

    // Create a socket and arrange provisional close/error listeners.
    const controlSocket = new net.Socket()
    const closeMethod = () => console.log('tor: control socket closed')
    const errorMethod = (err) => {
      console.log(`tor: control socket error: ${err}`)
      controlSocket.destroy(err)
    }
    controlSocket.on('close', closeMethod)
    controlSocket.on('error', errorMethod)

    // Now connect the socket.
    controlSocket.connect({port: portno}, () => {
      // If the process died in the interim, give up.
      if (!this._process) {
        console.log('tor: process died, closing control')
        controlSocket.close((err) => {
          if (err) {
            console.log(`tor: close control socket failed: ${err}`)
          }
        })
        return
      }

      // Assert we are in a sane state: we have a process, but we have
      // no control yet.
      assert(this._process)
      assert(this._control === null)

      // Remove our provisional listeners and hand ownership to
      // TorControl.
      controlSocket.removeListener('close', closeMethod)
      controlSocket.removeListener('error', errorMethod)

      const readable = controlSocket
      const writable = controlSocket
      this._control = new TorControl(readable, writable)
      this._control.on('error', (err) => this._controlError(err))
      this._control.on('end', (err) => this._controlClosed(err))
      const hexCookie = cookie.toString('hex')
      this._control.cmd1(`AUTHENTICATE ${hexCookie}`, (err, status, reply) => {
        if (!err) {
          if (status !== '250' || reply !== 'OK') {
            err = new Error(`Tor error ${status}: ${reply}`)
          }
        }
        if (err) {
          console.log(`tor: authentication failure: ${err}`)
          this.kill()
          return
        }
        this._control.getSOCKSListeners((err, listeners) => {
          if (err) {
            console.log(`tor: failed to get socks addresses: ${err}`)
            this.kill()
            return
          }
          this._socks_addresses = listeners
          this.emit('launch', this.getSOCKSAddress())
        })
      })
    })
  }

  // _controlError(err)
  //
  //    Callback for any errors on the control socket.  If we get
  //    anything, close it and kill the process.
  //
  //    TODO(riastradh): Also try to restart tor or anything?
  //
  _controlError (err) {
    assert(this._control)
    console.log(`tor: control socket error: ${err}`)
    this.kill()
  }

  // _controlClosed()
  //
  //    Callback for when the control socket has been closed.  Just
  //    clear it.
  //
  //    TODO(riastradh): Also try to restart tor or anything?
  //
  _controlClosed () {
    assert(this._control)
    // TODO(riastradh): Attempt to reopen it?
    console.log('tor: control socket closed')
    this._control = null
  }

  // getSOCKSAddress()
  //
  //    Returns the current SOCKS address: a string of the form
  //    `<IPv4>:<portno>', `[<IPv6>]:<portno>', or `unix:<pathname>'.
  //    If tor is not initialized yet, or is dead, this returns null
  //    instead.
  //
  getSOCKSAddress () {
    if (!this._socks_addresses) {
      return null
    }
    return this._socks_addresses[0]
  }

  // getControl()
  //
  //    Returns the control socket.
  //
  getControl () {
    return this._control
  }
}

const TOR_ASYNC_EVENTS = {
  ADDRMAP: 1,
  AUTHDIR_NEWDESCS: 1,
  BUILDTIMEOUT_SET: 1,
  BW: 1,
  CELL_STATS: 1,
  CIRC: 1,
  CIRC_BW: 1,
  CIRC_MINOR: 1,
  CLIENTS_SEEN: 1,
  CONF_CHANGED: 1,
  CONN_BW: 1,
  DEBUG: 1,
  DESCCHANGED: 1,
  ERR: 1,
  GUARD: 1,
  HS_DESC: 1,
  // HS_DESC_CONTENT: 1, // omitted because uses data replies
  INFO: 1,
  NETWORK_LIVENESS: 1,
  // NEWCONSENSUS: 1    // omitted because uses data replies
  NEWDESC: 1,
  NOTICE: 1,
  // NS: 1,             // omitted because uses data replies
  ORCONN: 1,
  SIGNAL: 1,
  STATUS_CLIENT: 1,
  STATUS_GENERAL: 1,
  STATUS_SERVER: 1,
  STREAM: 1,
  STREAM_BW: 1,
  TB_EMPTY: 1,
  TRANSPORT_LAUNCHED: 1,
  WARN: 1
}

// TorControl(readable, writable)
//
//      State for a tor control socket interface.
//
//      TODO(riastradh): register close event listeners on readable/writable?
//
class TorControl extends EventEmitter {
  constructor (readable, writable) {
    assert(readable instanceof stream.Readable)
    assert(!readable.isPaused())

    super()

    this._readable = new LineReadable(readable, 4096)
    this._readable_on_line = this._onLine.bind(this)
    this._readable_on_end = this._onEnd.bind(this)
    this._readable_on_error = this._onError.bind(this)
    this._readable.on('line', this._readable_on_line)
    this._readable.on('end', this._readable_on_end)
    this._readable.on('error', this._readable_on_error)

    this._writable = writable
    this._writable_on_error = this._onError.bind(this)
    this._writable.on('error', this._writable_on_error)

    this._cmdq = []

    this._async_keyword = null
    this._async_initial = null
    this._async_extra = null
    this._async_skip = null

    this._tor_events = {}
  }

  close () {
    this._tidy()
    const err = new Error('tor control connection closed')
    while (this._cmdq.length > 0) {
      const [, callback] = this._cmdq.shift()
      callback(err, null, null)
    }
  }

  _tidy () {
    this._readable.removeListener('line', this._readable_on_line)
    this._readable.removeListener('end', this._readable_on_end)
    this._readable.removeListener('error', this._readable_on_error)
    this._writable.removeListener('error', this._writable_on_error)
  }

  _onError (err) {
    console.log(`tor control error: ${err}`)
    this._tidy()
    this.emit('error', err)
    while (this._cmdq.length > 0) {
      const [, callback] = this._cmdq.shift()
      callback(err, null, null)
    }
  }

  _onLine (linebuf, trunc) {
    assert(linebuf instanceof Buffer)

    // Check for line-too-long or line-too-short.
    if (trunc) {
      return this._error('truncated line from tor')
    }
    if (linebuf.length < 4) {
      return this._error('malformed line from tor')
    }

    // Get the line as US-ASCII, and confirm it is only US-ASCII by
    // confirming it survives a decoding/encoding round-trip.
    const line = linebuf.toString('ascii')
    if (!linebuf.equals(Buffer.from(line, 'ascii'))) {
      return this._error('non-US-ASCII in line from tor')
    }

    // Parse out the line into status, position in reply stream, and
    // content.
    //
    // TODO(riastradh): parse or check syntax of status
    const status = line.slice(0, 3)
    const position = line.slice(3, 4)
    const reply = line.slice(4)

    // If it's an asynchronous reply (status 6yz), pass it on
    // asynchronously.
    if (status[0] === '6') {
      assert(this._async_keyword || this._async_keyword === null)
      assert((this._async_keyword === null) === (this._async_extra === null))
      assert((this._async_keyword === null) === (this._async_skip === null))

      if (this._async_keyword === null && position === ' ') {
        // Single-line async reply.
        const sp = reply.indexOf(' ')
        const keyword = (sp === -1 ? reply : reply.slice(0, sp))
        const initial = (sp === -1 ? null : reply.slice(sp + 1))
        if (!(keyword in TOR_ASYNC_EVENTS)) {
          console.log(`ignoring unknown event: ${JSON.stringify(keyword)}`)
          return
        }
        this.emit(`async-${keyword}`, initial, {})
        return
      } else if (this._async_keyword === null && position === '-') {
        // Start a fresh async reply.
        const sp = reply.indexOf(' ')
        const keyword = (sp === -1 ? reply : reply.slice(0, sp))
        const skip = !(keyword in TOR_ASYNC_EVENTS)
        this._async_keyword = keyword
        this._async_initial = (sp === -1 ? null : reply.slice(sp + 1))
        this._async_extra = {}
        this._async_skip = skip
        return
      } else if (this._async_keyword !== null && position === '-') {
        // Contribute to an async reply, unless we're skipping it.
        if (this._async_skip) {
          return
        }
        const [key, value, end] = torControlParseKV(reply, 0, reply.length)
        if (key === null || value === null || end !== reply.length) {
          return this._error('invalid async reply line')
        }
        assert(key)
        assert(value)
        if (key in this._async_extra) {
          return this._error('duplicate key in async reply')
        }
        this._async_extra[key] = value
        return
      } else if (this._async_keyword !== null && position === ' ') {
        // Finish an async reply, unless we're skipping it.
        if (!this._async_skip) {
          const [key, value, end] = torControlParseKV(reply, 0, reply.length)
          if (key === null || value === null || end !== reply.length) {
            return this._error('invalid async reply line')
          }
          assert(key)
          assert(value)
          const keyword = this._async_keyword
          const initial = this._async_initial
          const extra = this._async_extra
          if (key in extra) {
            return this._error('duplicate key in async reply')
          }
          extra[key] = value
          this.emit(`async-${keyword}`, initial, extra)
        }
        this._async_keyword = null
        this._async_initial = null
        this._async_extra = null
        this._async_skip = null
        return
      } else {
        return this._error('invalid async reply line')
      }
      // not reached
    }

    // Synchronous reply.  Return it to the next command callback in
    // the queue.
    switch (position) {
      case '-':
        this.emit('midReply', status, reply)
        if (this._cmdq.length > 0) {
          const [perline] = this._cmdq[0]
          perline(status, reply)
        }
        return
      case '+':
        return this._error('NYI: data reply from tor')
      case ' ':
        this.emit('endReply', status, reply)
        if (this._cmdq.length > 0) {
          const [, callback] = this._cmdq.shift()
          callback(null, status, reply)
        }
        return
      default:
        return this._error('unknown line type from tor')
    }
  }

  _onEnd () {
    if (this._cmdq.length > 0) {
      this._error('Tor control connection closed')
    } else {
      this._tidy()
    }
    this.emit('end')
  }

  _error (msg) {
    this._onError(new Error(msg))
  }

  cmd (cmdline, perline, callback) {
    this._cmdq.push([perline, callback])
    this._writable.cork()
    this._writable.write(cmdline, 'ascii')
    this._writable.write('\r\n')
    process.nextTick(() => this._writable.uncork())
  }

  cmd1 (cmdline, callback) {
    this.cmd(cmdline, (status, reply) => {}, callback)
  }

  newnym (callback) {
    this.cmd1('SIGNAL NEWNYM', (err, status, reply) => {
      if (err) {
        return callback(err)
      } else if (status !== '250') {
        return callback(new Error(`Tor error ${status}: ${reply}`))
      } else {
        return callback(null)
      }
    })
  }

  subscribe (event, callback) {
    if (!(event in TOR_ASYNC_EVENTS)) {
      const err = new Error('invalid tor controller event')
      return process.nextTick(() => callback(err))
    }
    if (event in this._tor_events) {
      this._tor_events[event]++
      return process.nextTick(() => callback(null))
    }
    this._tor_events[event] = 1
    const eventList = Object.keys(this._tor_events).sort().join(' ')
    this.cmd1(`SETEVENTS ${eventList}`, (err, status, reply) => {
      if (!err) {
        if (status !== '250') {
          err = new Error(`tor: ${status} ${reply}`)
        }
      }
      if (err) {
        delete this._tor_events[event]
        return callback(err)
      }
      return callback(null)
    })
  }

  unsubscribe (event, callback) {
    if (!(event in TOR_ASYNC_EVENTS)) {
      const err = new Error('invalid tor controller event')
      return process.nextTick(() => callback(err))
    }
    if (!(event in this._tor_events)) {
      return
    }
    if (this._tor_events[event]-- === 0) {
      delete this._tor_events[event]
      const eventList = Object.keys(this._tor_events).sort().join(' ')
      this.cmd1(`SETEVENTS ${eventList}`, (err, status, reply) => {
        if (!err) {
          if (status !== '250') {
            err = new Error(`tor: ${status} ${reply}`)
          }
        }
        if (err) {
          return callback(err)
        }
        return callback(null)
      })
    }
  }

  _getListeners (purpose, callback) {
    const keyword = `net/listeners/${purpose}`
    let listeners = null
    const perline = (status, reply) => {
      if (status !== '250' || !reply.startsWith(`${keyword}=`) || listeners) {
        console.log(`unexpected GETINFO ${keyword} reply`)
        return
      }
      listeners = []
      const string = reply.slice(`${keyword}=`.length)
      for (let i = 0, j; i < string.length; i = j) {
        let listener
        [listener, j] = torControlParseQuoted(string, i, string.length)
        if (listener === null) {
          // Malformed garbage from Tor.  Give up.
          listeners = null
          return
        }
        listeners.push(listener)
      }
    }
    this.cmd(`GETINFO ${keyword}`, perline, (err, status, reply) => {
      if (err) {
        return callback(err, null)
      } else if (status !== '250' || reply !== 'OK') {
        return callback(new Error(`Tor error ${status}: ${reply}`), null)
      } else if (listeners === null) {
        return callback(new Error('Malformed listeners from Tor'), null)
      } else {
        return callback(null, listeners)
      }
    })
  }

  getSOCKSListeners (callback) {
    return this._getListeners('socks', callback)
  }

  getControlListeners (callback) {
    return this._getListeners('control', callback)
  }
}

// torrcEscapeBuffer(buf)
//
//      Escape a Buffer buf in torrc's format, and return a
//      US-ASCII-only string of it.
//
//      - We must escape leading SPC and TAB because tor will
//        interpret them as the separator between config name and
//        value.
//
//      - We must escape the sequence `\' LF because tor will
//        interpret that as a continuation line.
//
//      To keep it safe, we choose to escape _all_ nonprintable
//      characters, SPC, `\', `#' (comment), and `"'.
//
function torrcEscapeBuffer (buf) {
  assert(buf instanceof Buffer)

  const setbit = (a, b) => { a[b >> 5] |= 1 << (b & 0x1f) }
  const testbit = (a, b) => !!(a[b >> 5] & (1 << (b & 0x1f)))

  // Bit map from octet to true if we must escape the octet.
  const escapeBitmap = new Uint32Array(8)
  for (let i = 0; i < 0x20; i++) { // control characters
    setbit(escapeBitmap, i)
  }
  setbit(escapeBitmap, 0x20)           // SPC
  setbit(escapeBitmap, 0x22)           // `"'
  setbit(escapeBitmap, 0x23)           // `#'
  setbit(escapeBitmap, 0x5c)           // `\'
  for (let i = 0x7f; i < 0x100; i++) { // DEL and 8-bit
    setbit(escapeBitmap, i)
  }

  // Table mapping octet to string notation for that octet, if it must
  // be escaped.
  const escapeString = {
    0x20: ' ',
    0x22: '\\"',
    0x23: '#',
    0x5c: '\\\\'
  }

  const hex = '0123456789abcdef'

  // If it's empty, use double-quotes for clarity.
  if (buf.length === 0) {
    return '""'
  }

  // Find the first character needing escaping, or the end of the
  // string.
  let i
  for (i = 0; i < buf.length; i++) {
    if (testbit(escapeBitmap, buf[i])) {
      break
    }
  }
  let result = buf.toString('ascii', 0, i)
  if (i === buf.length) {
    // No need to quote or escape anything.
    return result
  }

  do {
    // Escape all the characters that need it.
    do {
      if (buf[i] in escapeString) {
        result += escapeString[buf[i]]
      } else {
        let h0 = hex[buf[i] >> 4]
        let h1 = hex[buf[i] & 0xf]
        result += '\\x' + h0 + h1
      }
      i++
    } while (i < buf.length && testbit(escapeBitmap, buf[i]))

    // Break off as large a US-ASCII chunk as we can.
    let start = i
    for (; i < buf.length; i++) {
      if (testbit(escapeBitmap, buf[i])) {
        break
      }
    }
    result += buf.toString('ascii', start, i)
  } while (i < buf.length)

  return '"' + result + '"'
}

// torrcEscapeString(str)
//
//      Escape the UTF-8 encoding of the string str in torrc's format,
//      and return a US-ASCII-only string of it.
//
function torrcEscapeString (str) {
  return torrcEscapeBuffer(Buffer.from(str, 'utf8'))
}

// torrcEscapeString(path)
//
//      Escape a path in torrc's format, encoded as UTF-8, and return
//      a US-ASCII-only string of it.
//
//      Paths are represented by strings, so this is the same as
//      torrcEscapeString, and we cannot handle (e.g.) Unix paths that
//      do not consist of a UTF-8 octet sequence.
//
function torrcEscapePath (path) {
  return torrcEscapeString(path)
}

// torControlParseQuoted(string, start, end)
//
//      Try to parse a quoted string, in the tor control connection's
//      C-style notation, from the given string, in the slice [start,
//      end).
//
//      => On success, return [body, i], where body is the body of the
//         quoted string and i is the first index after the closing
//         quotation mark.
//
//      => On failure, return [null, i], where i is the first index
//         where something went wrong, possibly equal to end if the
//         string lacked a closing quote mark.
//
function torControlParseQuoted (string, start, end) {
  const buf = Buffer.alloc(string.length)
  let pos = 0                   // position in buffer
  let octal = null              // accumulated octet for octal notation
  const S = {
    REJECT: -2,
    ACCEPT: -1,
    START: 1,
    BODY: 2,
    BACKSLASH: 3,
    OCTAL1: 4,
    OCTAL2: 5
  }
  /* eslint-disable no-multi-spaces, indent */
  const transition = (state, c, cp) => {
    switch (state) {
      case S.REJECT:    assert(false); return S.REJECT
      case S.ACCEPT:    assert(false); return S.REJECT
      case S.START:     return c === '"' ? S.BODY : S.REJECT
      case S.BODY:
        switch (c) {
          case '\\':    return S.BACKSLASH
          case '"':     return S.ACCEPT
          default:      buf[pos++] = cp; return S.BODY
        }
      case S.BACKSLASH:
        switch (c) {
          case '0': case '1': case '2': case '3':
          case '4': case '5': case '6': case '7':
            assert(octal === null)
            octal = (cp - '0'.codePointAt(0)) << 6
            return S.OCTAL1
          case 'n':     buf[pos++] = 0x0a;      return S.BODY
          case 'r':     buf[pos++] = 0x0d;      return S.BODY
          case 't':     buf[pos++] = 0x09;      return S.BODY
          case '\\': case '"': case "'":
                        buf[pos++] = cp;        return S.BODY
          default:                              return S.REJECT
        }
      case S.OCTAL1:
        assert(octal !== null)
        switch (c) {
          case '0': case '1': case '2': case '3':
          case '4': case '5': case '6': case '7':
            octal |= (cp - '0'.codePointAt(0)) << 3
            return S.OCTAL2
          default:
            return S.REJECT
        }
      case S.OCTAL2:
        assert(octal !== null)
        switch (c) {
          case '0': case '1': case '2': case '3':
          case '4': case '5': case '6': case '7':
            octal |= cp - '0'.codePointAt(0)
            buf[pos++] = octal
            octal = null
            return S.BODY
          default:
            return S.REJECT
        }
      default:
        return S.REJECT
    }
  }
  /* eslint-enable no-multi-spaces, indent */
  let state = S.START
  for (let i = start; i < end; i++) {
    assert(state)
    const next = transition(state, string[i], string.codePointAt(i))
    assert(next)
    switch (next) {
      case S.REJECT:
        return [null, i]
      case S.ACCEPT:
        const result =
          (pos === end - start ? buf : Buffer.from(buf.slice(0, pos)))
        return [result, i + 1]
      default:
        break
    }
    state = next
  }
  return [null, end]
}

// torControlParseKV(string, start, end)
//
//      Try to parse the value of a keyword=value pair in the tor
//      control connection's optionally-quoted notation.  Return a
//      list [keyword, value, i], where the keyword is returned as a
//      US-ASCII string, the value is returned as a buffer that
//      may contain arbitrary octets, and i is the index of the first
//      position not consumed by torControlParseKV, either end or one
//      position past the space that terminated.
//
//      The string in [start, end) should contain no CR or LF.
//
function torControlParseKV (string, start, end) {
  const eq = string.indexOf('=', start)
  if (eq === -1 || end <= eq) {
    return [null, null, end]
  }
  const keyword = string.slice(start, eq)
  const vstart = eq + 1
  if (vstart === end) {
    return [keyword, Buffer.from(''), end]
  }
  if (string[vstart] !== '"') {
    let vend = end
    let i
    if ((i = string.indexOf(' ', vstart)) !== -1 && i < end) {
      // Stop at the delimiter, and consume it.
      vend = i
      end = i + 1
    }
    if ((i = string.indexOf('"', vstart)) !== -1 && i < vend) {
      // Forbid internal quotes.
      return [null, null, i]
    }
    const value = Buffer.from(string.slice(vstart, vend), 'ascii')
    return [keyword, value, end]
  }
  const [value, j] = torControlParseQuoted(string, eq + 1, end)
  if (value === null) {
    return [null, null, j]
  }
  if (j < end) {
    end = j
    if (string[j] === ' ') {
      end++
    }
  }
  return [keyword, value, end]
}

// LineReadable(readable[, maxlen])
//
//      CRLF-based line reader.  Given an underlying stream.Readable
//      object in unpaused mode, yield an event emitter with line,
//      end, and error events.  Empty line at end of stream is not
//      emitted.  Stray CR or LF is reported as error.  Error is
//      unrecoverable.
//
class LineReadable extends EventEmitter {
  constructor (readable, maxlen) {
    assert(readable instanceof stream.Readable)
    assert(!readable.isPaused())
    super()
    this._readable = readable
    this._maxlen = maxlen
    this._reset()
    this._on_data_method = this._onData.bind(this)
    this._on_end_method = this._onEnd.bind(this)
    readable.on('data', this._on_data_method)
    readable.on('end', this._on_end_method)
  }

  // LineReadable._reset()
  //
  //    Reset the state of the line-reading machine to the start of a
  //    line.
  //
  _reset () {
    this._chunks = []
    this._readlen = 0
    this._cr_seen = false
  }

  // LineReadable._tidy()
  //
  //    Unhook references to this line reader from the underlying
  //    readable.
  //
  _tidy () {
    // Should be nothing left.
    assert(this._readlen === 0)
    assert(this._chunks.length === 0)
    assert(this._cr_seen === false)
    this._readable.removeListener('data', this._on_data_method)
    this._readable.removeListener('end', this._on_end_method)
  }

  // LineReadable._onData(chunk)
  //
  //    Event handler for receipt of data from the readable.
  //    Processes octet by octet to find CRLFs, and emits line events
  //    for each one, or errors if stray CR or LF are found in the
  //    stream.
  //
  _onData (chunk) {
    assert(this._maxlen === null || this._readlen <= this._maxlen)
    assert(chunk instanceof Buffer)
    let start = 0
    let end = (this._cr_seen ? 0 : chunk.length)
    for (let i = 0; i < chunk.length; i++) {
      if (!this._cr_seen) {
        // No CR yet.  Accept CR or non-LF; reject LF.
        if (chunk[i] === 0x0d) {        // CR
          this._cr_seen = true
          end = i
        } else if (chunk[i] === 0x0a) { // LF
          return this._error(chunk, start, 'stray line feed')
        } else {
          // Anything else: if there's no more space, return what's
          // left to the stream and stop here; otherwise consume it
          // and move on.
          if (this._maxlen !== null &&
              i - start === this._maxlen - this._readlen) {
            assert(start < i)
            this._chunks.push(chunk.slice(start, i))
            this._readlen += i - start
            assert(this._readlen === this._maxlen)
            this._line(true)
            start = i
            end = chunk.length
          }
        }
      } else {
        // CR seen.  Accept LF; reject all else.
        if (chunk[i] === 0x0a) {         // LF
          // CRLF seen.  Concatenate what we have, minus CRLF.
          assert(start < end)
          this._chunks.push(chunk.slice(start, end))
          this._readlen += end - start
          this._line(false)
          start = i + 1
          end = chunk.length
        } else {
          // CR seen, but not LF.  Bad.
          return this._error(chunk, start, 'stray carriage return')
        }
      }
    }
    // No CRLF in the chunk.  Store up to CR from chunk and go on.
    assert(start <= end)
    assert(this._maxlen === null || this._readlen <= this._maxlen)
    assert(this._maxlen === null || end - start <= this._maxlen - this._readlen)
    if (start < end) {
      this._chunks.push(chunk.slice(start, end))
      this._readlen += end - start
    }
    assert(this._maxlen === null || this._readlen <= this._maxlen)
  }

  // LineReadable._onEnd()
  //
  //    Event handler for end of underlying readable stream.  Reports
  //    a final line if we have any data, tidies up after ourselves,
  //    and emits an end event.
  //
  _onEnd () {
    // If there's anything stored, report it.
    if (this._readlen !== 0) {
      this._line(false)
    }
    // Tidy up after ourselves.
    this._tidy()
    // Emit the event.
    this.emit('end')
  }

  // LineReadable._line(trunc)
  //
  //    Report a line event, possibly truncated, with the chunks of
  //    data so far accumulated.  Reset the state to the beginning of
  //    a line.
  //
  _line (trunc) {
    // Compute the line.
    const line = Buffer.concat(this._chunks, this._readlen)
    // Reset the state.
    this._reset()
    // Emit the event.
    this.emit('line', line, trunc)
  }

  // LineReadable._error(chunk, start, msg)
  //
  //    Report an error event with the specified message.  Return any
  //    data -- chunk[start], chunk[start+1], ..., chunk[n-1] -- to
  //    the stream.  Reset and tidy up, since we're presumed wedged.
  //
  _error (chunk, start, msg) {
    // Add what's left of the current chunk.
    assert(start < chunk.length)
    this._chunks.push(chunk.slice(start))
    this._readlen += chunk.length - start
    // Restore the chunks we've consumed to the stream.
    this._readable.unshift(Buffer.concat(this._chunks, this._readlen))
    // Reset the state.  No need to hang onto garbage we won't use.
    this._reset()
    // Tidy up after ourselves: we are wedged and uninterested in
    // further events.
    this._tidy()
    // Emit the event.
    this.emit('error', new Error(msg))
  }
}

module.exports.TorControl = TorControl
module.exports.TorDaemon = TorDaemon
module.exports.torControlCookiePath = torControlCookiePath
module.exports.torControlParseKV = torControlParseKV
module.exports.torControlParseQuoted = torControlParseQuoted
module.exports.torControlPortPath = torControlPortPath
module.exports.torDataDirPath = torDataDirPath
module.exports.torrcEscapeBuffer = torrcEscapeBuffer
module.exports.torrcEscapePath = torrcEscapePath
module.exports.torrcEscapeString = torrcEscapeString
