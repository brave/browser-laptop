/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

/**
 * Tor daemon management.
 *
 * This doesn't actually manage the tor daemon: the parts that did are
 * commented out.  Rather it just watches the tor daemon's control
 * port file for activity and connects to its control socket.
 *
 * @module tor
 */

const EventEmitter = require('events')
const assert = require('assert')
const electron = require('electron')
const fs = require('fs')
const net = require('net')
const path = require('path')
const stream = require('stream')

/**
 * Return the path to the directory where we store tor-related files.
 *
 * @returns {path}
 */
function torBravePath () {
  const bravePath = electron.app.getPath('userData')
  return path.join(bravePath, 'tor')
}

/**
 * Return the path to the data directory that we use for our tor
 * daemon.
 *
 * @returns {path}
 */
function torDataDirPath () {
  return path.join(torBravePath(), 'data')
}

/**
 * Return the path to the directory we watch for changes as tor
 * starts up.
 *
 * @returns {path}
 */
function torWatchDirPath () {
  return path.join(torBravePath(), 'watch')
}

/**
 * Return the path to the file containing the port number for the
 * control channel that our tor daemon is listening on.
 *
 * @returns {path}
 */
function torControlPortPath () {
  return path.join(torWatchDirPath(), 'controlport')
}

/*
 * Return the path to the file containing the control connection
 * authentication cookie.
 *
 * @returns {path}
 */
function torControlCookiePath () {
  return path.join(torWatchDirPath(), 'control_auth_cookie')
}

/**
 * State for a tor daemon subprocess.
 */
class TorDaemon extends EventEmitter {
  /**
   * Initialization-only constructor.  No parameters, no nontrivial
   * computation, no I/O.
   */
  constructor () {
    super()
    this._process = null        // child process
    this._watcher = null        // fs watcher
    this._polling = false       // true if we are polling for start
    this._retry_poll = null     // set if polling, true if should retry on fail
    this._control = null        // TorControl instance
    this._socks_addresses = null // array of tor's socks addresses
    this._tor_version = null    // string of tor version number
  }

  /**
   * Create the necessary directories and invoke callback when done.
   * We assume the parent of torBravePath exists; we create it and
   * everything we need underneath it.  On failure other than EEXIST,
   * may leave directories partially created.
   *
   * @param {Function(Error)} callback
   */
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

  /**
   * Start the tor daemon and start watching for it to start up.
   * Caller must ensure that the necessary directories have been
   * created with {@link TorDaemon#setup}.
   *
   * This function is asynchronous.  If the tor daemon successfully
   * launches, this emits a `'launch'` event with the SOCKS address on
   * which it is listening.  If the tor daemon exits, this emits an
   * `'exit'` event.
   */
  start () {
    // Begin watching for the control port file to be written.
    const watchDir = torWatchDirPath()
    const watchOpts = {persistent: false}
    assert(this._watcher === null)
    this._watcher = fs.watch(watchDir, watchOpts, (event, filename) => {
      this._watchEvent(event, filename)
    })

    this._process = 'i am the very seeming of a child process daemon'

    // Defer to the next tick so that the user can reliably do
    //
    //          torDaemon.start()
    //          torDaemon.on('launch', ...)
    process.nextTick(() => this._poll())
  }

  /**
   * Kill the tor daemon.
   */
  kill () {
    assert(this._watcher)
    this._watcher.close()
    this._watcher = null
    if (!this._process) {
      assert(this._process === null)
      assert(this._control === null)
      return
    }
    if (this._control) {
      this._control.close()
    }
  }

  /**
   * Internal subroutine.  Called by fs.watch when the tor watch
   * directory is changed.  If the control port file is newly written,
   * then the control socket should be available now.
   *
   * Note: filename is documented to be unreliable, so we don't use
   * it.  Instead we just check whether the control port file is
   * written and matches.
   *
   * @param {string} event
   * @param {string} filename
   */
  _watchEvent (event, filename) {
    // If the process died in the interim, give up.
    if (!this._process) {
      console.log('tor: process dead, ignoring watch event')
      return
    }

    // Watcher shouldn't be there without process.
    assert(this._watcher)

    // If the control connection is already open, nothing to do.
    if (this._control) {
      return
    }

    this._poll()
  }

  /**
   * Internal subroutine.  Poll for whether tor has started yet, or if
   * there is a poll already pending, tell it to retry in case it
   * fails.
   */
  _poll () {
    assert(this._process)
    assert(this._control === null)

    if (this._polling) {
      this._retry_poll = true
      return
    } else {
      assert(this._retry_poll === null)
    }
    this._polling = true
    this._retry_poll = false
    this._doPoll()
  }

  /**
   * Internal subroutine.  Actually poll for whether tor has started
   * yet.  If tor is not ready yet, we exit via this._polled(), which
   * either waits for another notification or polls again in case
   * another notification already came in.
   *
   * When is tor ready?  We need the control port _and_ the control
   * authentication cookie.  The tor daemon currently writes the
   * control port first, and _then_ the control authentication
   * cookie.  So we open both, and check the mtimes.  If either one
   * is not there, tor is not ready.  If the cookie is older, it is
   * stale, from an older run of tor, and so tor is not ready in
   * that case.
   */
  _doPoll () {
    assert(this._process)
    assert(this._control === null)
    assert(this._polling)

    this._eatControlCookie((err, cookie, cookieMtime) => {
      if (err) {
        // If there's an error, don't worry: the file may have been
        // written incompletely, and we will, with any luck, be notified
        // again when it has been written completely and renamed to its
        // permanent location.
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

      this._eatControlPort((err, portno, portMtime) => {
        if (err) {
          // If there's an error, don't worry: the file may not be
          // ready yet, and we'll be notified when it is.
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

  /**
   * Internal subroutine.  Called when done polling.  If no control
   * socket but asked to retry, arrange to poll again; otherwise,
   * restore state.
   */
  _polled () {
    assert(this._polling)
    if (this._retry_poll && this._control === null) {
      return process.nextTick(() => this._doPoll())
    }
    this._polling = false
    this._retry_poll = null
  }

  /*
   * Internal subroutine.  Move the control port out of the way to
   * commit to it, and read the control port and its mtime.
   *
   * @param {Function(Error, number, Date)} callback
   */
  _eatControlPort (callback) {
    // First, rename the file, so that we don't read a stale one later.
    const oldf = torControlPortPath()
    const newf = torControlPortPath() + '.ack'
    fs.rename(oldf, newf, (err) => {
      if (err) {
        return callback(err, null, null)
      }

      // Then open the committed control port file.
      fs.open(newf, 'r', (err, fd) => {
        if (err) {
          return callback(err, null, null)
        }

        // Get the mtime.
        fs.fstat(fd, (err, stat) => {
          if (err) {
            return callback(err, null, null)
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
              const portstr = line.slice(
                'PORT=127.0.0.1:'.length, line.length - 1)
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
                console.log(`tor: close control port file failed: ${err}`)
              }
            })

            // And call back.
            callback(err, portno, stat.mtime)
          })
        })
      })
    })
  }

  /**
   * Internal subroutine.  Move the control cookie out of the way to
   * commit to it, and read the control cookie and its mtime.
   *
   * @param {Function(Error, Buffer, Date)} callback
   */
  _eatControlCookie (callback) {
    // First, rename the file, so that we don't read a stale one later.
    const oldf = torControlCookiePath()
    const newf = torControlCookiePath() + '.ack'
    fs.rename(oldf, newf, (err) => {
      if (err) {
        return callback(err, null, null)
      }

      // Then open the control cookie file.
      fs.open(newf, 'r', (err, fd) => {
        if (err) {
          return callback(err, null, null)
        }

        // Get the mtime.
        fs.fstat(fd, (err, stat) => {
          if (err) {
            return callback(err, null, null)
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

            // We're done with the control cookie file; close it.
            fs.close(fd, (err) => {
              if (err) {
                console.log(`tor: close control auth cookie file failed: ${err}`)
              }
            })

            // And call back.
            callback(err, cookie, stat.mtime)
          })
        })
      })
    })
  }

  /**
   * Internal subroutine.  Open a control socket, arrange to set up a
   * TorControl to manage it, and authenticate to it with a null
   * authentication cookie.
   *
   * @param {number} portno
   * @param {Buffer} cookie - secret authentication cookie in raw bits
   */
  _openControl (portno, cookie) {
    assert(this._process)
    assert(this._control === null)

    // Create a socket and arrange provisional close/error listeners.
    const controlSocket = new net.Socket()
    const closeMethod = () => console.log('tor: control socket closed early')
    const errorMethod = (err) => {
      console.log(`tor: control socket connection error: ${err}`)
      controlSocket.destroy(err)
      return this._polled()
    }
    controlSocket.on('close', closeMethod)
    controlSocket.on('error', errorMethod)

    // Now connect the socket.
    controlSocket.connect({host: '127.0.0.1', port: portno}, () => {
      // If the process died in the interim, give up.
      if (!this._process) {
        console.log('tor: process died, closing control')
        controlSocket.close((err) => {
          if (err) {
            console.log(`tor: close control socket failed: ${err}`)
          }
        })
        return this._polled()
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
      this._control.on('close', () => this._controlClosed())

      // We have finished polling, _and_ we are scheduled to be
      // notified either by (a) our file system activity watcher, or
      // (b) failure on the control channel.  That way we won't lose
      // any notifications that tor has restarted.
      this._polled()

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
          this._control.getVersion((err, version) => {
            if (err) {
              console.log(`tor: failed to get version: ${err}`)
              this.kill()
              return
            }
            this._tor_version = version
            this.emit('launch', this.getSOCKSAddress())
          })
        })
      })
    })
  }

  /**
   * Internal subroutine.  Callback for any errors on the control
   * socket.  Report it to the console and give up by destroying the
   * control connection.
   *
   * @param {Error} err
   */
  _controlError (err) {
    assert(this._control)
    console.log(`tor: control socket error: ${err}`)
    this._control.destroy(err)
  }

  /*
   * Internal subroutine.  Callback for when the control socket has
   * been closed.  Clear it, and interpret it to mean the tor process
   * has exited.
   *
   * TODO(riastradh): Also try to restart tor or anything?
   */
  _controlClosed () {
    assert(this._control)
    this._control = null
    // Assume this means the process exited.
    this.emit('exit')
    // Poll in case we received a watch event for file system activity
    // before we actually closed the channel.
    this._poll()
  }

  /**
   * Returns the current SOCKS address: a string of the form
   * `<IPv4>:<portno>', `[<IPv6>]:<portno>', or `unix:<pathname>'.
   * If tor is not initialized yet, or is dead, this returns null
   * instead.
   *
   * @returns {string} SOCKS socket address as string
   */
  getSOCKSAddress () {
    if (!this._socks_addresses) {
      return null
    }
    return this._socks_addresses[0]
  }

  /**
   * Returns the version of the software running the tor daemon.  If
   * tor is not initialized yet, or is dead, this returns null
   * instead.
   *
   * @returns {string} tor version number as string
   */
  getVersion () {
    return this._tor_version
  }

  /**
   * Returns the control socket.
   *
   * @returns {TorControl}
   */
  getControl () {
    return this._control
  }

  /**
   * Internal subroutine.  Arrange to call handler for asynchronous
   * events about info.
   *
   * @param {string} event - STATUS_CLIENT, STATUS_GENERAL, &c.
   * @param {dict} keys - BOOTSTRAP, CIRCUIT_ESTABLISHED, &c.
   * @param {string} info - status/bootstrap-phase, status/circuit-established
   * @param {Function(Error, string)} statusHandler - called asynchronously
   * @param {Function(Error, string)} infoHandler - called for GETINFO
   * @param {Function(Error)} callback
   */
  _torStatus (event, keys, info, statusHandler, infoHandler, callback) {
    const control = this._control
    // Subscribe to events.
    const statusListener = (data, extra) => {
      const args = data.split(' ') // TODO(riastradh): better parsing
      if (args.length < 2) {
        console.log(`tor: warning: truncated ${event}`)
        return
      }
      if (!(args[1] in keys)) {
        // Not for us!
        return
      }
      let err = null
      if (args[0] === 'ERR') {
        err = new Error(`${data}`)
      }
      statusHandler(err, data)
    }
    control.on(`async-${event}`, statusListener)
    control.subscribe(event, (err) => {
      if (err) {
        control.removeListener(`async-${event}`, statusListener)
        return callback(err)
      }
      // Run `GETINFO ${info}' to kick us off, in case it's a long
      // time to the next phase or we're wedged.
      const getinfoLine = (status, reply) => {
        if (status !== '250') {
          const err = new Error(`${status} ${reply}`)
          return infoHandler(err, null)
        }
        const prefix = `${info}=`
        if (!reply.startsWith(prefix)) {
          const err = new Error(`bogus ${info}: ${reply}`)
          return infoHandler(err, null)
        }
        const data = reply.slice(prefix.length)
        return infoHandler(err, data)
      }
      control.cmd(`GETINFO ${info}`, getinfoLine, (err, status, reply) => {
        if (!err) {
          if (status !== '250') {
            err = new Error(`${status} ${reply}`)
          }
        }
        if (err) {
          // TODO(riastradh): Unsubscribe and remove listener or not?
          return callback(err)
        }
        // Success!
        return callback(null)
      })
    })
  }

  /**
   * Arrange to call handler with the current bootstrap progress and
   * every time it changes.  The handler may be called before or after
   * the callback.
   *
   * TODO(riastradh): No way to deregister.
   *
   * @param {Function(Error, string)} handler
   * @param {Function(Error)} callback
   */
  onBootstrap (handler, callback) {
    const handleStatus = (err, data) => {
      // <severity> BOOTSTRAP ... PROGRESS=<num>
      const args = data.split(' ') // TODO(riastradh): better parsing
      assert(args.length >= 2)
      // Find the progress.  args[0] is ERR/WARN/NOTICE; args[1] is
      // BOOTSTRAP.
      assert(args[1] === 'BOOTSTRAP')
      for (let i = 2; i < args.length; i++) {
        const [k, v] = args[i].split('=')
        if (k === 'PROGRESS') {
          return handler(err, v)
        }
      }
      // No progress.  If there isn't an error already, treat it as
      // one.
      if (!err) {
        err = new Error(`bootstrap without progress: ${data}`)
      }
      handler(err, null)
    }
    const handleInfo = (err, data) => {
      // <severity> BOOTSTRAP ... PROGRESS=<num>
      const args = data.split(' ') // TODO(riastradh): better parsing
      if (args.length < 2) {
        console.log(`tor: warning: truncated ${event}`)
        return
      }
      if (args[1] !== 'BOOTSTRAP') {
        // Not for us!
        return
      }
      if (!err && args[0] === 'ERR') {
        err = new Error(`${data}`)
      }
      handleStatus(err, data)
    }
    const event = 'STATUS_CLIENT'
    const keys = {BOOTSTRAP: 1}
    const info = 'status/bootstrap-phase'
    this._torStatus(event, keys, info, handleStatus, handleInfo, callback)
  }

  /**
   * Arrange to call handler when tor thinks it can or cannot build
   * circuits for client use.  The handler may be called before or
   * after the callback.
   *
   * @param {Function(Error, string)} handler
   * @param {Function(Error)} callback
   */
  onCircuitEstablished (handler, callback) {
    const handleStatus = (err, data) => {
      if (err) {
        return handler(err, null)
      }
      // <severity> CIRCUIT_ESTABLISHED
      // <severity> CIRCUIT_NOT_ESTABLISHED
      const args = data.split(' ') // TODO(riastradh): better parsing
      if (args[1] === 'CIRCUIT_ESTABLISHED') {
        handler(null, true)
      } else if (args[1] === 'CIRCUIT_NOT_ESTABLISHED') {
        let err = null
        for (let i = 2; i < args.length; i++) {
          const [k, v] = args[i].split('=')
          if (k === 'REASON') {
            err = new Error(`tor: ${v}`)
            break
          }
        }
        handler(err, false)
      } else {
        const err = new Error(`tor: bogus circuit establishment info: ${data}`)
        handler(err, null)
      }
    }
    const handleInfo = (err, s) => {
      if (err) {
        return handler(err, null)
      }
      // 0 or 1
      if (s === '1') {
        handler(null, true)
      } else if (s === '0') {
        handler(null, false)
      } else {
        err = new Error(`tor: bogus circuit establishment info: ${s}`)
        handler(err, false)
      }
    }
    const event = 'STATUS_CLIENT'
    const keys = {CIRCUIT_ESTABLISHED: 1, CIRCUIT_NOT_ESTABLISHED: 1}
    const info = 'status/circuit-established'
    this._torStatus(event, keys, info, handleStatus, handleInfo, callback)
  }

  /**
   * Arrange to call handler when tor thinks the network is up or
   * down.  The handler may be called before or after the callback.
   *
   * @param {Function(boolean)} handler
   * @param {Function(Error)} callback
   */
  onNetworkLiveness (handler, callback) {
    const control = this._control
    // Subscribe to events.
    const statusListener = (data, extra) => {
      const liveness = {UP: true, DOWN: false}
      if (!(data in liveness)) {
        console.log(`tor: warning: invalid network liveness: ${data}`)
        return
      }
      handler(liveness[data])
    }
    control.on('async-NETWORK_LIVENESS', statusListener)
    control.subscribe('NETWORK_LIVENESS', (err) => {
      if (err) {
        control.removeListener('async-NETWORK_LIVENESS', statusListener)
        return callback(err)
      }
      // Run `GETINFO network-liveness' to find out what state we're
      // in now before the next state change event.
      let err0 = null
      const getinfoLine = (status, reply) => {
        const liveness = {up: true, down: false}
        if (status !== '250') {
          err0 = err0 || new Error(`${status} ${reply}`)
          return
        }
        const prefix = 'network-liveness='
        if (!reply.startsWith(prefix)) {
          err0 = err0 || new Error(`bogus network-liveness: ${reply}`)
          return
        }
        const data = reply.slice(prefix.length)
        if (!(data in liveness)) {
          err0 = err0 || new Error(`bogus network-liveness: ${data}`)
          return
        }
        return handler(liveness[data])
      }
      const cmd = 'GETINFO network-liveness'
      control.cmd(cmd, getinfoLine, (err, status, reply) => {
        if (!err) {
          if (err0) {
            err = err0
          } else if (status !== '250') {
            err = new Error(`${status} ${reply}`)
          }
        }
        if (err) {
          control.removeListener('async-NETWORK_LIVENESS', statusListener)
          control.unsubscribe('NETWORK_LIVENESS', (err1) => {
            return callback(err)
          })
        }
        // Success!
        return callback(null)
      })
    })
  }
}

/**
 * Set of all recognized asynchronous event types in the tor control
 * connection for use with SETEVENTS.
 */
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

/**
 * Internal utility class.  State for a tor control socket interface.
 *
 * Emits the following events:
 *
 * async-${KEYWORD}(line, extra)
 * - on asynchronous events from Tor subscribed with
 *   TorControl.subscribe.
 *
 * error(err)
 * - on error
 *
 * close
 * - at most once when the control connection closes; no more events
 *   will be emitted.
 */
class TorControl extends EventEmitter {
  /**
   * Constructor.  Takes ownership of readable and writable to read
   * from and write to them.  The readable must not be paused.
   *
   * @param {Readable} readable - source for output of tor control connection
   * @param {Writable} writable - sink for input to control connection
   */
  constructor (readable, writable) {
    assert(readable instanceof stream.Readable)
    assert(!readable.isPaused())

    super()

    this._readable = new LineReadable(readable, 4096)
    this._readable_on_line = this._onLine.bind(this)
    this._readable_on_error = this._onError.bind(this)
    this._readable_on_end = this._onEnd.bind(this)
    this._readable_on_close = this._onClose.bind(this)
    this._readable.on('line', this._readable_on_line)
    this._readable.on('error', this._readable_on_error)
    this._readable.on('end', this._readable_on_end)
    this._readable.on('close', this._readable_on_close)

    this._writable = writable
    this._writable_on_error = this._onError.bind(this)
    this._writable_on_close = this._onClose.bind(this)
    this._writable.on('error', this._writable_on_error)
    this._writable.on('close', this._writable_on_close)

    this._destroyed = false
    this._closing = 2           // count of {reader, writer} left to close

    this._cmdq = []

    this._async_keyword = null
    this._async_initial = null
    this._async_extra = null
    this._async_skip = null

    this._tor_events = {}
  }

  /**
   * Destroy the control connection:
   * - Destroy the underlying streams.
   * - Remove any listeners on the readable and writable.
   * - Mark the control closed so it can't be used any more.
   * - Pass an error to all callbacks waiting for command completion.
   *
   * @param {Error} err
   */
  destroy (err) {
    assert(!this._destroyed)
    this._readable.destroy(err)
    this._writable.end()
    this._writable.destroy(err)
    this._readable.removeListener('line', this._readable_on_line)
    this._readable.removeListener('error', this._readable_on_error)
    this._readable.removeListener('end', this._readable_on_end)
    this._readable.removeListener('close', this._readable_on_close)
    this._writable.removeListener('error', this._writable_on_error)
    this._writable.removeListener('close', this._writable_on_close)
    this._destroyed = true
    while (this._cmdq.length > 0) {
      const [, callback] = this._cmdq.shift()
      callback(err, null, null)
    }
    assert(this._closing === 0)
  }

  /**
   * Internal subroutine.  Callback for {@link LineReadable} `'line'`
   * event on receipt of a line of input, either complete or truncated
   * at the maximum length.  Parse the line and handle it, triggering
   * any asynchronous events or calling a command callback as
   * appropriate.
   *
   * @param {Buffer} linebuf
   * @param {boolean} trunc
   */
  _onLine (linebuf, trunc) {
    assert(!this._destroyed)
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
      this.emit('asyncReply', status, reply)

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

  /**
   * Internal subroutine.  Callback for {@link LineReadable} `'end'`
   * event.  If there were still any commands pending in the queue,
   * emit an `'error'` event.  Then, either way, emit our own `'end'`
   * event for anyone listening.
   */
  _onEnd () {
    assert(!this._destroyed)
    if (this._cmdq.length > 0) {
      this._error('tor: control connection closed prematurely')
    }
    this.emit('end')
  }

  /**
   * Internal subroutine.  Callback for errors on the enclosed
   * readable or writable.  Pass it along.
   *
   * @param {Error} err
   */
  _onError (err) {
    assert(!this._destroyed)
    this.emit('error', err)
  }

  /**
   * Internal subroutine.  Callback for closure of readable or
   * writable.  When both are closed, pass it along.
   */
  _onClose () {
    assert(!this._destroyed)
    assert(this._closing > 0)
    assert(this._closing <= 2)
    if (--this._closing === 0) {
      this.emit('close')
    }
    assert(this._closing >= 0)
    assert(this._closing < 2)
  }

  /**
   * Internal subroutine.  Emit an error with a prescribed message.
   *
   * @param {string} msg
   */
  _error (msg) {
    this.emit('error', new Error(msg))
  }

  /**
   * Function invoked for every middle line of multi-line output from
   * a command send to tor on the control connection.
   *
   * @callback perlineCallback
   * @param {string} status - three-digit status code, e.g. 250
   * @param {string} reply - text of reply after status code
   */

  /**
   * Callback invoked once on error or for the last line of output
   * from a command send to tor on a control connection.  If tor
   * returns an _error code_, err will be null in that case; it is the
   * _callback's_ responsibility to interpret that as an error.
   *
   * @callback cmdCallback
   * @param {Error} err
   * @param {string} status - three-digit status code, e.g. 250
   * @param {string} reply - text of reply after status code
   */

  /**
   * Send a command to the tor controller.  Invoke perline for every
   * middle line of multi-line output, and callback exactly once
   * either on error or for the last line.
   *
   * @param {string} cmdline
   * @param {perlineCallback} perline
   * @param {cmdCallback} callback
   */
  cmd (cmdline, perline, callback) {
    this.emit('cmd', cmdline)
    assert(!this._destroyed)
    this._cmdq.push([perline, callback])
    this._writable.cork()
    this._writable.write(cmdline, 'ascii')
    this._writable.write('\r\n')
    process.nextTick(() => this._writable.uncork())
  }

  /**
   * Shortcut for {@link TorDaemon.cmd} with a per-line callback that
   * does nothing, for commands that are expected to have only one
   * final line of output or whose middle lines the caller doesn't
   * care about.
   *
   * TODO(riastradh): Maybe distinguish the cases where we _expect no
   * middle lines_ versus we _don't care about middle lines_.
   *
   * @param {string} cmdlind
   * @param {cmdCallback} callback
   */
  cmd1 (cmdline, callback) {
    this.cmd(cmdline, (status, reply) => {}, callback)
  }

  /**
   * Send SIGNAL NEWNYM to tor to get a fresh circuit any subsequent
   * connection.
   *
   * @param {Function(Error)} callback
   */
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

  /**
   * Subscribe to the named asynchronous event by sending SETEVENTS to
   * tor with the named event included, and calling the callback when
   * tor has acknowledged the change in event subscriptions.
   * Subsequently, when tor sends asynchronous replies for that event,
   * `'async-${event}'` events will be emitted.
   *
   * Subcribing to an event again has no effect except to add to the
   * number of times it has been subscribed.  Do not send SETEVENTS
   * explicitly because subscriptions to any events _not_ listed will
   * be cancelled.  {@link TorControl} keeps track of the set of event
   * subscriptions.
   *
   * @param {string} event - an event in {@link TOR_ASYNC_EVENTS}
   * @param {Function(Error)} callback
   */
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

  /**
   * Unsubscribe to the named asynchronous event by sending SETEVENTS
   * to tor with the named event excluded, and calling the callback
   * when tor has acknowledged the change in event subscriptions.
   *
   * Unsubscribing from an event with more than one subscription has
   * no effect except to debit from the number of times it has been
   * subscribed.
   *
   * @param {string} event - an event in {@link TOR_ASYNC_EVENTS}
   * @param {Function(Error)} callback
   */
  unsubscribe (event, callback) {
    if (!(event in TOR_ASYNC_EVENTS)) {
      const err = new Error('invalid tor controller event')
      return process.nextTick(() => callback(err))
    }
    if (!(event in this._tor_events)) {
      return process.nextTick(() => callback(null))
    }
    if (--this._tor_events[event] === 0) {
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
    } else {
      return callback(null)
    }
  }

  /**
   * Internal subroutine.  Send `GETINFO net/listeners/${purpose}` and
   * return the list of replies to the callback, or an error.
   *
   * @param {string} purpose
   * @param {Function(Error, string[])} callback
   */
  _getListeners (purpose, callback) {
    const keyword = `net/listeners/${purpose}`
    let listeners = null
    const perline = (status, reply) => {
      if (status !== '250' || !reply.startsWith(`${keyword}=`) || listeners) {
        console.log(`tor: unexpected GETINFO ${keyword} reply`)
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

  /**
   * Request the list of SOCKS listeners from tor and return the list
   * to callback, or an error.
   *
   * @param {Function(error, string[])} callback
   */
  getSOCKSListeners (callback) {
    return this._getListeners('socks', callback)
  }

  /**
   * Request the list of control connection listeners from tor and
   * return the list to callback, or an error.
   *
   * @param {Function(error, string[])} callback
   */
  getControlListeners (callback) {
    return this._getListeners('control', callback)
  }

  /**
   * Request the tor version number and return it as a string to the
   * callback, or an error.
   *
   * @param {Function(error, string)} callback
   */
  getVersion (callback) {
    let version = null
    const perline = (status, reply) => {
      if (status !== '250' || !reply.startsWith('version=') || version) {
        console.log('tor: unexpected GETINFO version reply')
        return
      }
      version = reply.slice('version='.length)
    }
    this.cmd('GETINFO version', perline, (err, status, reply) => {
      if (err) {
        return callback(err, null)
      } else if (status !== '250' || reply !== 'OK') {
        return callback(new Error(`Tor error ${status}: ${reply}`), null)
      } else if (version === null) {
        return callback(new Error('Tor failed to return version'), null)
      } else {
        return callback(null, version)
      }
    })
  }
}

/**
 * Escape a Buffer buf in torrc's format, and return a US-ASCII-only
 * string of it.
 *
 * - We must escape leading SPC and TAB because tor will interpret
 *   them as the separator between config name and value.
 *
 * - We must escape the sequence `\' LF because tor will interpret
 *   that as a continuation line.
 *
 * To keep it safe, we choose to escape _all_ nonprintable characters,
 * SPC, `\', `#' (comment), and `"'.
 *
 * @param {Buffer} buf
 * @returns string
 */
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

/**
 * Escape the UTF-8 encoding of the string str in torrc's format, and
 * return a US-ASCII-only string of it.
 *
 * @param {string} str
 * @returns string
 */
function torrcEscapeString (str) {
  return torrcEscapeBuffer(Buffer.from(str, 'utf8'))
}

/**
 * Escape a path in torrc's format, encoded as UTF-8, and return a
 * US-ASCII-only string of it.
 *
 * Paths are represented by strings, so this is the same as
 * torrcEscapeString, and we cannot handle (e.g.) Unix paths that do
 * not consist of a UTF-8 octet sequence.
 *
 * @param {string} path
 * @returns string
 */
function torrcEscapePath (path) {
  return torrcEscapeString(path)
}

/**
 * Try to parse a quoted string, in the tor control connection's
 * C-style notation, from the given string, in the slice [start, end).
 *
 * => On success, return [body, i], where body is the body of the
 *    quoted string and i is the first index after the closing
 *    quotation mark.
 *
 * => On failure, return [null, i], where i is the first index where
 *    something went wrong, possibly equal to end if the string lacked
 *    a closing quote mark.
 *
 * @param {string} string
 * @param {number} start - inclusive start index
 * @param {number} end - exclusive end index
 * @returns [string, number]
 */
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

/**
 * Try to parse the value of a keyword=value pair in the tor control
 * connection's optionally-quoted notation.  Return a list [keyword,
 * value, i], where the keyword is returned as a US-ASCII string, the
 * value is returned as a buffer that may contain arbitrary octets,
 * and i is the index of the first position not consumed by
 * torControlParseKV, either end or one position past the space that
 * terminated.
 *
 * The string in [start, end) should contain no CR or LF.
 *
 * @param {string} string
 * @param {number} start - inclusive start index
 * @param {number} end - exclusive end index
 * @returns [string, number, number]
 */
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

/**
 * Internal utility class.  CRLF-based line reader.  Given an
 * underlying stream.Readable object in unpaused mode, yield an event
 * emitter with `'line'`, `'end'`, `'error'`, and `'close'` events.
 * Empty line at end of stream is not emitted.  Stray CR or LF is
 * reported as error.  Error is unrecoverable.
 */
class LineReadable extends EventEmitter {
  /**
   * Constructor.  Takes ownership of readable to read from it.  The
   * readable must not be paused.  If specified, maxlen is the maximum
   * number of octets in a line before it is truncated and emitted in
   * a `'line'` event anyway.
   */
  constructor (readable, maxlen) {
    assert(readable instanceof stream.Readable)
    assert(!readable.isPaused())
    super()
    this._readable = readable
    this._maxlen = maxlen
    this._reset()
    this._on_data_method = this._onData.bind(this)
    this._on_error_method = this._onError.bind(this)
    this._on_end_method = this._onEnd.bind(this)
    this._on_close_method = this._onClose.bind(this)
    readable.on('data', this._on_data_method)
    readable.on('error', this._on_error_method)
    readable.on('end', this._on_end_method)
    readable.on('close', this._on_close_method)

    this._ended = false
  }

  /**
   * Destroy the stream, passing any error down to Readable.destroy
   * for the underlying readable.
   *
   * @param {Error} err
   */
  destroy (err) {
    this._readable.destroy(err)
    // Make sure we're tidied up.
    this._tidy()
  }

  /**
   * Internal subroutine.  Reset the state of the line-reading machine
   * to the start of a line.
   */
  _reset () {
    this._chunks = []
    this._readlen = 0
    this._cr_seen = false
  }

  /**
   * Internal subroutine.  Discard garbage we're not interested in
   * hanging onto.  Unhook references to this line reader from the
   * underlying readable.
   *
   * Idempotent.
   */
  _tidy () {
    this._reset()
    // Should be nothing left.
    assert(this._readlen === 0)
    assert(this._chunks.length === 0)
    assert(this._cr_seen === false)
    this._readable.removeListener('data', this._on_data_method)
    this._readable.removeListener('error', this._on_error_method)
    this._readable.removeListener('end', this._on_end_method)
    this._readable.removeListener('close', this._on_close_method)
  }

  /**
   * Internal subroutine.  Handler for `'data'` event, for receipt of
   * data from the readable.  Processes octet by octet to find CRLFs,
   * and emits line events for each one, or errors if stray CR or LF
   * are found in the stream.
   *
   * @param {Buffer} data
   */
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

  /**
   * Internal subroutine.  Handler for `'error'` event, for error in
   * the underlying stream.  Pass it along.
   */
  _onError (err) {
    this.emit('error', err)
  }

  /**
   * Internal subroutine.  Handler for `'end'` event, for end of
   * underlying readable stream.  Reports a final line if we have any
   * data.  Emits an end event if not already emitted owing to bad
   * input.
   */
  _onEnd () {
    // If there's anything stored, report it.
    if (this._readlen !== 0) {
      this._line(false)
    }
    // Emit the end event.
    if (!this._ended) {
      this._ended = true
      this.emit('end')
    }
  }

  /**
   * Internal subroutine.  Handler for `'close'` event, for when the
   * underlying stream is closed.  Tidy up and pass it along.
   */
  _onClose () {
    // Pass the event along.
    this.emit('close')
    // Make sure we're tidied up.
    this._tidy()
  }

  /**
   * Internal subroutine.  Report a line event, possibly truncated,
   * with the chunks of data so far accumulated.  Reset the state to
   * the beginning of a line.
   *
   * @param {boolean} trunc
   */
  _line (trunc) {
    // Compute the line.
    const line = Buffer.concat(this._chunks, this._readlen)
    // Reset the state.
    this._reset()
    // Emit the event.
    this.emit('line', line, trunc)
  }

  /**
   * Internal subroutine.  Report an error event with the specified
   * message.  Return any data -- chunk[start], chunk[start+1], ...,
   * chunk[n-1] -- to the stream.  Reset and tidy up, since we're
   * presumed wedged.
   *
   * @param {Buffer} chunk
   * @param {number} start
   * @param {string} msg
   */
  _error (chunk, start, msg) {
    // Add what's left of the current chunk.
    assert(start < chunk.length)
    this._chunks.push(chunk.slice(start))
    this._readlen += chunk.length - start
    // Restore the chunks we've consumed to the stream.
    this._readable.unshift(Buffer.concat(this._chunks, this._readlen))
    // Tidy up after ourselves: we are wedged and uninterested in
    // further events.
    this._tidy()
    // Emit the error.
    this.emit('error', new Error(msg))
    // Emit the end and mark us ended.
    this.emit('end')
    this._ended = true
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
